import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import {
  AssessmentFacade,
  type ContextPackConfig,
} from '@modules/interview-assessment/contracts';
import {
  describeAIError,
  isAIFallbackEligible,
} from '@infra/ai/ai-error.utils';
import {
  AI_GATEWAY_TOKEN,
  type IAIGateway,
} from '@infra/ai/ai-gateway.interface';
import { resolveOutputLanguage } from '@infra/ai/output-language';
import { PipelineStrategyFactory } from '@infra/ai/pipelines/pipeline-strategy.factory';
import type {
  GeneratedQuestion,
  SessionType,
} from '@infra/ai/pipelines/interview-pipeline.interface';
import {
  QuestionBankService,
  type AllocatedQuestionDto,
  type FallbackQuestion,
} from '../question-bank/question-bank.service';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';
import { HybridMappingService } from '../taxonomy/hybrid-mapping.service';
import { SkillTargetedQuestionGeneratorService } from './skill-targeted-question-generator.service';
import {
  calculateEstimatedTimeMin,
  normalizeGeneratedQuestionMetadata,
  sanitizeDifficulty,
} from './question-metadata';

const AI_QUESTION_EVERY_N = 5;

export interface QuestionGenerationJobDto {
  sessionId: string;
  sessionType: SessionType;
  jobDescriptionText: string;
  targetRoles: string[];
  contextPack: 'VN' | 'Western';
  rubricVersionId: string;
  language: string;
  totalQuestions: number;
  durationMin: number;
  onetSocCode?: string | null;
  targetSfiaLevel?: number | null;
  normalizedTechStack?: string[];
}

type MergedQuestionRow = {
  questionBankId?: string;
  questionText: string;
  orderIndex: number;
  questionCategory: string;
  competencyDomains: string[];
  estimatedTimeMin: number;
};

type NormalizedGeneratedQuestion = GeneratedQuestion & {
  questionCategory: 'behavioral' | 'technical';
  competencyDomains: string[];
  difficulty: 1 | 2 | 3;
  estimatedTimeMin: number;
};

@Injectable()
export class GenerateSessionQuestions {
  private readonly logger = new Logger(GenerateSessionQuestions.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assessmentFacade: AssessmentFacade,
    private readonly factory: PipelineStrategyFactory,
    private readonly questionBankService: QuestionBankService,
    private readonly questionCriteria: QuestionCriteriaService,
    private readonly hybridMappingService: HybridMappingService,
    private readonly skillQuestionGenerator: SkillTargetedQuestionGeneratorService,
    @Inject(AI_GATEWAY_TOKEN)
    private readonly openai: IAIGateway,
  ) {}

  async execute(job: QuestionGenerationJobDto): Promise<void> {
    try {
      await this.initSessionSkills(job);
    } catch (skillError) {
      this.logger.warn(
        `Failed to initialize session_skills for session ${job.sessionId}: ${skillError instanceof Error ? skillError.message : String(skillError)}`,
      );
    }

    const sessionSkills = await this.prisma.sessionSkill.findMany({
      where: { sessionId: job.sessionId },
      orderBy: [{ weight: 'desc' }, { priority: 'asc' }],
    });

    if (sessionSkills.length > 0) {
      await this.executeHybridAllocation(job, sessionSkills);
      return;
    }

    await this.executeLegacyAllocation(job);
  }

