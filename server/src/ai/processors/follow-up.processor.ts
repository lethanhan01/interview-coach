import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import { FOLLOW_UP_QUEUE } from '../../common/constants/queue.constants';
import type { SessionType } from '../pipelines/interview-pipeline.interface';
import { isAIQuotaExceeded } from '../ai-error.utils';

interface FollowUpJobDto {
  sessionId: string;
  turnId: string;
  answerId: string;
  questionText: string;
  answerText: string;
  contextPack: 'VN' | 'Western';
  sessionType: SessionType;
}

@Processor(FOLLOW_UP_QUEUE)
export class FollowUpProcessor extends WorkerHost {
  private readonly logger = new Logger(FollowUpProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
    private readonly contextPackService: ContextPackService,
    private readonly factory: PipelineStrategyFactory,
  ) {
    super();
  }

  async process(job: Job<FollowUpJobDto>): Promise<void> {
    const {
      sessionId,
      turnId,
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

      const result = await strategy.generateFollowUp({
        sessionType,
        questionText,
        answerText,
        contextPackConfig,
      });

      if (result === null) {
        return;
      }

      await this.prisma.followUpQuestion.create({
        data: {
          userAnswerId: answerId,
          followUpText: result.followUpText,
          triggerRule: 'ai_suggested',
          triggerReason: result.triggerReason,
        },
      });

      await this.sseService.emit(`sse:session:${sessionId}`, 'turn.follow_up', {
        turnId,
        followUpText: result.followUpText,
      });
    } catch (error: unknown) {
      if (isAIQuotaExceeded(error)) {
        this.logger.warn(
          `Follow-up skipped for session ${sessionId} turn ${turnId}: OpenAI quota exhausted`,
        );
        return;
      }

      this.logger.error(
        `FollowUpProcessor failed for session ${sessionId} turn ${turnId}`,
        error instanceof Error ? error.stack : String(error),
      );
      // retry 0 — silently skip, do not re-throw
    }
  }
}
