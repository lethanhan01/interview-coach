import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import { QUESTION_GEN_QUEUE } from '../../common/constants/queue.constants';
import { QuestionBankService } from '../../question-bank/question-bank.service';
import { OpenAIGateway } from '../openai.gateway';
import type {
  GeneratedQuestion,
  SessionType,
} from '../pipelines/interview-pipeline.interface';
import { describeAIError, isAIFallbackEligible } from '../ai-error.utils';

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

    let questions: GeneratedQuestion[];
    try {
      const contextPackConfig =
        this.contextPackService.getContextPack(contextPack);
      const strategy = this.factory.getStrategy(sessionType);
      questions = await strategy.generateQuestions({
        sessionType,
        jobDescriptionText,
        targetRoles,
        contextPackConfig,
        totalQuestions,
      });
      questions = questions.slice(0, totalQuestions);
      if (questions.length < totalQuestions) {
        throw new Error(
          `AI returned only ${questions.length}/${totalQuestions} questions`,
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

    try {
      const result = await this.prisma.sessionQuestion.createMany({
        data: questions.map((q, index) => ({
          sessionId,
          questionText: q.text,
          orderIndex: index + 1,
          questionCategory: q.category,
          competencyDomain: q.competencyDomain,
          rubricJson: {},
        })),
        skipDuplicates: true,
      });
      this.logger.log(
        `AI question generation persisted for session ${sessionId}: source=ai count=${result.count}/${questions.length} model=${this.openai.getChatModel()}`,
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
