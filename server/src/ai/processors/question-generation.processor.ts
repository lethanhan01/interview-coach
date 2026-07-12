import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import { QUESTION_GEN_QUEUE } from '../../common/constants/queue.constants';
import { QuestionBankService } from '../../question-bank/question-bank.service';
import type { FallbackQuestion } from '../../question-bank/question-bank.service';
import { QuestionCriteriaService } from '../../question-criteria/question-criteria.service';
import { OpenAIGateway } from '../openai.gateway';
import { resolveOutputLanguage } from '../output-language';
import type {
  GeneratedQuestion,
  SessionType,
} from '../pipelines/interview-pipeline.interface';
import { describeAIError, isAIFallbackEligible } from '../ai-error.utils';
import {
  calculateEstimatedTimeMin,
  normalizeGeneratedQuestionMetadata,
  sanitizeDifficulty,
} from '../question-metadata';
import type { ContextPackConfig } from '../context-pack.service';

// AI generates 1 out of every 5 questions; the rest come from the question bank.
const AI_QUESTION_EVERY_N = 5;

interface QuestionGenerationJobDto {
  sessionId: string;
  sessionType: SessionType;
  jobDescriptionText: string;
  targetRoles: string[];
  contextPack: 'VN' | 'Western';
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
  rubricJson: object;
  estimatedTimeMin: number;
};

type PersistedQuestionRow = MergedQuestionRow & {
  id: string;
  sessionId: string;
};

type NormalizedGeneratedQuestion = GeneratedQuestion & {
  questionCategory: 'behavioral' | 'technical';
  competencyDomains: string[];
  difficulty: 1 | 2 | 3;
  estimatedTimeMin: number;
};

