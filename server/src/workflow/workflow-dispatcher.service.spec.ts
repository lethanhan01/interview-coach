import { WorkflowDispatcher } from './workflow-dispatcher.service';

const COMMAND = {
  id: 'command-1',
  commandType: 'question-generation',
  aggregateId: '11111111-1111-4111-8111-111111111111',
  payload: { sessionId: '11111111-1111-4111-8111-111111111111' },
  attempts: 0,
};

describe('WorkflowDispatcher', () => {
  let prisma: any;
  let questionQueue: { add: jest.Mock };
  let reportQueue: { add: jest.Mock };
  let dispatcher: WorkflowDispatcher;

  beforeEach(() => {
    prisma = {
      workflowOutbox: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      userAnswer: { findMany: jest.fn() },
    };
    questionQueue = { add: jest.fn().mockResolvedValue({}) };
    reportQueue = { add: jest.fn().mockResolvedValue({}) };
    dispatcher = new WorkflowDispatcher(
      prisma,
      questionQueue as any,
      reportQueue as any,
    );
  });

  it('claims a command, publishes one deterministic question job, then completes it', async () => {
    prisma.workflowOutbox.findUnique.mockResolvedValue(COMMAND);

    await dispatcher.dispatchFor('question-generation', COMMAND.aggregateId);

    expect(questionQueue.add).toHaveBeenCalledWith(
      'question-generation',
      COMMAND.payload,
      expect.objectContaining({ jobId: 'workflow-command-1' }),
    );
    expect(prisma.workflowOutbox.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: COMMAND.id, state: 'processing' },
        data: expect.objectContaining({ state: 'completed' }),
      }),
    );
  });

  it('does not publish when another dispatcher already claimed the command', async () => {
    prisma.workflowOutbox.findUnique.mockResolvedValue(COMMAND);
    prisma.workflowOutbox.updateMany.mockResolvedValue({ count: 0 });

    await dispatcher.dispatchFor('question-generation', COMMAND.aggregateId);

    expect(questionQueue.add).not.toHaveBeenCalled();
  });

  it('keeps a Redis failure retryable instead of losing the command', async () => {
    prisma.workflowOutbox.findUnique.mockResolvedValue(COMMAND);
    questionQueue.add.mockRejectedValue(new Error('Redis unavailable'));

    await dispatcher.dispatchFor('question-generation', COMMAND.aggregateId);

    expect(prisma.workflowOutbox.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: COMMAND.id, state: 'processing' },
        data: expect.objectContaining({
          state: 'pending',
          errorSummary: 'Redis unavailable',
        }),
      }),
    );
  });

  it('marks a command failed after bounded dispatch retries', async () => {
    prisma.workflowOutbox.findUnique.mockResolvedValue({
      ...COMMAND,
      attempts: 4,
    });
    questionQueue.add.mockRejectedValue(new Error('Redis unavailable'));

    await dispatcher.dispatchFor('question-generation', COMMAND.aggregateId);

    expect(prisma.workflowOutbox.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'failed',
          errorSummary: 'Redis unavailable',
        }),
      }),
    );
  });

  it('defers a report command until every non-skipped answer has feedback', async () => {
    const reportCommand = { ...COMMAND, commandType: 'report-generation' };
    prisma.workflowOutbox.findUnique.mockResolvedValue(reportCommand);
    prisma.userAnswer.findMany.mockResolvedValue([
      { id: 'answer-1', skipped: false, feedbackGenerated: false },
    ]);

    await dispatcher.dispatchFor(
      'report-generation',
      reportCommand.aggregateId,
    );

    expect(reportQueue.add).not.toHaveBeenCalled();
    expect(prisma.workflowOutbox.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'pending',
          attempts: { decrement: 1 },
        }),
      }),
    );
  });

  it('reclaims stale claims before scanning due commands', async () => {
    await dispatcher.reconcile();

    expect(prisma.workflowOutbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ state: 'processing' }),
        data: expect.objectContaining({ state: 'pending' }),
      }),
    );
    expect(prisma.workflowOutbox.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ state: 'pending' }),
      }),
    );
  });
});
