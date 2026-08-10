import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { SseService } from '../infrastructure/realtime/redis/sse.service';
import { QUESTION_GEN_QUEUE } from '../common/constants/queue.constants';
import {
  GenerateSessionQuestions,
  type QuestionGenerationJobDto,
} from './generate-session-questions.service';

@Processor(QUESTION_GEN_QUEUE, { concurrency: 1 })
export class QuestionGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(QuestionGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
    private readonly generateSessionQuestions: GenerateSessionQuestions,
  ) {
    super();
  }

  async process(job: Job<QuestionGenerationJobDto>): Promise<void> {
    try {
      await this.generateSessionQuestions.execute(job.data);
      if (await this.markActiveUnlessStopped(job.data.sessionId)) {
        await this.emitStatus(job.data.sessionId, 'active');
      }
    } catch (error: unknown) {
      this.logger.error(
        `Unable to generate questions for session ${job.data.sessionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      await this.markSessionError(job.data.sessionId);
      throw error;
    }
  }

  private async markActiveUnlessStopped(sessionId: string): Promise<boolean> {
    const result = await this.prisma.interviewSession.updateMany({
      where: { id: sessionId, status: { in: ['generating', 'ready'] } },
      data: { status: 'active' },
    });
    return result.count > 0;
  }

  private async markSessionError(sessionId: string): Promise<void> {
    await this.prisma.interviewSession
      .update({ where: { id: sessionId }, data: { status: 'error' } })
      .catch(() => {});
    await this.emitStatus(sessionId, 'error').catch(() => {});
  }

  private async emitStatus(
    sessionId: string,
    status: 'active' | 'error',
  ): Promise<void> {
    await this.sseService
      .emit(`sse:session:${sessionId}`, 'session.status', { status, sessionId })
      .catch((error: unknown) => {
        if (status === 'active') {
          this.logger.warn(
            `Unable to emit active status for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      });
  }
}
