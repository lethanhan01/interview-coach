import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { RequestContext } from '@core/common/context/request-context';

export type WorkflowCommandType =
  | 'question-generation'
  | 'report-generation'
  | 'transcription'
  | 'feedback';

export interface EnqueueWorkflowCommand {
  commandType: WorkflowCommandType;
  aggregateId?: string;
  sessionId?: string;
  payload: Prisma.InputJsonValue;
  idempotencyKey?: string;
}

@Injectable()
export class WorkflowService {
  enqueueInTransaction(
    tx: Prisma.TransactionClient,
    command: EnqueueWorkflowCommand,
  ) {
    const aggregateId = command.aggregateId ?? command.sessionId;
    if (!aggregateId) {
      throw new InterviewAIException(
        ErrorCode.BAD_REQUEST,
        HttpStatus.BAD_REQUEST,
        'aggregateId or sessionId must be provided for workflow command',
      );
    }
    const idempotencyKey =
      command.idempotencyKey ?? `${command.commandType}:${aggregateId}`;

    const correlationId = RequestContext.getCorrelationId();
    let payloadToStore = command.payload;
    if (
      typeof command.payload === 'object' &&
      command.payload !== null &&
      !Array.isArray(command.payload)
    ) {
      const payloadObj = command.payload as Record<string, unknown>;
      payloadToStore = {
        ...payloadObj,
        ...(payloadObj.correlationId || correlationId !== 'no-correlation-id'
          ? { correlationId: payloadObj.correlationId ?? correlationId }
          : {}),
      } as Prisma.InputJsonValue;
    }

    return tx.workflowOutbox.upsert({
      where: {
        idempotencyKey,
      },
      create: {
        commandType: command.commandType,
        aggregateId,
        payload: payloadToStore,
        idempotencyKey,
      },
      update: {
        // Design Decision: A non-empty update field is required so that Prisma emits
        // native atomic `INSERT ... ON CONFLICT ("idempotency_key") DO UPDATE SET ...`
        // in PostgreSQL, preventing P2002 race conditions during concurrent enqueue.
        updatedAt: new Date(),
      },
    });
  }
}

export { WorkflowService as WorkflowOutboxService };