  /**
   * Quy trình cấp phát câu hỏi Hybrid Unified:
   * - Quy tụ 100% câu hỏi vào session_skills
   * - Tra cứu QuestionBank theo session_skills
   * - Fallback AI Dynamic Generation cho các kỹ năng chưa đủ câu hỏi
   * - Sắp xếp lũy tiến (Progressive Flow: Dễ -> Khó)
   * - Ghi nhận vào session_questions & best-effort link sessionQuestionSkillLevels
   */
  private async executeHybridAllocation(
    job: QuestionGenerationJobDto,
    sessionSkills: Array<{
      id: string;
      skillCode: string;
      targetLevel: number;
      weight: number | Prisma.Decimal;
      techContext: string[];
    }>,
  ): Promise<void> {
    const outputLanguage = resolveOutputLanguage(job.language);

    // 1. Phân bổ câu hỏi từ Question Bank
    const bankResult =
      await this.questionBankService.allocateQuestionsForSessionSkills({
        sessionSkills: sessionSkills.map((s) => ({
          sessionSkillId: s.id,
          skillCode: s.skillCode,
          targetLevel: s.targetLevel,
          weight: s.weight,
          techContext: s.techContext,
        })),
        totalQuestions: job.totalQuestions,
        sessionType: job.sessionType,
        language: outputLanguage,
      });

    const allAllocated: AllocatedQuestionDto[] = [
      ...bankResult.allocatedQuestions,
    ];

    // 2. Với các kỹ năng ngân hàng không đủ câu hỏi, kích hoạt SkillTargeted AI Generator
    for (const item of bankResult.uncoveredRequirements) {
      for (let i = 0; i < item.neededCount; i++) {
        const generated = await this.skillQuestionGenerator.generateQuestion({
          sessionType: job.sessionType,
          skillCode: item.requirement.skillCode,
          targetLevel: item.requirement.targetLevel,
          techContext: item.requirement.techContext || [],
          jobDescriptionText: job.jobDescriptionText,
          language: outputLanguage,
        });

        allAllocated.push({
          questionBankId: generated.questionBankId,
          sessionSkillId: item.requirement.sessionSkillId,
          sfiaSkillCode: item.requirement.skillCode,
          targetLevel: item.requirement.targetLevel,
          questionText: generated.questionText,
          questionCategory:
            job.sessionType === 'technical' ? 'technical' : 'behavioral',
          source: generated.source,
          difficulty: generated.difficulty,
          estimatedTimeMin: generated.estimatedTimeMin,
          rubricCriteria: generated.rubricCriteria,
        });
      }
    }

    // 3. Đảm bảo đủ số lượng câu hỏi theo yêu cầu
    if (allAllocated.length < job.totalQuestions && sessionSkills.length > 0) {
      const primarySkill = sessionSkills[0];
      const neededMore = job.totalQuestions - allAllocated.length;
      for (let i = 0; i < neededMore; i++) {
        const generated = await this.skillQuestionGenerator.generateQuestion({
          sessionType: job.sessionType,
          skillCode: primarySkill.skillCode,
          targetLevel: primarySkill.targetLevel,
          techContext: primarySkill.techContext || [],
          jobDescriptionText: job.jobDescriptionText,
          language: outputLanguage,
        });

        allAllocated.push({
          questionBankId: generated.questionBankId,
          sessionSkillId: primarySkill.id,
          sfiaSkillCode: primarySkill.skillCode,
          targetLevel: primarySkill.targetLevel,
          questionText: generated.questionText,
          questionCategory:
            job.sessionType === 'technical' ? 'technical' : 'behavioral',
          source: generated.source,
          difficulty: generated.difficulty,
          estimatedTimeMin: generated.estimatedTimeMin,
          rubricCriteria: generated.rubricCriteria,
        });
      }
    }

    // 4. Sắp xếp lũy tiến (Progressive Flow): từ dễ đến khó (difficulty tăng dần)
    allAllocated.sort((a, b) => (a.difficulty ?? 3) - (b.difficulty ?? 3));
    const finalQuestions = allAllocated.slice(0, job.totalQuestions);

    // 5. Lưu an toàn vào CSDL
    const count = await this.persistHybridQuestions(
      job.sessionId,
      finalQuestions,
    );
    this.logger.log(
      `Hybrid question generation persisted for session ${job.sessionId}: bank=${bankResult.allocatedQuestions.length} ai=${finalQuestions.length - bankResult.allocatedQuestions.length} total=${count}`,
    );
  }

  private async persistHybridQuestions(
    sessionId: string,
    questions: AllocatedQuestionDto[],
  ): Promise<number> {
    const questionRows = questions.map((q, index) => ({
      id: randomUUID(),
      sessionId,
      sessionSkillId: q.sessionSkillId,
      sfiaSkillCode: q.sfiaSkillCode,
      targetLevel: q.targetLevel,
      rubricCriteria: q.rubricCriteria as unknown as Prisma.InputJsonValue,
      questionBankId: q.questionBankId || null,
      questionText: q.questionText,
      orderIndex: index + 1,
      questionCategory: q.questionCategory,
      source: q.source,
      estimatedTimeMin: q.estimatedTimeMin,
    }));

    const createdQuestions = await this.prisma.sessionQuestion.createMany({
      data: questionRows,
      skipDuplicates: true,
    });

    return createdQuestions.count;
  }

