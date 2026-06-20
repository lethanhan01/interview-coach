import { Test, TestingModule } from '@nestjs/testing';
import type { Job } from 'bullmq';
import { FeedbackProcessor } from './feedback.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import {
  createMockContextPackService,
  createMockPipelineStrategyFactory,
  createMockSseService,
} from '../../test-utils/mock-factories';
import { HttpStatus } from '@nestjs/common';
import { InterviewAIException } from '../../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';

interface ExistingFeedback {
  id: string;
  _count: { annotatedSegments: number };
}

interface FeedbackUpsertArgs {
  where: { userAnswerId: string };
  create: { isFallback: boolean };
  update: { isFallback?: boolean };
}

interface TransactionMock {
  aiFeedback: {
    findUnique: jest.MockedFunction<
      (args: unknown) => Promise<ExistingFeedback | null>
    >;
    upsert: jest.MockedFunction<
      (args: FeedbackUpsertArgs) => Promise<{ id: string }>
    >;
  };
  annotatedSegment: {
    deleteMany: jest.MockedFunction<
      (args: unknown) => Promise<{ count: number }>
    >;
    createMany: jest.MockedFunction<
      (args: unknown) => Promise<{ count: number }>
    >;
  };
  userAnswer: {
    update: jest.MockedFunction<
      (args: unknown) => Promise<Record<string, never>>
    >;
  };
}

interface PrismaMock {
  $transaction: jest.MockedFunction<
    (
      callback: (transaction: TransactionMock) => Promise<unknown>,
    ) => Promise<unknown>
  >;
}

describe('FeedbackProcessor', () => {
  let processor: FeedbackProcessor;
  let prisma: PrismaMock;
  let tx: TransactionMock;
  let mockSse: ReturnType<typeof createMockSseService>;
  let mockContextPack: ReturnType<typeof createMockContextPackService>;
  let mockFactory: ReturnType<typeof createMockPipelineStrategyFactory>;
  let strategy: { evaluateAnswer: jest.Mock };

  const jobData = {
    sessionId: 'session-123',
    turnId: 'answer-1',
    answerId: 'answer-1',
    questionText: 'Giới thiệu bản thân?',
    answerText: 'Tôi là backend developer.',
    contextPack: 'VN' as const,
    sessionType: 'hr' as const,
  };

  const makeJob = (attemptsMade = 0) =>
    ({
      data: jobData,
      attemptsMade,
      opts: { attempts: 2 },
    }) as Job<typeof jobData>;

  beforeEach(async () => {
    tx = {
      aiFeedback: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'feedback-1' }),
      },
      annotatedSegment: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      userAnswer: {
        update: jest.fn().mockResolvedValue({}),
      },
    };
    prisma = {
      $transaction: jest.fn((callback) => callback(tx)),
    };
    mockSse = createMockSseService();
    mockContextPack = createMockContextPackService();
    mockFactory = createMockPipelineStrategyFactory();
    strategy = {
      evaluateAnswer: jest.fn().mockResolvedValue({
        overallScore: 80,
        modelAnswer: 'Một câu trả lời tốt.',
        keyTakeaway: 'Thêm số liệu cụ thể.',
        annotatedSegments: [
          {
            segmentText: 'backend developer',
            startIndex: 7,
            endIndex: 24,
            highlightLevel: 'strength',
            annotation: 'Cụ thể',
          },
        ],
      }),
    };
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue(strategy);
    mockSse.emit.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: SseService, useValue: mockSse },
        { provide: ContextPackService, useValue: mockContextPack },
        { provide: PipelineStrategyFactory, useValue: mockFactory },
      ],
    }).compile();

    processor = module.get(FeedbackProcessor);
  });

  it('upsert feedback và annotations trong cùng transaction', async () => {
    await processor.process(makeJob());

    const upsertArgs = tx.aiFeedback.upsert.mock.calls[0][0];
    expect(upsertArgs.where).toEqual({ userAnswerId: 'answer-1' });
    expect(upsertArgs.create.isFallback).toBe(false);
    expect(upsertArgs.update.isFallback).toBe(false);
    expect(tx.annotatedSegment.deleteMany).toHaveBeenCalledWith({
      where: { aiFeedbackId: 'feedback-1' },
    });
    expect(tx.annotatedSegment.createMany).toHaveBeenCalledTimes(1);
    expect(tx.userAnswer.update).toHaveBeenCalledWith({
      where: { id: 'answer-1' },
      data: { feedbackGenerated: true },
    });
  });

  it('không retry hoặc ghi fallback chỉ vì SSE phát thất bại', async () => {
    mockSse.emit.mockRejectedValue(new Error('Redis unavailable'));

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.aiFeedback.upsert).toHaveBeenCalledTimes(1);
  });

  it('ở lần cuối giữ nguyên feedback đã tồn tại thay vì đụng unique constraint', async () => {
    strategy.evaluateAnswer.mockRejectedValue(new Error('AI unavailable'));
    tx.aiFeedback.findUnique.mockResolvedValue({
      id: 'feedback-existing',
      _count: { annotatedSegments: 2 },
    });

    await expect(processor.process(makeJob(1))).resolves.toBeUndefined();

    expect(tx.aiFeedback.upsert).not.toHaveBeenCalled();
    expect(tx.annotatedSegment.deleteMany).not.toHaveBeenCalled();
    expect(tx.userAnswer.update).toHaveBeenCalledWith({
      where: { id: 'answer-1' },
      data: { feedbackGenerated: true },
    });
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'turn.feedback_ready',
      { answerId: 'answer-1', hasAnnotations: true },
    );
  });

  it('không retry quota error và ghi fallback feedback ngay ở lần đầu', async () => {
    strategy.evaluateAnswer.mockRejectedValue(
      new InterviewAIException(
        ErrorCode.AI_QUOTA_EXCEEDED,
        HttpStatus.SERVICE_UNAVAILABLE,
      ),
    );
    const warnSpy = jest.spyOn((processor as any).logger, 'warn');
    const errorSpy = jest.spyOn((processor as any).logger, 'error');

    await expect(processor.process(makeJob(0))).resolves.toBeUndefined();

    const fallbackArgs = tx.aiFeedback.upsert.mock.calls[0][0];
    expect(fallbackArgs.create).toEqual(
      expect.objectContaining({
        isFallback: true,
        keyTakeaway: expect.stringContaining('tạm thời chưa khả dụng'),
      }),
    );
    expect(tx.userAnswer.update).toHaveBeenCalledWith({
      where: { id: 'answer-1' },
      data: { feedbackGenerated: true },
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('OpenAI quota exhausted'),
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
