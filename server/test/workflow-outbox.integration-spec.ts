import { randomUUID } from 'node:crypto';
import { WorkflowService } from '../src/workflow/workflow.service';
import { prisma } from '../prisma/seed/_client';

describe('Workflow outbox (PostgreSQL)', () => {
  const workflow = new WorkflowService();
  const sessionId = randomUUID();
  const idempotencyKey = `question-generation:${sessionId}`;

  afterAll(async () => {
    await prisma.workflowOutbox.deleteMany({ where: { idempotencyKey } });
    await prisma.$disconnect();
  });

  it('rolls back state command together and stores one command after commit', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await workflow.enqueueInTransaction(tx, {
          commandType: 'question-generation',
          sessionId,
          payload: { sessionId },
        });
        throw new Error('rollback test');
      }),
    ).rejects.toThrow('rollback test');

    expect(
      await prisma.workflowOutbox.findUnique({ where: { idempotencyKey } }),
    ).toBeNull();

    await Promise.all(
      [1, 2].map(() =>
        prisma.$transaction((tx) =>
          workflow.enqueueInTransaction(tx, {
            commandType: 'question-generation',
            sessionId,
            payload: { sessionId },
          }),
        ),
      ),
    );

    expect(
      await prisma.workflowOutbox.count({ where: { idempotencyKey } }),
    ).toBe(1);
  });
});
