import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
  it('persists a session command with a stable idempotency key', async () => {
    const upsert = jest.fn().mockResolvedValue({ id: 'command-1' });
    const service = new WorkflowService();

    await service.enqueueInTransaction({ workflowOutbox: { upsert } } as any, {
      commandType: 'question-generation',
      sessionId: '11111111-1111-4111-8111-111111111111',
      payload: { sessionId: '11111111-1111-4111-8111-111111111111' },
    });

    expect(upsert).toHaveBeenCalledWith({
      where: {
        idempotencyKey:
          'question-generation:11111111-1111-4111-8111-111111111111',
      },
      create: {
        commandType: 'question-generation',
        aggregateId: '11111111-1111-4111-8111-111111111111',
        payload: { sessionId: '11111111-1111-4111-8111-111111111111' },
        idempotencyKey:
          'question-generation:11111111-1111-4111-8111-111111111111',
      },
      update: {},
    });
  });
});
