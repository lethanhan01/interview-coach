import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import { QUESTION_GEN_QUEUE } from '../../common/constants/queue.constants';
import type { SessionType } from '../pipelines/interview-pipeline.interface';

interface QuestionGenerationJobDto {
  sessionId: string;
  sessionType: SessionType;
  jobDescriptionText: string;
  targetRoles: string[];
  contextPack: 'VN' | 'Western';
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
      totalQuestions,
    } = job.data;

    try {
      const contextPackConfig =
        this.contextPackService.getContextPack(contextPack);
      const strategy = this.factory.getStrategy(sessionType);

      const questions = await strategy.generateQuestions({
        sessionType,
        jobDescriptionText,
        targetRoles,
        contextPackConfig,
        totalQuestions,
      });

      await this.prisma.sessionQuestion.createMany({
        data: questions.map((q, index) => ({
          sessionId,
          questionText: q.text,
          orderIndex: index + 1,
          questionCategory: q.category,
          competencyDomain: q.competencyDomain,
          rubricJson: {},
        })),
      });

      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'ready' },
      });

      await this.sseService.emit(`sse:session:${sessionId}`, 'session.status', {
        status: 'ready',
        sessionId,
      });
    } catch (error: unknown) {
      this.logger.error(
        `QuestionGenerationProcessor failed for session ${sessionId}`,
        error instanceof Error ? error.stack : String(error),
      );

      await this.prisma.interviewSession
        .update({
          where: { id: sessionId },
          data: { status: 'error' },
        })
        .catch((updateErr: unknown) => {
          this.logger.error(
            'Failed to update session status to error',
            updateErr,
          );
        });

      await this.sseService
        .emit(`sse:session:${sessionId}`, 'session.status', { status: 'error' })
        .catch((sseErr: unknown) => {
          this.logger.error('Failed to emit error SSE', sseErr);
        });

      throw error;
    }
  }
}
