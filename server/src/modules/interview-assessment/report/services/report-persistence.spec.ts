import { Test, TestingModule } from '@nestjs/testing';
import { ReportPersistenceService } from './report-persistence.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { SseService } from '@infra/realtime/redis/sse.service';
import { createMockSseService } from '@core/test-utils/mock-factories';
import type { ReportFinalPayload } from '../types/report-generation.types';

describe('ReportPersistenceService', () => {
  let persistenceService: ReportPersistenceService;
  let prisma: {
    aiFeedback: { upsert: jest.Mock };
    sessionReport: { upsert: jest.Mock };
    interviewSession: { update: jest.Mock };
    $transaction: jest.Mock;
  };
  let mockSse: ReturnType<typeof createMockSseService>;

  const samplePayload: ReportFinalPayload = {
    aggregatedScore: 85,
    syntheticSkippedFeedbacks: [
      {
        userAnswerId: 'turn-skipped',
        overallScore: 0,
        keyTakeaway: 'Skipped',
        isFallback: false,
        dimensionScores: [],
      },
    ],
    executiveSummary: {
      overallScore: 85,
      totalTurns: 2,
      evaluatedTurns: 1,
      fallbackTurns: 0,
      skippedTurns: 1,
      summary: 'Summary text',
    },
    commAnalysis: {
      feedbackCount: 2,
      evaluatedFeedbackCount: 1,
      fallbackFeedbackCount: 0,
      skippedFeedbackCount: 1,
    },
    competencyHeatmap: { TECH: 85 },
    actionPlan: { items: ['Item 1', 'Item 2', 'Item 3'] },
    skippedModelAnswers: {
      answers: [{ answerId: 'turn-skipped', modelAnswer: 'Answer 1' }],
    },
    reportMetadata: {
      generatedByModel: 'gpt-4o-mini',
      promptVersion: '1.0.0',
    },
  };

  beforeEach(async () => {
    prisma = {
      aiFeedback: { upsert: jest.fn().mockReturnValue('feedback-upsert-op') },
      sessionReport: {
        upsert: jest.fn().mockReturnValue('report-upsert-op'),
      },
      interviewSession: {
        update: jest.fn().mockReturnValue('session-update-op'),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    mockSse = createMockSseService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportPersistenceService,
        { provide: PrismaService, useValue: prisma },
        { provide: SseService, useValue: mockSse },
      ],
    }).compile();

    persistenceService = module.get<ReportPersistenceService>(
      ReportPersistenceService,
    );
  });

  describe('saveReportTransaction', () => {
    it('executes prisma transaction with feedbacks, 5 reports and session update', async () => {
      await persistenceService.saveReportTransaction(
        'session-123',
        samplePayload,
      );

      expect(prisma.aiFeedback.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.sessionReport.upsert).toHaveBeenCalledTimes(5);
      expect(prisma.interviewSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-123' },
          data: expect.objectContaining({
            overallScore: 85,
            status: 'completed',
          }),
        }),
      );
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('logs error and rethrows if transaction fails', async () => {
      prisma.$transaction.mockRejectedValue(new Error('DB connection dead'));

      await expect(
        persistenceService.saveReportTransaction('session-123', samplePayload),
      ).rejects.toThrow('DB connection dead');
    });
  });

  describe('notifyReportReady', () => {
    it('emits report.ready SSE event without throwing if emit fails', async () => {
      mockSse.emit.mockRejectedValue(new Error('Redis offline'));

      await expect(
        persistenceService.notifyReportReady('session-123'),
      ).resolves.toBeUndefined();
      expect(mockSse.emit).toHaveBeenCalledWith(
        'sse:session:session-123',
        'report.ready',
        { sessionId: 'session-123' },
      );
    });
  });
});