@Processor(QUESTION_GEN_QUEUE)
export class QuestionGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(QuestionGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
    private readonly contextPackService: ContextPackService,
    private readonly factory: PipelineStrategyFactory,
    private readonly questionBankService: QuestionBankService,
    private readonly questionCriteria: QuestionCriteriaService,
    private readonly openai: OpenAIGateway,
  ) {
    super();
  }

  async process(job: Job<QuestionGenerationJobDto>): Promise<void> {
    const {
      sessionId,
      sessionType,
      jobDescriptionText,
      targetRoles,
      contextPack,
      language,
      totalQuestions,
      durationMin,
    } = job.data;
    const outputLanguage = resolveOutputLanguage(language);

    const aiCount = Math.round(totalQuestions / AI_QUESTION_EVERY_N);

    let aiQuestions: NormalizedGeneratedQuestion[];
    let contextPackConfig: ContextPackConfig;
    let rubricSnapshot: object;
    try {
      contextPackConfig =
        await this.contextPackService.getContextPack(contextPack);
      rubricSnapshot =
        await this.contextPackService.getRubricSnapshot(contextPack);
      const strategy = this.factory.getStrategy(sessionType);
      const rawAiQuestions = await strategy.generateQuestions({
        sessionType,
        jobDescriptionText,
        targetRoles,
        contextPackConfig,
        language: outputLanguage,
        totalQuestions: aiCount,
      });
      aiQuestions = this.normalizeAiQuestions(
        rawAiQuestions,
        contextPackConfig,
        sessionType,
        durationMin,
        totalQuestions,
        aiCount,
      );
    } catch (error: unknown) {
      if (isAIFallbackEligible(error)) {
        this.logger.warn(
          `AI question generation unavailable for session ${sessionId}; using question_bank fallback: ${describeAIError(error)}`,
        );
      } else {
        this.logger.error(
          `AI question generation failed for session ${sessionId}; using question_bank fallback`,
          error instanceof Error ? error.stack : String(error),
        );
      }

      try {
        await this.fallbackFromQuestionBank(
          sessionId,
          sessionType,
          contextPack,
          outputLanguage,
          durationMin,
          totalQuestions,
        );
        if (await this.markActiveUnlessStopped(sessionId)) {
          await this.emitActive(sessionId);
        }
        return;
      } catch (fallbackError: unknown) {
        this.logger.error(
          `Question generation and question_bank fallback both failed for session ${sessionId}`,
          fallbackError instanceof Error
            ? fallbackError.stack
            : String(fallbackError),
        );
        await this.markSessionError(sessionId);
        throw fallbackError;
      }
    }

    const qbCount = totalQuestions - aiQuestions.length;
    let qbQuestions: FallbackQuestion[];
    try {
      qbQuestions = await this.questionBankService.selectFallbackQuestions(
        sessionType,
        contextPack,
        qbCount,
        outputLanguage,
      );
    } catch (qbError: unknown) {
      this.logger.error(
        `Question bank fetch failed for session ${sessionId}; using AI-only questions`,
        qbError instanceof Error ? qbError.stack : String(qbError),
      );
      qbQuestions = [];
    }

    try {
      const merged = this.mergeQuestions(
        aiQuestions,
        qbQuestions,
        totalQuestions,
        durationMin,
        rubricSnapshot,
      );
      if (merged.length < totalQuestions) {
        throw new Error(
          `Only ${merged.length}/${totalQuestions} questions available after metadata validation`,
        );
      }
      const result = await this.persistSessionQuestions(
        sessionId,
        contextPack,
        merged,
      );
      this.logger.log(
        `Hybrid question generation persisted for session ${sessionId}: ai=${aiCount} qb=${qbQuestions.length} total=${result} model=${this.openai.getChatModel()}`,
      );

      if (await this.markActiveUnlessStopped(sessionId)) {
        await this.emitActive(sessionId);
      }
    } catch (persistenceError: unknown) {
      this.logger.error(
        `Unable to persist generated questions for session ${sessionId}`,
        persistenceError instanceof Error
          ? persistenceError.stack
          : String(persistenceError),
      );
      await this.markSessionError(sessionId);
      throw persistenceError;
    }
  }

  private mergeQuestions(
    aiQuestions: NormalizedGeneratedQuestion[],
    qbQuestions: FallbackQuestion[],
    total: number,
    durationMin: number,
    rubricSnapshot: object,
  ): MergedQuestionRow[] {
    // AI questions appear every AI_QUESTION_EVERY_N positions when possible.
    // Short sessions still need every generated question to land inside total.
    const aiPositions = new Set(
      Array.from({ length: aiQuestions.length }, (_, i) =>
        Math.min(
          (i + 1) * AI_QUESTION_EVERY_N,
          total - (aiQuestions.length - i - 1),
        ),
      ),
    );

    const rows: MergedQuestionRow[] = [];
    let aiIdx = 0;
    let qbIdx = 0;

    for (let pos = 1; pos <= total; pos++) {
      if (aiPositions.has(pos) && aiIdx < aiQuestions.length) {
        const q = aiQuestions[aiIdx++];
        rows.push({
          questionText: q.text,
          orderIndex: pos,
          questionCategory: q.questionCategory,
          competencyDomains: q.competencyDomains,
          rubricJson: rubricSnapshot,
          estimatedTimeMin: q.estimatedTimeMin,
        });
      } else if (qbIdx < qbQuestions.length) {
        const q = qbQuestions[qbIdx++];
        const fallbackDifficulty =
          q.estimatedTimeMin > 0
            ? q.estimatedTimeMin
            : calculateEstimatedTimeMin({
                durationMin,
                numQuestions: total,
                difficulty: 2,
              });
        rows.push({
          questionBankId: q.questionBankId,
          questionText: q.text,
          orderIndex: pos,
          questionCategory: q.competencyDomains[0].startsWith('TD')
            ? 'technical'
            : 'behavioral',
          competencyDomains: q.competencyDomains,
          rubricJson: rubricSnapshot,
          estimatedTimeMin: fallbackDifficulty,
        });
      }
    }

    return rows;
  }

  private async fallbackFromQuestionBank(
    sessionId: string,
    sessionType: string,
    contextPack: string,
    language: string,
    durationMin: number,
    totalQuestions: number,
  ): Promise<void> {
    const rubricSnapshot = await this.contextPackService.getRubricSnapshot(
      contextPack as 'VN' | 'Western',
    );
    const selected = await this.questionBankService.selectFallbackQuestions(
      sessionType,
      contextPack,
      totalQuestions,
      language,
    );

    await this.persistSessionQuestions(
      sessionId,
      contextPack as 'VN' | 'Western',
      selected.map((q, i) => ({
        questionBankId: q.questionBankId,
        questionText: q.text,
        orderIndex: i + 1,
        questionCategory: q.questionCategory,
        competencyDomains: q.competencyDomains,
        rubricJson: rubricSnapshot,
        estimatedTimeMin:
          q.estimatedTimeMin > 0
            ? q.estimatedTimeMin
            : calculateEstimatedTimeMin({
                durationMin,
                numQuestions: totalQuestions,
                difficulty: 2,
              }),
      })),
    );
  }

  private async persistSessionQuestions(
    sessionId: string,
    contextPack: 'VN' | 'Western',
    rows: MergedQuestionRow[],
  ): Promise<number> {
    const questionRows: PersistedQuestionRow[] = rows.map((row) => ({
      ...row,
      id: randomUUID(),
      sessionId,
    }));
    const criteriaData = (
      await Promise.all(
        questionRows.map((row) =>
          this.questionCriteria.buildSessionQuestionCriteriaData({
            sessionQuestionId: row.id,
            contextPackId: contextPack,
            criterionCodes: row.competencyDomains,
            rubricJson: row.rubricJson,
          }),
        ),
      )
    ).flat();

    const [questionResult] = await this.prisma.$transaction([
      this.prisma.sessionQuestion.createMany({
        data: questionRows.map(({ competencyDomains, ...row }) => row),
        skipDuplicates: true,
      }),
      this.prisma.sessionQuestionCriterion.createMany({
        data: criteriaData,
        skipDuplicates: true,
      }),
    ]);

    return questionResult.count;
  }

  private normalizeAiQuestions(
    questions: GeneratedQuestion[],
    contextPackConfig: ContextPackConfig,
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
        contextPackConfig,
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

  private async markActiveUnlessStopped(sessionId: string): Promise<boolean> {
    const result = await this.prisma.interviewSession.updateMany({
      where: {
        id: sessionId,
        status: { in: ['generating', 'ready'] },
      },
      data: { status: 'active' },
    });

    return result.count > 0;
  }

  private async emitActive(sessionId: string): Promise<void> {
    await this.sseService
      .emit(`sse:session:${sessionId}`, 'session.status', {
        status: 'active',
        sessionId,
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Unable to emit active status for session ${sessionId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
  }

  private async markSessionError(sessionId: string): Promise<void> {
    await this.prisma.interviewSession
      .update({ where: { id: sessionId }, data: { status: 'error' } })
      .catch(() => {});
    await this.sseService
      .emit(`sse:session:${sessionId}`, 'session.status', {
        status: 'error',
        sessionId,
      })
      .catch(() => {});
  }
}
