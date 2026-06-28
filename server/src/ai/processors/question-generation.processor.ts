import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import { QUESTION_GEN_QUEUE } from '../../common/constants/queue.constants';
import { QuestionBankService } from '../../question-bank/question-bank.service';
import type { FallbackQuestion } from '../../question-bank/question-bank.service';
import { OpenAIGateway } from '../openai.gateway';
import type {
  GeneratedQuestion,
  SessionType,
} from '../pipelines/interview-pipeline.interface';
import { describeAIError, isAIFallbackEligible } from '../ai-error.utils';

// AI generates 1 out of every 5 questions; the rest come from the question bank.
const AI_QUESTION_EVERY_N = 5;

interface QuestionGenerationJobDto {
  sessionId: string;
  userId: string;
  sessionType: SessionType;
  jobDescriptionText: string;
  targetRoles: string[];
  contextPack: 'VN' | 'Western';
  language: string;
  totalQuestions: number;
}

@Processor(QUESTION_GEN_QUEUE)
export class QuestionGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(QuestionGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
    private readonly contextPackService: ContextPackService,
    private readonly factory: PipelineStrategyFactory,
    private readonly questionBankService: QuestionBankService,
    private readonly openai: OpenAIGateway,
  ) {
    super();
  }

  async process(job: Job<QuestionGenerationJobDto>): Promise<void> {
    const {
      sessionId,
      userId,
      sessionType,
      jobDescriptionText,
      targetRoles,
      contextPack,
      language,
      totalQuestions,
    } = job.data;

    const aiCount = Math.round(totalQuestions / AI_QUESTION_EVERY_N);
    const qbCount = totalQuestions - aiCount;

    let aiQuestions: GeneratedQuestion[];
    try {
      const contextPackConfig =
        this.contextPackService.getContextPack(contextPack);
      const strategy = this.factory.getStrategy(sessionType);
      aiQuestions = await strategy.generateQuestions({
        sessionType,
        jobDescriptionText,
        targetRoles,
        contextPackConfig,
        totalQuestions: aiCount,
      });
      aiQuestions = aiQuestions.slice(0, aiCount);
      if (aiQuestions.length < aiCount) {
        throw new Error(
          `AI returned only ${aiQuestions.length}/${aiCount} questions`,
        );
      }
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
          userId,
          sessionType,
          contextPack,
          language,
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

    let qbQuestions: FallbackQuestion[];
    try {
      qbQuestions = await this.questionBankService.selectFallbackQuestions(
        sessionType,
        contextPack,
        qbCount,
        language,
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
      ).map((row) => ({ ...row, sessionId }));
      const result = await this.prisma.sessionQuestion.createMany({
        data: merged,
        skipDuplicates: true,
      });
      this.logger.log(
        `Hybrid question generation persisted for session ${sessionId}: ai=${aiCount} qb=${qbQuestions.length} total=${result.count} model=${this.openai.getChatModel()}`,
      );

      if (qbQuestions.length > 0) {
        await Promise.all(
          qbQuestions.map((q) =>
            this.questionBankService.recordUsage(
              q.questionBankId,
              sessionId,
              userId,
            ),
          ),
        );
      }

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
    aiQuestions: GeneratedQuestion[],
    qbQuestions: FallbackQuestion[],
    total: number,
  ): Array<{
    questionBankId?: string;
    questionText: string;
    orderIndex: number;
    questionCategory: string;
    competencyDomain: string;
    rubricJson: object;
    estimatedTimeMin?: number;
  }> {
    // AI questions appear every AI_QUESTION_EVERY_N positions (positions 5, 10, 15, ...)
    const aiPositions = new Set(
      Array.from(
        { length: aiQuestions.length },
        (_, i) => (i + 1) * AI_QUESTION_EVERY_N,
      ),
    );

    const rows: ReturnType<typeof this.mergeQuestions> = [];
    let aiIdx = 0;
    let qbIdx = 0;

    for (let pos = 1; pos <= total; pos++) {
      if (aiPositions.has(pos) && aiIdx < aiQuestions.length) {
        const q = aiQuestions[aiIdx++];
        rows.push({
          questionText: q.text,
          orderIndex: pos,
          questionCategory: q.category,
          competencyDomain: q.competencyDomain,
          rubricJson: {},
        });
      } else if (qbIdx < qbQuestions.length) {
        const q = qbQuestions[qbIdx++];
        rows.push({
          questionBankId: q.questionBankId,
          questionText: q.text,
          orderIndex: pos,
          questionCategory: q.questionCategory,
          competencyDomain: q.competencyDomain,
          rubricJson: {},
          estimatedTimeMin: q.estimatedTimeMin,
        });
      }
    }

    return rows;
  }

  private async fallbackFromQuestionBank(
    sessionId: string,
    userId: string,
    sessionType: string,
    contextPack: string,
    language: string,
    totalQuestions: number,
  ): Promise<void> {
    const selected = await this.questionBankService.selectFallbackQuestions(
      sessionType,
      contextPack,
      totalQuestions,
      language,
    );

    await this.prisma.sessionQuestion.createMany({
      data: selected.map((q, i) => ({
        sessionId,
        questionBankId: q.questionBankId,
        questionText: q.text,
        orderIndex: i + 1,
        questionCategory: q.questionCategory,
        competencyDomain: q.competencyDomain,
        rubricJson: {},
        estimatedTimeMin: q.estimatedTimeMin,
      })),
      skipDuplicates: true,
    });

    await Promise.all(
      selected.map((question) =>
        this.questionBankService.recordUsage(
          question.questionBankId,
          sessionId,
          userId,
        ),
      ),
    );
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
