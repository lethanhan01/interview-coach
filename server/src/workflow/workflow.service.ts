import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type WorkflowCommandType = 'question-generation' | 'report-generation';

interface EnqueueWorkflowCommand {
  commandType: WorkflowCommandType;
  sessionId: string;
  payload: Prisma.InputJsonValue;
}

@Injectable()
export class WorkflowService {
  enqueueInTransaction(
    tx: Prisma.TransactionClient,
    command: EnqueueWorkflowCommand,
  ) {
    return tx.workflowOutbox.upsert({
      where: {
        idempotencyKey: `${command.commandType}:${command.sessionId}`,
      },
      create: {
        commandType: command.commandType,
        aggregateId: command.sessionId,
        payload: command.payload,
        idempotencyKey: `${command.commandType}:${command.sessionId}`,
      },
      update: {},
    });
  }
}
