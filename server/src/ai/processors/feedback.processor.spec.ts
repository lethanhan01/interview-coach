import { Test, TestingModule } from '@nestjs/testing';
import type { Job } from 'bullmq';
import { FeedbackProcessor } from '../../assessment/feedback/feedback.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../../assessment/context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import { EvaluateAnswer } from '../../assessment/evaluate-answer.service';
import { ReportService } from '../../report/report.service';
import {
  createMockContextPackService,
  createMockPipelineStrategyFactory,
  createMockReportService,
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
  let mockReportService: ReturnType<typeof createMockReportService>;
  let strategy: { evaluateAnswer: jest.Mock };

  const jobData = {
    sessionId: 'session-123',
    turnId: 'answer-1',
    answerId: 'answer-1',
    questionId: 'q-1',
    questionText: 'Giới thiệu bản thân?',
    questionCategory: 'behavioral' as const,
    competencyDomains: ['D1', 'D6'],
    answerText: 'Tôi là backend developer.',
    contextPack: 'VN' as const,
    sessionType: 'hr' as const,
    language: 'vi' as const,
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
    mockReportService = createMockReportService();
    strategy = {
      evaluateAnswer: jest.fn().mockResolvedValue({
        overallScore: 80,
        modelAnswer: 'Một câu trả lời tốt.',
        keyTakeaway: 'Thêm số liệu cụ thể.',
        promptVersion: 'surgical-feedback-v1.5',
        appliedDimensions: [
          { id: 'D1', name: 'Communication', score: 80, weight: 0.5 },
          { id: 'D2', name: 'Teamwork', score: 60, weight: 0.5 },
        ],
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
        { provide: EvaluateAnswer, useValue: { execute: strategy.evaluateAnswer } },
        { provide: PipelineStrategyFactory, useValue: mockFactory },
        { provide: ReportService, useValue: mockReportService },
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

  it('persist dimensionScores từ appliedDimensions vào feedback thật', async () => {
    await processor.process(makeJob());

    expect(tx.aiFeedback.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          dimensionScores: [
            { id: 'D1', name: 'Communication', score: 80, weight: 0.5 },
            { id: 'D2', name: 'Teamwork', score: 60, weight: 0.5 },
          ],
        }),
        update: expect.objectContaining({
          dimensionScores: [
            { id: 'D1', name: 'Communication', score: 80, weight: 0.5 },
            { id: 'D2', name: 'Teamwork', score: 60, weight: 0.5 },
          ],
        }),
      }),
    );
  });

  it('không persist annotated segment nếu quote không thuộc answerText', async () => {
    strategy.evaluateAnswer.mockResolvedValue({
      overallScore: 15,
      modelAnswer: 'REST là một kiến trúc phong cách.',
      keyTakeaway: 'Cần phân biệt nghĩa kỹ thuật.',
      promptVersion: 'surgical-feedback-v1.5',
      appliedDimensions: [
        { id: 'D1', name: 'Communication', score: 15, weight: 1 },
      ],
      annotatedSegments: [
        {
          segmentText: 'REST là một kiến trúc phong cách.',
          startIndex: 0,
          endIndex: 34,
          highlightLevel: 'strength',
          annotation: 'Định nghĩa đúng.',
        },
      ],
    });

    await processor.process(makeJob());

    expect(tx.annotatedSegment.deleteMany).toHaveBeenCalledWith({
      where: { aiFeedbackId: 'feedback-1' },
    });
    expect(tx.annotatedSegment.createMany).not.toHaveBeenCalled();
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'turn.feedback_ready',
      { answerId: 'answer-1', hasAnnotations: false },
    );
  });

  it('ghi DB transaction xong rồi mới emit SSE feedback_ready', async () => {
    await processor.process(makeJob());

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockSse.emit).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction.mock.invocationCallOrder[0]).toBeLessThan(
      mockSse.emit.mock.invocationCallOrder[0],
    );
  });

  it('không retry hoặc ghi fallback chỉ vì SSE phát thất bại', async () => {
    mockSse.emit.mockRejectedValue(new Error('Redis unavailable'));

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.aiFeedback.upsert).toHaveBeenCalledTimes(1);
  });

  it('lỗi thường ở attempt đầu thì throw để BullMQ retry, chưa ghi fallback', async () => {
    strategy.evaluateAnswer.mockRejectedValue(new Error('AI unavailable'));

    await expect(processor.process(makeJob(0))).rejects.toThrow(
      'AI unavailable',
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(mockSse.emit).not.toHaveBeenCalled();
    expect(mockReportService.enqueueIfAllFeedbacksReady).not.toHaveBeenCalled();
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
    expect(fallbackArgs.create).not.toHaveProperty('dimensionScores');
    expect(tx.userAnswer.update).toHaveBeenCalledWith({
      where: { id: 'answer-1' },
      data: { feedbackGenerated: true },
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('AI provider quota exhausted'),
    );
    expect(errorSpy).not.toHaveBeenCalled();
    expect(mockReportService.enqueueIfAllFeedbacksReady).toHaveBeenCalledWith(
      'session-123',
      'hr',
      'VN',
      'vi',
    );
  });

  it('không retry AI_TIMEOUT và ghi fallback ngay ở lần đầu', async () => {
    strategy.evaluateAnswer.mockRejectedValue(
      new InterviewAIException(
        ErrorCode.AI_TIMEOUT,
        HttpStatus.GATEWAY_TIMEOUT,
        'AI provider request timed out',
      ),
    );

    await expect(processor.process(makeJob(0))).resolves.toBeUndefined();

    const fallbackArgs = tx.aiFeedback.upsert.mock.calls[0][0];
    expect(fallbackArgs.create).toEqual(
      expect.objectContaining({ isFallback: true }),
    );
    expect(tx.userAnswer.update).toHaveBeenCalledWith({
      where: { id: 'answer-1' },
      data: { feedbackGenerated: true },
    });
  });

  it('không retry output AI sai schema và ghi fallback ngay ở lần đầu', async () => {
    strategy.evaluateAnswer.mockRejectedValue(
      new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Invalid JSON from AI',
      ),
    );
    const warnSpy = jest.spyOn((processor as any).logger, 'warn');

    await expect(processor.process(makeJob(0))).resolves.toBeUndefined();

    const fallbackArgs = tx.aiFeedback.upsert.mock.calls[0][0];
    expect(fallbackArgs.create).toEqual(
      expect.objectContaining({ isFallback: true }),
    );
    expect(tx.userAnswer.update).toHaveBeenCalledWith({
      where: { id: 'answer-1' },
      data: { feedbackGenerated: true },
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Using fallback feedback'),
    );
  });

  it('EvaluateAnswer nhận sessionType từ job data', async () => {
    await processor.process(makeJob());

    expect(strategy.evaluateAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sessionType: 'hr' }),
    );
  });

  it('đọc ContextPack theo context của session', async () => {
    await processor.process(makeJob());

    expect(mockContextPack.getContextPack).toHaveBeenCalledWith('VN');
  });

  it('evaluateAnswer được gọi với đúng FeedbackInput: sessionType, questionText, answerText', async () => {
    await processor.process(makeJob());

    expect(strategy.evaluateAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionType: 'hr',
        questionId: 'q-1',
        questionText: 'Giới thiệu bản thân?',
        questionCategory: 'behavioral',
        competencyDomains: ['D1', 'D6'],
        answerText: 'Tôi là backend developer.',
        language: 'vi',
      }),
    );
  });

  it('SSE turn.feedback_ready phát với channel sse:session:{sessionId} và hasAnnotations đúng', async () => {
    await processor.process(makeJob());

    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'turn.feedback_ready',
      { answerId: 'answer-1', hasAnnotations: true },
    );
  });

  it('SSE session.feedback_progress phát sau feedback_ready với payload progress hiện tại', async () => {
    const progress = {
      sessionId: 'session-123',
      status: 'completing',
      totalQuestions: 5,
      answeredQuestions: 5,
      skippedQuestions: 1,
      feedbackRequired: 4,
      feedbackCompleted: 3,
      feedbackPending: 1,
      reportReady: false,
    };
    mockReportService.getFeedbackProgress.mockResolvedValue(progress);

    await processor.process(makeJob());

    expect(mockReportService.getFeedbackProgress).toHaveBeenCalledWith(
      'session-123',
    );
    expect(mockSse.emit).toHaveBeenNthCalledWith(
      2,
      'sse:session:session-123',
      'session.feedback_progress',
      progress,
    );
  });

  it('FeedbackProcessor cấu hình concurrency mặc định là 2', () => {
    expect(
      Reflect.getMetadata('bullmq:worker_metadata', FeedbackProcessor),
    ).toEqual(expect.objectContaining({ concurrency: 2 }));
  });

  it('technical session type được truyền sang EvaluateAnswer', async () => {
    const technicalJob = {
      data: { ...jobData, sessionType: 'technical' as const },
      attemptsMade: 0,
      opts: { attempts: 2 },
    } as Job<typeof jobData>;

    await processor.process(technicalJob);

    expect(strategy.evaluateAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sessionType: 'technical' }),
    );
  });

  it('gọi enqueueIfAllFeedbacksReady sau khi feedback thành công', async () => {
    const mockStrategy = {
      evaluateAnswer: jest.fn().mockResolvedValue({
        overallScore: 80,
        modelAnswer: 'Model answer',
        keyTakeaway: 'Key point',
        promptVersion: 'v1.1',
        annotatedSegments: [],
      }),
    };
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue(mockStrategy);
    prisma.$transaction.mockImplementation(async (cb) => cb(tx));
    tx.aiFeedback.upsert.mockResolvedValue({ id: 'fb-1' });
    tx.annotatedSegment.deleteMany.mockResolvedValue({ count: 0 });
    tx.annotatedSegment.createMany.mockResolvedValue({ count: 0 });
    tx.userAnswer.update.mockResolvedValue({});
    mockSse.emit.mockResolvedValue(undefined);

    const job = {
      data: {
        sessionId: 'session-123',
        turnId: 'turn-1',
        answerId: 'answer-1',
        questionText: 'Tell me about yourself?',
        answerText: 'I am a developer.',
        contextPack: 'VN' as const,
        sessionType: 'hr' as const,
        language: 'vi' as const,
      },
      attemptsMade: 0,
      opts: { attempts: 2 },
    } as unknown as Job<any>;

    await processor.process(job);

    expect(mockReportService.enqueueIfAllFeedbacksReady).toHaveBeenCalledWith(
      'session-123',
      'hr',
      'VN',
      'vi',
    );
  });

  it('retry cục bộ report readiness một lần rồi thành công nếu lần đầu lỗi', async () => {
    mockReportService.enqueueIfAllFeedbacksReady
      .mockRejectedValueOnce(new Error('Redis queue hiccup'))
      .mockResolvedValueOnce(undefined);

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    expect(mockReportService.enqueueIfAllFeedbacksReady).toHaveBeenCalledTimes(
      2,
    );
    expect(mockReportService.enqueueIfAllFeedbacksReady).toHaveBeenCalledWith(
      'session-123',
      'hr',
      'VN',
      'vi',
    );
  });

  it('throw sau khi report readiness lỗi liên tiếp để BullMQ retry job, tránh session kẹt completing', async () => {
    mockReportService.enqueueIfAllFeedbacksReady.mockRejectedValue(
      new Error('Report queue unavailable'),
    );

    await expect(processor.process(makeJob())).rejects.toThrow(
      'Report queue unavailable',
    );

    expect(tx.userAnswer.update).toHaveBeenCalledWith({
      where: { id: 'answer-1' },
      data: { feedbackGenerated: true },
    });
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'turn.feedback_ready',
      { answerId: 'answer-1', hasAnnotations: true },
    );
    expect(mockReportService.enqueueIfAllFeedbacksReady).toHaveBeenCalledTimes(
      2,
    );
  });
});