  private async executeLegacyAllocation(
    job: QuestionGenerationJobDto,
  ): Promise<void> {
    const outputLanguage = resolveOutputLanguage(job.language);
    const aiCount = Math.round(job.totalQuestions / AI_QUESTION_EVERY_N);

    let aiQuestions: NormalizedGeneratedQuestion[];
    let contextPackConfig: ContextPackConfig;
    try {
      contextPackConfig = await this.assessmentFacade.getContextPack(
        job.contextPack,
      );
      const rawQuestions = await this.factory
        .getStrategy(job.sessionType)
        .generateQuestions({
          sessionType: job.sessionType,
          jobDescriptionText: job.jobDescriptionText,
          targetRoles: job.targetRoles,
          contextPackConfig,
          language: outputLanguage,
          totalQuestions: aiCount,
        });
      aiQuestions = this.normalizeAiQuestions(
        rawQuestions,
        contextPackConfig,
        job.sessionType,
        job.durationMin,
        job.totalQuestions,
        aiCount,
      );
    } catch (error: unknown) {
      const detail = describeAIError(error);
      if (isAIFallbackEligible(error)) {
        this.logger.warn(
          `AI question generation unavailable for session ${job.sessionId}; using question_bank fallback: ${detail}`,
        );
      } else {
        this.logger.error(
          `AI question generation failed for session ${job.sessionId}; using question_bank fallback`,
          error instanceof Error ? error.stack : String(error),
        );
      }
      await this.persistFallback(job, outputLanguage);
      return;
    }

    let bankQuestions: FallbackQuestion[];
    try {
      bankQuestions = await this.questionBankService.selectFallbackQuestions(
        job.sessionType,
        job.contextPack,
        job.totalQuestions - aiQuestions.length,
        outputLanguage,
        job.rubricVersionId,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Question bank fetch failed for session ${job.sessionId}; using AI-only questions`,
        error instanceof Error ? error.stack : String(error),
      );
      bankQuestions = [];
    }

    const rows = this.mergeQuestions(
      aiQuestions,
      bankQuestions,
      job.totalQuestions,
      job.durationMin,
    );
    if (rows.length < job.totalQuestions) {
      throw new InterviewAIException(
        ErrorCode.AI_SERVICE_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Only ${rows.length}/${job.totalQuestions} questions available after metadata validation`,
      );
    }
    const count = await this.persistSessionQuestions(
      job.sessionId,
      job.rubricVersionId,
      rows,
    );
    this.logger.log(
      `Legacy question generation persisted for session ${job.sessionId}: ai=${aiCount} qb=${bankQuestions.length} total=${count} model=${this.openai.getChatModel()}`,
    );
  }

  private async persistFallback(
    job: QuestionGenerationJobDto,
    language: string,
  ): Promise<void> {
    const questions = await this.questionBankService.selectFallbackQuestions(
      job.sessionType,
      job.contextPack,
      job.totalQuestions,
      language,
      job.rubricVersionId,
    );
    await this.persistSessionQuestions(
      job.sessionId,
      job.rubricVersionId,
      questions.map((question, index) => ({
        questionBankId: question.questionBankId,
        questionText: question.text,
        orderIndex: index + 1,
        questionCategory: question.questionCategory,
        competencyDomains: question.competencyDomains,
        estimatedTimeMin:
          question.estimatedTimeMin > 0
            ? question.estimatedTimeMin
            : calculateEstimatedTimeMin({
                durationMin: job.durationMin,
                numQuestions: job.totalQuestions,
                difficulty: 2,
              }),
      })),
    );
  }

  private mergeQuestions(
    aiQuestions: NormalizedGeneratedQuestion[],
    bankQuestions: FallbackQuestion[],
    total: number,
    durationMin: number,
  ): MergedQuestionRow[] {
    const aiPositions = new Set(
      Array.from({ length: aiQuestions.length }, (_, index) =>
        Math.min(
          (index + 1) * AI_QUESTION_EVERY_N,
          total - (aiQuestions.length - index - 1),
        ),
      ),
    );
    const rows: MergedQuestionRow[] = [];
    let aiIndex = 0;
    let bankIndex = 0;
    for (let position = 1; position <= total; position++) {
      if (aiPositions.has(position) && aiIndex < aiQuestions.length) {
        const question = aiQuestions[aiIndex++];
        rows.push({
          questionText: question.text,
          orderIndex: position,
          questionCategory: question.questionCategory,
          competencyDomains: question.competencyDomains,
          estimatedTimeMin: question.estimatedTimeMin,
        });
      } else if (bankIndex < bankQuestions.length) {
        const question = bankQuestions[bankIndex++];
        rows.push({
          questionBankId: question.questionBankId,
          questionText: question.text,
          orderIndex: position,
          questionCategory: question.questionCategory,
          competencyDomains: question.competencyDomains,
          estimatedTimeMin:
            question.estimatedTimeMin > 0
              ? question.estimatedTimeMin
              : calculateEstimatedTimeMin({
                  durationMin,
                  numQuestions: total,
                  difficulty: 2,
                }),
        });
      }
    }
    return rows;
  }

