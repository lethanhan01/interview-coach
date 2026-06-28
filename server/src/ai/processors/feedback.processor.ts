import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import { ReportService } from '../../report/report.service';
import {
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
} from '../../common/constants/queue.constants';
import { SURGICAL_FEEDBACK_PROMPT_CONFIG } from '../prompts/surgical-feedback-v1.1';
import type { SessionType } from '../pipelines/interview-pipeline.interface';
import { isAIQuotaExceeded, isAIFallbackEligible } from '../ai-error.utils';
import { FALLBACK_FEEDBACK_MESSAGE } from '../fallback-content';

interface FeedbackJobDto {
  sessionId: string;
  turnId: string;
  answerId: string;
  questionText: string;
  answerText: string;
  contextPack: 'VN' | 'Western';
  sessionType: SessionType;
}

@Processor(FEEDBACK_QUEUE)
export class FeedbackProcessor extends WorkerHost {
  private readonly logger = new Logger(FeedbackProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
    private readonly contextPackService: ContextPackService,
    private readonly factory: PipelineStrategyFactory,
    private readonly reportService: ReportService,
  ) {
    super();
  }

  async process(job: Job<FeedbackJobDto>): Promise<void> {
    const {
      sessionId,
      answerId,
      questionText,
      answerText,
      contextPack,
      sessionType,
    } = job.data;

    try {
      const contextPackConfig =
        this.contextPackService.getContextPack(contextPack);
      const strategy = this.factory.getStrategy(sessionType);

      const feedback = await strategy.evaluateAnswer({
        sessionType,
        questionText,
        answerText,
        contextPackConfig,
      });

      await this.prisma.$transaction(async (tx) => {
        const aiFeedback = await tx.aiFeedback.upsert({
          where: { userAnswerId: answerId },
          create: {
            userAnswerId: answerId,
            overallScore: feedback.overallScore,
            modelAnswer: feedback.modelAnswer,
            keyTakeaway: feedback.keyTakeaway,
            promptVersion: SURGICAL_FEEDBACK_PROMPT_CONFIG.version,
            isFallback: false,
          },
          update: {
            overallScore: feedback.overallScore,
            modelAnswer: feedback.modelAnswer,
            keyTakeaway: feedback.keyTakeaway,
            promptVersion: SURGICAL_FEEDBACK_PROMPT_CONFIG.version,
            isFallback: false,
          },
        });

        await tx.annotatedSegment.deleteMany({
          where: { aiFeedbackId: aiFeedback.id },
        });
        if (feedback.annotatedSegments.length > 0) {
          await tx.annotatedSegment.createMany({
            data: feedback.annotatedSegments.map((seg) => ({
              aiFeedbackId: aiFeedback.id,
              segmentText: seg.segmentText,
              startIndex: seg.startIndex,
              endIndex: seg.endIndex,
              highlightLevel: seg.highlightLevel,
              annotation: seg.annotation,
              suggestion: seg.suggestion ?? null,
              improvedVersion: seg.improvedVersion ?? null,
            })),
          });
        }

        await tx.userAnswer.update({
          where: { id: answerId },
          data: { feedbackGenerated: true },
        });
      });

      await this.emitFeedbackReady(
        sessionId,
        answerId,
        feedback.annotatedSegments.length > 0,
      );
      await this.reportService
        .enqueueIfAllFeedbacksReady(sessionId, sessionType, contextPack)
        .catch((err: unknown) => {
          this.logger.warn(
            `Failed to check report readiness for session ${sessionId}`,
            err instanceof Error ? err.message : String(err),
          );
        });
    } catch (error: unknown) {
      const isQuotaError = isAIQuotaExceeded(error);
      const totalAttempts = job.opts.attempts ?? FEEDBACK_JOB_ATTEMPTS;
      const isLastAttempt = job.attemptsMade >= totalAttempts - 1;

      if (!isLastAttempt && !isAIFallbackEligible(error)) {
        this.logger.warn(
          `FeedbackProcessor attempt ${job.attemptsMade + 1}/${totalAttempts} failed for answer ${answerId}, retrying`,
          error instanceof Error ? error.message : String(error),
        );
        throw error;
      }

      if (isQuotaError) {
        this.logger.warn(
          `Using fallback feedback for session ${sessionId} answer ${answerId}: AI provider quota exhausted`,
        );
      } else {
        this.logger.error(
          `FeedbackProcessor failed after ${totalAttempts} attempts for session ${sessionId} answer ${answerId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }

      try {
        const hasAnnotations = await this.prisma.$transaction(async (tx) => {
          const existingFeedback = await tx.aiFeedback.findUnique({
            where: { userAnswerId: answerId },
            include: { _count: { select: { annotatedSegments: true } } },
          });
          if (existingFeedback) {
            await tx.userAnswer.update({
              where: { id: answerId },
              data: { feedbackGenerated: true },
            });
            return existingFeedback._count.annotatedSegments > 0;
          }

          await tx.aiFeedback.upsert({
            where: { userAnswerId: answerId },
            create: {
              userAnswerId: answerId,
              overallScore: 0,
              modelAnswer: '',
              keyTakeaway: FALLBACK_FEEDBACK_MESSAGE,
              promptVersion: SURGICAL_FEEDBACK_PROMPT_CONFIG.version,
              isFallback: true,
            },
            update: {},
          });
          await tx.userAnswer.update({
            where: { id: answerId },
            data: { feedbackGenerated: true },
          });
          return false;
        });

        await this.emitFeedbackReady(sessionId, answerId, hasAnnotations);
        await this.reportService
          .enqueueIfAllFeedbacksReady(sessionId, sessionType, contextPack)
          .catch((err: unknown) => {
            this.logger.warn(
              `Failed to check report readiness for session ${sessionId}`,
              err instanceof Error ? err.message : String(err),
            );
          });
      } catch (fallbackError: unknown) {
        this.logger.error(
          `FeedbackProcessor fallback insert failed for answer ${answerId}`,
          fallbackError instanceof Error
            ? fallbackError.stack
            : String(fallbackError),
        );
        throw fallbackError;
      }
    }
  }

  private async emitFeedbackReady(
    sessionId: string,
    answerId: string,
    hasAnnotations: boolean,
  ): Promise<void> {
    await this.sseService
      .emit(`sse:session:${sessionId}`, 'turn.feedback_ready', {
        answerId,
        hasAnnotations,
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Unable to emit feedback_ready for answer ${answerId}`,
          error instanceof Error ? error.message : String(error),
        );
      });
  }
}
