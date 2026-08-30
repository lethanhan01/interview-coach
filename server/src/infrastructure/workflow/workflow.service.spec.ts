import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let upsert: jest.Mock;

  beforeEach(() => {
    upsert = jest.fn().mockResolvedValue({ id: 'command-1' });
    service = new WorkflowService();
  });

  it('persists a session question-generation command with sessionId', async () => {
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

  it('persists a transcription command with aggregateId', async () => {
    await service.enqueueInTransaction({ workflowOutbox: { upsert } } as any, {
      commandType: 'transcription',
      aggregateId: '22222222-2222-4222-8222-222222222222',
      payload: { answerId: '22222222-2222-4222-8222-222222222222' },
    });

    expect(upsert).toHaveBeenCalledWith({
      where: {
        idempotencyKey: 'transcription:22222222-2222-4222-8222-222222222222',
      },
      create: {
        commandType: 'transcription',
        aggregateId: '22222222-2222-4222-8222-222222222222',
        payload: { answerId: '22222222-2222-4222-8222-222222222222' },
        idempotencyKey: 'transcription:22222222-2222-4222-8222-222222222222',
      },
      update: {},
    });
  });

  it('persists a feedback command with custom idempotencyKey', async () => {
    await service.enqueueInTransaction({ workflowOutbox: { upsert } } as any, {
      commandType: 'feedback',
      aggregateId: '33333333-3333-4333-8333-333333333333',
      idempotencyKey: 'custom-feedback-key-123',
      payload: { answerId: '33333333-3333-4333-8333-333333333333' },
    });

    expect(upsert).toHaveBeenCalledWith({
      where: {
        idempotencyKey: 'custom-feedback-key-123',
      },
      create: {
        commandType: 'feedback',
        aggregateId: '33333333-3333-4333-8333-333333333333',
        payload: { answerId: '33333333-3333-4333-8333-333333333333' },
        idempotencyKey: 'custom-feedback-key-123',
      },
      update: {},
    });
  });

  it('throws error when neither aggregateId nor sessionId is provided', () => {
    expect(() =>
      service.enqueueInTransaction({ workflowOutbox: { upsert } } as any, {
        commandType: 'report-generation',
        payload: {},
      }),
    ).toThrow('aggregateId or sessionId must be provided for workflow command');
  });
});
