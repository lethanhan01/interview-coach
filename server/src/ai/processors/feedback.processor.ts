import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import {
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
} from '../../common/constants/queue.constants';
import { SURGICAL_FEEDBACK_PROMPT_CONFIG } from '../prompts/surgical-feedback-v1.1';
import type { SessionType } from '../pipelines/interview-pipeline.interface';

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

      const aiFeedback = await this.prisma.aiFeedback.create({
        data: {
          userAnswerId: answerId,
          overallScore: feedback.overallScore,
          modelAnswer: feedback.modelAnswer,
          keyTakeaway: feedback.keyTakeaway,
          promptVersion: SURGICAL_FEEDBACK_PROMPT_CONFIG.version,
          isFallback: false,
        },
      });

      if (feedback.annotatedSegments.length > 0) {
        await this.prisma.annotatedSegment.createMany({
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

      await this.prisma.userAnswer.update({
        where: { id: answerId },
        data: { feedbackGenerated: true },
      });

      await this.sseService.emit(
        `sse:session:${sessionId}`,
        'turn.feedback_ready',
        {
          answerId,
          hasAnnotations: feedback.annotatedSegments.length > 0,
        },
      );
    } catch (error: unknown) {
      const totalAttempts = job.opts.attempts ?? FEEDBACK_JOB_ATTEMPTS;
      const isLastAttempt = job.attemptsMade >= totalAttempts - 1;

      if (!isLastAttempt) {
        this.logger.warn(
          `FeedbackProcessor attempt ${job.attemptsMade + 1}/${totalAttempts} failed for answer ${answerId}, retrying`,
          error instanceof Error ? error.message : String(error),
        );
        throw error;
      }

      this.logger.error(
        `FeedbackProcessor failed after all ${totalAttempts} attempts for session ${sessionId} answer ${answerId}`,
        error instanceof Error ? error.stack : String(error),
      );

      try {
        await this.prisma.aiFeedback.create({
          data: {
            userAnswerId: answerId,
            overallScore: 0,
            modelAnswer: '',
            keyTakeaway: 'Feedback generation failed',
            promptVersion: SURGICAL_FEEDBACK_PROMPT_CONFIG.version,
            isFallback: true,
          },
        });

        await this.sseService.emit(
          `sse:session:${sessionId}`,
          'turn.feedback_ready',
          {
            answerId,
            hasAnnotations: false,
          },
        );
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
}
