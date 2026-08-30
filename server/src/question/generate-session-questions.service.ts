import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { ContextPackService } from '../assessment/context-pack.service';
import type { ContextPackConfig } from '../assessment/context-pack.service';
import { describeAIError, isAIFallbackEligible } from '@infra/ai/ai-error.utils';
import { AI_GATEWAY_TOKEN, type IAIGateway } from '@infra/ai/ai-gateway.interface';
import { resolveOutputLanguage } from '@infra/ai/output-language';
import { PipelineStrategyFactory } from '@infra/ai/pipelines/pipeline-strategy.factory';
import type {
  GeneratedQuestion,
  SessionType,
} from '@infra/ai/pipelines/interview-pipeline.interface';
import { QuestionBankService } from '../question-bank/question-bank.service';
import type { FallbackQuestion } from '../question-bank/question-bank.service';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';
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
    private readonly contextPackService: ContextPackService,
    private readonly factory: PipelineStrategyFactory,
    private readonly questionBankService: QuestionBankService,
    private readonly questionCriteria: QuestionCriteriaService,
    @Inject(AI_GATEWAY_TOKEN)
    private readonly openai: IAIGateway,
  ) {}

  async execute(job: QuestionGenerationJobDto): Promise<void> {
    const outputLanguage = resolveOutputLanguage(job.language);
    const aiCount = Math.round(job.totalQuestions / AI_QUESTION_EVERY_N);

    let aiQuestions: NormalizedGeneratedQuestion[];
    let contextPackConfig: ContextPackConfig;
    try {
      contextPackConfig = await this.contextPackService.getContextPack(
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
      throw new Error(
        `Only ${rows.length}/${job.totalQuestions} questions available after metadata validation`,
      );
    }
    const count = await this.persistSessionQuestions(
      job.sessionId,
      job.rubricVersionId,
      rows,
    );
    this.logger.log(
      `Hybrid question generation persisted for session ${job.sessionId}: ai=${aiCount} qb=${bankQuestions.length} total=${count} model=${this.openai.getChatModel()}`,
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
    const criteria = (
      await Promise.all(
        questions.map((question) =>
          this.questionCriteria.buildSessionQuestionCriteriaData({
            sessionQuestionId: question.id,
            rubricVersionId,
            criterionCodes: question.competencyDomains,
          }),
        ),
      )
    ).flat();
    const [result] = await this.prisma.$transaction([
      this.prisma.sessionQuestion.createMany({
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
      }),
      this.prisma.sessionQuestionCriterion.createMany({
        data: criteria,
        skipDuplicates: true,
      }),
    ]);
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
}
