import { InjectQueue } from '@nestjs/bullmq';
import {
  HttpStatus,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import {
  FEEDBACK_JOB_ATTEMPTS,
  FEEDBACK_QUEUE,
  QUESTION_GEN_JOB_ATTEMPTS,
  QUESTION_GEN_QUEUE,
  REPORT_JOB_ATTEMPTS,
  REPORT_JOB_RETRY_DELAY_MS,
  REPORT_QUEUE,
} from '@core/common/constants/queue.constants';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { workersEnabled } from '@core/runtime/runtime-role';
import { WorkflowCommandType } from './workflow.service';

const DISPATCH_INTERVAL_MS = 30_000;
const CLAIM_TIMEOUT_MS = 5 * 60_000;
const MAX_DISPATCH_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1_000;
const REPORT_RECHECK_DELAY_MS = 30_000;

type OutboxCommand = {
  id: string;
  commandType: string;
  aggregateId: string;
  payload: Prisma.JsonValue;
  attempts: number;
};

@Injectable()
export class WorkflowDispatcher
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(WorkflowDispatcher.name);
  private interval?: NodeJS.Timeout;
  private isReconciling = false;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUESTION_GEN_QUEUE) private readonly questionQueue: Queue,
    @InjectQueue(REPORT_QUEUE) private readonly reportQueue: Queue,
    @InjectQueue(FEEDBACK_QUEUE) private readonly feedbackQueue: Queue,
  ) {}

  onApplicationBootstrap() {
    if (!workersEnabled()) return;
    void this.reconcile();
    this.interval = setInterval(
      () => void this.reconcile(),
      DISPATCH_INTERVAL_MS,
    );
    this.interval.unref();
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  async dispatchFor(
    commandType: WorkflowCommandType,
    aggregateId: string,
    idempotencyKey?: string,
  ): Promise<void> {
    try {
      const key = idempotencyKey ?? `${commandType}:${aggregateId}`;
      const command = await this.prisma.workflowOutbox.findUnique({
        where: { idempotencyKey: key },
        select: {
          id: true,
          commandType: true,
          aggregateId: true,
          payload: true,
          attempts: true,
        },
      });
      if (command) await this.dispatch(command);
    } catch (error: unknown) {
      this.logger.error(
        `Unable to dispatch ${commandType} for aggregate ${aggregateId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async reconcile(): Promise<void> {
    if (this.isReconciling) {
      this.logger.warn(
        'Skipping workflow outbox reconcile tick because previous run is still in progress',
      );
      return;
    }
    this.isReconciling = true;
    try {
      await this.prisma.workflowOutbox.updateMany({
        where: {
          state: 'processing',
          updatedAt: { lt: new Date(Date.now() - CLAIM_TIMEOUT_MS) },
        },
        data: {
          state: 'pending',
          availableAt: new Date(),
          errorSummary: 'Reclaimed after dispatcher claim timeout',
        },
      });
      const commands = await this.prisma.workflowOutbox.findMany({
        where: { state: 'pending', availableAt: { lte: new Date() } },
        orderBy: { createdAt: 'asc' },
        take: 100,
        select: {
          id: true,
          commandType: true,
          aggregateId: true,
          payload: true,
          attempts: true,
        },
      });
      await commands.reduce(
        (chain, command) => chain.then(() => this.safeDispatch(command)),
        Promise.resolve(),
      );
    } catch (error: unknown) {
      this.logger.error(
        'Unable to reconcile workflow outbox',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isReconciling = false;
    }
  }

  private async safeDispatch(command: OutboxCommand): Promise<void> {
    try {
      await this.dispatch(command);
    } catch (commandError: unknown) {
      this.logger.error(
        `Unexpected error dispatching workflow command ${command.id} (${command.commandType})`,
        commandError instanceof Error
          ? commandError.stack
          : String(commandError),
      );
    }
  }

  private async dispatch(command: OutboxCommand): Promise<void> {
    const claimed = await this.prisma.workflowOutbox.updateMany({
      where: {
        id: command.id,
        state: 'pending',
        availableAt: { lte: new Date() },
      },
      data: {
        state: 'processing',
        attempts: { increment: 1 },
        errorSummary: null,
      },
    });
    if (claimed.count === 0) return;

    const jobPayload = this.buildJobPayload(command);

    try {
      const completed = await this.enqueueCommand(command, jobPayload);
      if (!completed) return;

      await this.prisma.workflowOutbox.updateMany({
        where: { id: command.id, state: 'processing' },
        data: {
          state: 'completed',
          processedAt: new Date(),
          errorSummary: null,
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to dispatch command ${command.id} (${command.commandType}): ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.safeRecordFailure(command, error);
    }
  }

  private buildJobPayload(command: OutboxCommand): Record<string, unknown> {
    const rawPayload =
      typeof command.payload === 'object' &&
      command.payload !== null &&
      !Array.isArray(command.payload)
        ? (command.payload as Record<string, unknown>)
        : {};
    const correlationId =
      (rawPayload.correlationId as string) || `workflow-${command.id}`;
    return {
      ...rawPayload,
      correlationId,
    };
  }

  private async enqueueCommand(
    command: OutboxCommand,
    jobPayload: Record<string, unknown>,
  ): Promise<boolean> {
    if (command.commandType === 'question-generation') {
      await this.questionQueue.add('question-generation', jobPayload, {
        jobId: `workflow-${command.id}`,
        attempts: QUESTION_GEN_JOB_ATTEMPTS,
        backoff: { type: 'exponential', delay: 3_000 },
      });
      return true;
    }
    if (command.commandType === 'report-generation') {
      return this.enqueueReport(command, jobPayload);
    }
    if (command.commandType === 'feedback') {
      await this.feedbackQueue.add('feedback', jobPayload, {
        jobId: `workflow-${command.id}`,
        attempts: FEEDBACK_JOB_ATTEMPTS,
        backoff: { type: 'exponential', delay: 3_000 },
      });
      return true;
    }
    throw new InterviewAIException(
      ErrorCode.BAD_REQUEST,
      HttpStatus.BAD_REQUEST,
      `Unsupported workflow command: ${command.commandType}`,
    );
  }

  private async safeRecordFailure(
    command: OutboxCommand,
    error: unknown,
  ): Promise<void> {
    try {
      await this.recordFailure(command, error);
    } catch (recordError: unknown) {
      this.logger.error(
        `Unable to persist dispatch failure for workflow command ${command.id}`,
        recordError instanceof Error ? recordError.stack : String(recordError),
      );
    }
  }

  private async enqueueReport(
    command: OutboxCommand,
    jobPayload?: Record<string, unknown>,
  ): Promise<boolean> {
    const answers = await this.prisma.userAnswer.findMany({
      where: { question: { sessionId: command.aggregateId } },
      select: { id: true, skipped: true, feedbackGenerated: true },
      orderBy: { createdAt: 'asc' },
    });
    if (
      answers.length === 0 ||
      answers.some((answer) => !answer.skipped && !answer.feedbackGenerated)
    ) {
      await this.release(command.id, REPORT_RECHECK_DELAY_MS);
      return false;
    }

    const basePayload =
      jobPayload ??
      (typeof command.payload === 'object' &&
      command.payload !== null &&
      !Array.isArray(command.payload)
        ? command.payload
        : {});
    const correlationId =
      (basePayload.correlationId as string) || `workflow-${command.id}`;

    await this.reportQueue.add(
      'comprehensive-report',
      {
        ...basePayload,
        correlationId,
        turnIds: answers.map((answer) => answer.id),
      },
      {
        jobId: `workflow-${command.id}`,
        attempts: REPORT_JOB_ATTEMPTS,
        backoff: { type: 'exponential', delay: REPORT_JOB_RETRY_DELAY_MS },
      },
    );
    return true;
  }

  private async release(commandId: string, delayMs: number): Promise<void> {
    await this.prisma.workflowOutbox.updateMany({
      where: { id: commandId, state: 'processing' },
      data: {
        state: 'pending',
        attempts: { decrement: 1 },
        availableAt: new Date(Date.now() + delayMs),
      },
    });
  }

  private async recordFailure(
    command: OutboxCommand,
    error: unknown,
  ): Promise<void> {
    const attempts = command.attempts + 1;
    const summary = (
      error instanceof Error ? error.message : String(error)
    ).slice(0, 1_000);
    await this.prisma.workflowOutbox.updateMany({
      where: { id: command.id, state: 'processing' },
      data:
        attempts >= MAX_DISPATCH_ATTEMPTS
          ? { state: 'failed', errorSummary: summary }
          : {
              state: 'pending',
              availableAt: new Date(
                Date.now() +
                  Math.min(30_000, RETRY_DELAY_MS * 2 ** command.attempts),
              ),
              errorSummary: summary,
            },
    });
    this.logger.warn(
      `Workflow command ${command.id} failed to dispatch (attempt ${attempts})`,
    );
  }
}