  private async persistSessionQuestions(
    sessionId: string,
    rubricVersionId: string,
    rows: MergedQuestionRow[],
  ): Promise<number> {
    const questions = rows.map((row) => ({
      ...row,
      id: randomUUID(),
      sessionId,
    }));
    await Promise.all(
      questions.map((question) =>
        this.questionCriteria.buildSessionQuestionCriteriaData({
          sessionQuestionId: question.id,
          rubricVersionId,
          criterionCodes: question.competencyDomains,
        }),
      ),
    );
    const result = await this.prisma.sessionQuestion.createMany({
      data: questions.map((question) => ({
        ...(question.questionBankId
          ? { questionBankId: question.questionBankId }
          : {}),
        questionText: question.questionText,
        orderIndex: question.orderIndex,
        questionCategory: question.questionCategory,
        estimatedTimeMin: question.estimatedTimeMin,
        id: question.id,
        sessionId: question.sessionId,
      })),
      skipDuplicates: true,
    });
    return result.count;
  }

  private normalizeAiQuestions(
    questions: GeneratedQuestion[],
    contextPack: ContextPackConfig,
    sessionType: SessionType,
    durationMin: number,
    totalQuestions: number,
    maxCount: number,
  ): NormalizedGeneratedQuestion[] {
    const normalized: NormalizedGeneratedQuestion[] = [];
    for (const question of questions) {
      if (normalized.length >= maxCount) break;
      const metadata = normalizeGeneratedQuestionMetadata(
        {
          category: question.category,
          competencyDomains: question.competencyDomains,
        },
        contextPack,
        sessionType,
      );
      if (!metadata) {
        this.logger.warn(
          `Dropping AI question with invalid metadata: category=${question.category} competencyDomains=${JSON.stringify(question.competencyDomains)}`,
        );
        continue;
      }
      const difficulty = sanitizeDifficulty(question.difficulty);
      normalized.push({
        ...question,
        category: metadata.questionCategory,
        questionCategory: metadata.questionCategory,
        competencyDomains: metadata.competencyDomains,
        difficulty,
        estimatedTimeMin: calculateEstimatedTimeMin({
          durationMin,
          numQuestions: totalQuestions,
          difficulty,
        }),
      });
    }
    return normalized;
  }

  private async initSessionSkills(
    job: QuestionGenerationJobDto,
  ): Promise<void> {
    let socCode = job.onetSocCode;
    let targetLevel = job.targetSfiaLevel;
    let normalizedTechStack = job.normalizedTechStack;

    if (!socCode || !targetLevel || !normalizedTechStack) {
      const session = await this.prisma.interviewSession.findUnique({
        where: { id: job.sessionId },
        select: {
          onetSocCode: true,
          targetSfiaLevel: true,
          savedJobDescription: {
            select: {
              onetSocCode: true,
              targetSfiaLevel: true,
              normalizedTechStack: true,
              techStack: true,
            },
          },
        },
      });

      if (session) {
        socCode =
          socCode ||
          session.onetSocCode ||
          session.savedJobDescription?.onetSocCode;
        targetLevel =
          targetLevel ||
          session.targetSfiaLevel ||
          session.savedJobDescription?.targetSfiaLevel;
        if (!normalizedTechStack || normalizedTechStack.length === 0) {
          normalizedTechStack =
            (session.savedJobDescription?.normalizedTechStack as string[]) ||
            session.savedJobDescription?.techStack ||
            [];
        }
      }
    }

    const resolved = await this.hybridMappingService.resolveSkillsForSession({
      socCode,
      targetLevel,
      jdText: job.jobDescriptionText,
      normalizedTechStack: normalizedTechStack || [],
      sessionType: job.sessionType,
    });

    if (resolved.length > 0) {
      await this.prisma.sessionSkill.createMany({
        data: resolved.map((s, index) => ({
          sessionId: job.sessionId,
          skillCode: s.skillCode,
          techContext: s.techContext,
          targetLevel: s.targetLevel,
          weight: s.weight,
          source: s.source,
          priority: index + 1,
        })),
        skipDuplicates: true,
      });

      this.logger.log(
        `Initialized ${resolved.length} session_skills for session ${job.sessionId}: [${resolved.map((s) => s.skillCode).join(', ')}]`,
      );
    }
  }
}
