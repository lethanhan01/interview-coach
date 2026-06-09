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
        data: { status: 'active' },
      });

      await this.sseService.emit(`sse:session:${sessionId}`, 'session.status', {
        status: 'active',
        sessionId,
      });
    } catch (error: unknown) {
      this.logger.error(
        `QuestionGenerationProcessor failed for session ${sessionId}`,
        error instanceof Error ? error.stack : String(error),
      );

      try {
        await this.fallbackFromQuestionBank(
          sessionId,
          sessionType,
          contextPack,
          totalQuestions,
        );
        await this.sseService.emit(
          `sse:session:${sessionId}`,
          'session.status',
          { status: 'active', sessionId },
        );
      } catch (fallbackError: unknown) {
        this.logger.error(
          'Fallback from question_bank also failed',
          fallbackError,
        );
        await this.prisma.interviewSession
          .update({ where: { id: sessionId }, data: { status: 'error' } })
          .catch(() => {});
        await this.sseService
          .emit(`sse:session:${sessionId}`, 'session.status', {
            status: 'error',
          })
          .catch(() => {});
      }
    }
  }

  private async fallbackFromQuestionBank(
    sessionId: string,
    sessionType: string,
    contextPack: string,
    totalQuestions: number,
  ): Promise<void> {
    const candidates = await this.prisma.questionBank.findMany({
      where: { sessionType, contextPackId: contextPack, deletedAt: null },
      orderBy: [{ difficulty: 'asc' }],
      take: totalQuestions * 3,
    });

    if (candidates.length === 0) {
      throw new Error(
        `No fallback questions available for ${sessionType}/${contextPack}`,
      );
    }

    const selected = this.selectWithDifficultySpread(
      candidates,
      totalQuestions,
    );

    await this.prisma.sessionQuestion.createMany({
      data: selected.map((q, i) => ({
        sessionId,
        questionBankId: q.id,
        questionText: q.content,
        orderIndex: i + 1,
        questionCategory: q.competencyDomain.startsWith('TD')
          ? 'technical'
          : 'behavioral',
        competencyDomain: q.competencyDomain,
        rubricJson: {},
        estimatedTimeMin: 5,
      })),
    });

    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: 'active' },
    });
  }

  private selectWithDifficultySpread<T extends { difficulty: number }>(
    items: T[],
    count: number,
  ): T[] {
    const easy = items.filter((q) => q.difficulty <= 2);
    const medium = items.filter((q) => q.difficulty === 3);
    const hard = items.filter((q) => q.difficulty >= 4);

    const easyCount = Math.round(count * 0.3);
    const hardCount = Math.round(count * 0.2);
    const mediumCount = count - easyCount - hardCount;

    const pick = <U>(arr: U[], n: number): U[] =>
      arr.slice(0, Math.min(n, arr.length));

    return [
      ...pick(easy, easyCount),
      ...pick(medium, mediumCount),
      ...pick(hard, hardCount),
    ].slice(0, count);
  }
}
