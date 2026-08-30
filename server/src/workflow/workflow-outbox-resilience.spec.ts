import { WorkflowDispatcher } from './workflow-dispatcher.service';
import {
  QUESTION_GEN_JOB_ATTEMPTS,
  REPORT_JOB_ATTEMPTS,
  REPORT_JOB_RETRY_DELAY_MS,
  TRANSCRIPTION_JOB_ATTEMPTS,
} from '@core/common/constants/queue.constants';

describe('WorkflowOutboxResilienceSpec', () => {
  let prisma: any;
  let questionQueue: { add: jest.Mock };
  let reportQueue: { add: jest.Mock };
  let feedbackQueue: { add: jest.Mock };
  let transcriptionQueue: { add: jest.Mock };
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
    feedbackQueue = { add: jest.fn().mockResolvedValue({}) };
    transcriptionQueue = { add: jest.fn().mockResolvedValue({}) };

    dispatcher = new WorkflowDispatcher(
      prisma,
      questionQueue as any,
      reportQueue as any,
      feedbackQueue as any,
      transcriptionQueue as any,
    );
  });

  afterEach(() => {
    dispatcher.onModuleDestroy();
  });

  describe('Scenario 1: Atomic Claim Lock & Race Condition Suppression', () => {
    it('prevents double dispatch when concurrent dispatchers race for the same pending record', async () => {
      const command = {
        id: 'cmd-race-1',
        commandType: 'question-generation',
        aggregateId: 'session-race-1',
        payload: { sessionId: 'session-race-1' },
        attempts: 0,
      };

      prisma.workflowOutbox.findUnique.mockResolvedValue(command);

      let isClaimed = false;
      prisma.workflowOutbox.updateMany.mockImplementation(
        async ({ where }: { where: { id: string; state: string } }) => {
          if (where.state === 'pending') {
            if (!isClaimed) {
              isClaimed = true;
              return { count: 1 };
            }
            return { count: 0 };
          }
          return { count: 1 };
        },
      );

      const promise1 = dispatcher.dispatchFor(
        'question-generation',
        'session-race-1',
      );
      const promise2 = dispatcher.dispatchFor(
        'question-generation',
        'session-race-1',
      );

      await Promise.all([promise1, promise2]);

      // Exactly 1 job added to BullMQ queue
      expect(questionQueue.add).toHaveBeenCalledTimes(1);
      expect(questionQueue.add).toHaveBeenCalledWith(
        'question-generation',
        command.payload,
        expect.objectContaining({
          jobId: 'workflow-cmd-race-1',
          attempts: QUESTION_GEN_JOB_ATTEMPTS,
        }),
      );
    });
  });

  describe('Scenario 2: Crash Recovery via Reconcile Poller (Stale Claims)', () => {
    it('reclaims orphaned processing records older than 5 minutes and successfully redispatches them', async () => {
      const orphanedCommand = {
        id: 'cmd-crashed-1',
        commandType: 'transcription',
        aggregateId: 'answer-crashed-1',
        payload: { audioFileUrl: 'https://storage.example.com/audio.webm' },
        attempts: 1,
      };

      // Step 1: Reconcile reclaims stale records
      prisma.workflowOutbox.updateMany.mockResolvedValue({ count: 1 });
      // Step 2: Reconcile scans pending records and finds the reclaimed record
      prisma.workflowOutbox.findMany.mockResolvedValue([orphanedCommand]);

      await dispatcher.reconcile();

      // Verified: updateMany was called with lt query for stale claims
      expect(prisma.workflowOutbox.updateMany).toHaveBeenCalledWith({
        where: {
          state: 'processing',
          updatedAt: { lt: expect.any(Date) },
        },
        data: {
          state: 'pending',
          availableAt: expect.any(Date),
          errorSummary: 'Reclaimed after dispatcher claim timeout',
        },
      });

      // Verified: Transcription job was dispatched with deterministic job id
      expect(transcriptionQueue.add).toHaveBeenCalledWith(
        'transcription',
        orphanedCommand.payload,
        expect.objectContaining({
          jobId: 'workflow-cmd-crashed-1',
          attempts: TRANSCRIPTION_JOB_ATTEMPTS,
        }),
      );

      // Verified: State updated to completed
      expect(prisma.workflowOutbox.updateMany).toHaveBeenCalledWith({
        where: { id: 'cmd-crashed-1', state: 'processing' },
        data: {
          state: 'completed',
          processedAt: expect.any(Date),
          errorSummary: null,
        },
      });
    });
  });

  describe('Scenario 3: Exponential Backoff on Transient Redis Outage', () => {
    it('schedules retry with exponential delay when BullMQ is temporarily unavailable', async () => {
      const command = {
        id: 'cmd-redis-down-1',
        commandType: 'feedback',
        aggregateId: 'answer-fb-1',
        payload: { answerId: 'answer-fb-1', answerText: 'Hello' },
        attempts: 2, // 2 previous attempts
      };

      prisma.workflowOutbox.findUnique.mockResolvedValue(command);
      prisma.workflowOutbox.updateMany.mockResolvedValue({ count: 1 });
      feedbackQueue.add.mockRejectedValue(
        new Error('ECONNREFUSED: Redis unavailable'),
      );

      const beforeTime = Date.now();
      await dispatcher.dispatchFor('feedback', 'answer-fb-1');

      // Expected backoff = RETRY_DELAY_MS * 2^attempts = 1000 * 2^2 = 4000ms
      expect(prisma.workflowOutbox.updateMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { id: 'cmd-redis-down-1', state: 'processing' },
          data: expect.objectContaining({
            state: 'pending',
            errorSummary: 'ECONNREFUSED: Redis unavailable',
          }),
        }),
      );

      const lastCallArgs =
        prisma.workflowOutbox.updateMany.mock.calls[
          prisma.workflowOutbox.updateMany.mock.calls.length - 1
        ][0];
      const availableAt = lastCallArgs.data.availableAt as Date;
      expect(availableAt.getTime()).toBeGreaterThanOrEqual(beforeTime + 3900);
      expect(availableAt.getTime()).toBeLessThanOrEqual(beforeTime + 5000);
    });
  });

  describe('Scenario 4: Terminal Failure Marking on Max Retries', () => {
    it('marks command as permanently failed once max attempts are reached', async () => {
      const command = {
        id: 'cmd-perm-fail',
        commandType: 'question-generation',
        aggregateId: 'session-fail-1',
        payload: { sessionId: 'session-fail-1' },
        attempts: 4, // 4 previous attempts, this 5th attempt will exceed MAX_DISPATCH_ATTEMPTS (5)
      };

      prisma.workflowOutbox.findUnique.mockResolvedValue(command);
      prisma.workflowOutbox.updateMany.mockResolvedValue({ count: 1 });
      questionQueue.add.mockRejectedValue(
        new Error('Unrecoverable payload corruption'),
      );

      await dispatcher.dispatchFor('question-generation', 'session-fail-1');

      expect(prisma.workflowOutbox.updateMany).toHaveBeenLastCalledWith({
        where: { id: 'cmd-perm-fail', state: 'processing' },
        data: {
          state: 'failed',
          errorSummary: 'Unrecoverable payload corruption',
        },
      });
    });
  });

  describe('Scenario 5: Report Dependency Barrier & Self-Healing Recheck', () => {
    it('defers report generation when user answers are still awaiting feedback and decrements attempt count', async () => {
      const command = {
        id: 'cmd-report-barrier',
        commandType: 'report-generation',
        aggregateId: 'session-report-1',
        payload: { sessionId: 'session-report-1', reportType: 'comprehensive' },
        attempts: 0,
      };

      prisma.workflowOutbox.findUnique.mockResolvedValue(command);
      prisma.workflowOutbox.updateMany.mockResolvedValue({ count: 1 });

      // Session has 2 answers: 1 completed, 1 pending feedback
      prisma.userAnswer.findMany.mockResolvedValue([
        { id: 'ans-1', skipped: false, feedbackGenerated: true },
        { id: 'ans-2', skipped: false, feedbackGenerated: false }, // blocking
      ]);

      await dispatcher.dispatchFor('report-generation', 'session-report-1');

      // BullMQ report queue must NOT be called
      expect(reportQueue.add).not.toHaveBeenCalled();

      // State must be released back to pending with delay and decremented attempt
      expect(prisma.workflowOutbox.updateMany).toHaveBeenLastCalledWith({
        where: { id: 'cmd-report-barrier', state: 'processing' },
        data: {
          state: 'pending',
          attempts: { decrement: 1 },
          availableAt: expect.any(Date),
        },
      });
    });

    it('enqueues report job when all answers are ready (either feedbackGenerated or skipped)', async () => {
      const command = {
        id: 'cmd-report-ready',
        commandType: 'report-generation',
        aggregateId: 'session-report-2',
        payload: { sessionId: 'session-report-2', reportType: 'comprehensive' },
        attempts: 0,
      };

      prisma.workflowOutbox.findUnique.mockResolvedValue(command);
      prisma.workflowOutbox.updateMany.mockResolvedValue({ count: 1 });

      // 1 answer with feedback, 1 skipped answer -> All satisfied!
      prisma.userAnswer.findMany.mockResolvedValue([
        { id: 'ans-1', skipped: false, feedbackGenerated: true },
        { id: 'ans-2', skipped: true, feedbackGenerated: false },
      ]);

      await dispatcher.dispatchFor('report-generation', 'session-report-2');

      expect(reportQueue.add).toHaveBeenCalledWith(
        'comprehensive-report',
        {
          sessionId: 'session-report-2',
          reportType: 'comprehensive',
          turnIds: ['ans-1', 'ans-2'],
        },
        expect.objectContaining({
          jobId: 'workflow-cmd-report-ready',
          attempts: REPORT_JOB_ATTEMPTS,
          backoff: { type: 'fixed', delay: REPORT_JOB_RETRY_DELAY_MS },
        }),
      );

      expect(prisma.workflowOutbox.updateMany).toHaveBeenLastCalledWith({
        where: { id: 'cmd-report-ready', state: 'processing' },
        data: {
          state: 'completed',
          processedAt: expect.any(Date),
          errorSummary: null,
        },
      });
    });
  });

  describe('Scenario 6: Deterministic Idempotency Key Format Support', () => {
    it('correctly uses custom idempotencyKey if explicitly supplied', async () => {
      const customKey = 'custom-key-12345';
      const command = {
        id: 'cmd-custom-1',
        commandType: 'transcription',
        aggregateId: 'ans-12345',
        payload: { audioFileUrl: 'https://example.com/audio.webm' },
        attempts: 0,
      };

      prisma.workflowOutbox.findUnique.mockResolvedValue(command);

      await dispatcher.dispatchFor('transcription', 'ans-12345', customKey);

      expect(prisma.workflowOutbox.findUnique).toHaveBeenCalledWith({
        where: { idempotencyKey: customKey },
        select: expect.any(Object),
      });
    });
  });

  describe('Scenario 7: Lifecycle Safety & Resource Cleanup', () => {
    it('clears interval timer onModuleDestroy without throwing errors', () => {
      dispatcher.onApplicationBootstrap();
      expect(() => dispatcher.onModuleDestroy()).not.toThrow();
    });
  });
});
