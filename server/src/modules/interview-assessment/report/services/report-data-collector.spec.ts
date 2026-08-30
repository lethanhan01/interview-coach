import { Test, TestingModule } from '@nestjs/testing';
import { ReportDataCollector } from './report-data-collector.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';

describe('ReportDataCollector', () => {
  let collector: ReportDataCollector;
  let prisma: {
    userAnswer: { findMany: jest.Mock };
    aiFeedback: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      userAnswer: { findMany: jest.fn() },
      aiFeedback: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportDataCollector,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    collector = module.get<ReportDataCollector>(ReportDataCollector);
  });

  it('collects and segregates answered vs skipped turns successfully', async () => {
    prisma.userAnswer.findMany.mockResolvedValue([
      {
        id: 'turn-1',
        skipped: false,
        question: { questionText: 'Q1', orderIndex: 1, criteria: [] },
      },
      {
        id: 'turn-2',
        skipped: true,
        question: { questionText: 'Q2', orderIndex: 2, criteria: [] },
      },
    ]);

    prisma.aiFeedback.findMany.mockResolvedValue([
      {
        userAnswerId: 'turn-1',
        overallScore: 85,
        keyTakeaway: 'Good',
        isFallback: false,
        dimensionScores: [],
      },
    ]);

    const result = await collector.collectReportData('session-1', [
      'turn-1',
      'turn-2',
    ]);

    expect(result.sessionId).toBe('session-1');
    expect(result.answers).toHaveLength(2);
    expect(result.skippedAnswers).toHaveLength(1);
    expect(result.skippedAnswers[0].id).toBe('turn-2');
    expect(result.answeredTurnIds).toEqual(['turn-1']);
    expect(result.feedbacks).toHaveLength(1);
  });

  it('throws an error when feedback count does not match expected answered turns', async () => {
    prisma.userAnswer.findMany.mockResolvedValue([
      {
        id: 'turn-1',
        skipped: false,
        question: { questionText: 'Q1', orderIndex: 1, criteria: [] },
      },
      {
        id: 'turn-2',
        skipped: false,
        question: { questionText: 'Q2', orderIndex: 2, criteria: [] },
      },
    ]);

    // Only 1 feedback returned for 2 answered turns
    prisma.aiFeedback.findMany.mockResolvedValue([
      {
        userAnswerId: 'turn-1',
        overallScore: 85,
        keyTakeaway: 'Good',
        isFallback: false,
        dimensionScores: [],
      },
    ]);

    await expect(
      collector.collectReportData('session-1', ['turn-1', 'turn-2']),
    ).rejects.toThrow(
      'Report input is not ready for session session-1: 1/2 feedbacks',
    );
  });

  it('handles all skipped turns without error and zero feedback requirement', async () => {
    prisma.userAnswer.findMany.mockResolvedValue([
      {
        id: 'turn-1',
        skipped: true,
        question: { questionText: 'Q1', orderIndex: 1, criteria: [] },
      },
      {
        id: 'turn-2',
        skipped: true,
        question: { questionText: 'Q2', orderIndex: 2, criteria: [] },
      },
    ]);

    prisma.aiFeedback.findMany.mockResolvedValue([]);

    const result = await collector.collectReportData('session-1', [
      'turn-1',
      'turn-2',
    ]);

    expect(result.skippedAnswers).toHaveLength(2);
    expect(result.answeredTurnIds).toEqual([]);
    expect(result.feedbacks).toEqual([]);
  });
});
