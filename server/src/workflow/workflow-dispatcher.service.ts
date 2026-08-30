import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import {
  FEEDBACK_JOB_ATTEMPTS,
  FEEDBACK_QUEUE,
  QUESTION_GEN_JOB_ATTEMPTS,
  QUESTION_GEN_QUEUE,
  REPORT_JOB_ATTEMPTS,
  REPORT_JOB_RETRY_DELAY_MS,
  REPORT_QUEUE,
  TRANSCRIPTION_JOB_ATTEMPTS,
  TRANSCRIPTION_QUEUE,
} from '../common/constants/queue.constants';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { workersEnabled } from '../runtime/runtime-role';
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

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUESTION_GEN_QUEUE) private readonly questionQueue: Queue,
    @InjectQueue(REPORT_QUEUE) private readonly reportQueue: Queue,
    @InjectQueue(FEEDBACK_QUEUE) private readonly feedbackQueue: Queue,
    @InjectQueue(TRANSCRIPTION_QUEUE)
    private readonly transcriptionQueue: Queue,
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
      for (const command of commands) await this.dispatch(command);
    } catch (error: unknown) {
      this.logger.error(
        'Unable to reconcile workflow outbox',
        error instanceof Error ? error.stack : String(error),
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

    try {
      if (command.commandType === 'question-generation') {
        await this.questionQueue.add('question-generation', command.payload, {
          jobId: `workflow-${command.id}`,
          attempts: QUESTION_GEN_JOB_ATTEMPTS,
          backoff: { type: 'fixed', delay: 2_000 },
        });
      } else if (command.commandType === 'report-generation') {
        if (!(await this.enqueueReport(command))) return;
      } else if (command.commandType === 'transcription') {
        await this.transcriptionQueue.add('transcription', command.payload, {
          jobId: `workflow-${command.id}`,
          attempts: TRANSCRIPTION_JOB_ATTEMPTS,
          backoff: { type: 'fixed', delay: 3_000 },
        });
      } else if (command.commandType === 'feedback') {
        await this.feedbackQueue.add('feedback', command.payload, {
          jobId: `workflow-${command.id}`,
          attempts: FEEDBACK_JOB_ATTEMPTS,
          backoff: { type: 'fixed', delay: 2_000 },
        });
      } else {
        throw new Error(`Unsupported workflow command: ${command.commandType}`);
      }

      await this.prisma.workflowOutbox.updateMany({
        where: { id: command.id, state: 'processing' },
        data: {
          state: 'completed',
          processedAt: new Date(),
          errorSummary: null,
        },
      });
    } catch (error: unknown) {
      await this.recordFailure(command, error);
    }
  }


  private async enqueueReport(command: OutboxCommand): Promise<boolean> {
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

    await this.reportQueue.add(
      'comprehensive-report',
      {
        ...(command.payload as Record<string, unknown>),
        turnIds: answers.map((answer) => answer.id),
      },
      {
        jobId: `workflow-${command.id}`,
        attempts: REPORT_JOB_ATTEMPTS,
        backoff: { type: 'fixed', delay: REPORT_JOB_RETRY_DELAY_MS },
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
