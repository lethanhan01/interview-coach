import { Test, TestingModule } from '@nestjs/testing';
import { QuestionGenerationProcessor } from './question-generation.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import { QuestionBankService } from '../../question-bank/question-bank.service';
import {
  createMockPrismaService,
  createMockSseService,
  createMockContextPackService,
  createMockPipelineStrategyFactory,
  createMockQuestionBankService,
} from '../../test-utils/mock-factories';
import type { Job } from 'bullmq';
import { HttpStatus } from '@nestjs/common';
import { InterviewAIException } from '../../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';

describe('QuestionGenerationProcessor', () => {
  let processor: QuestionGenerationProcessor;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockSse: ReturnType<typeof createMockSseService>;
  let mockContextPack: ReturnType<typeof createMockContextPackService>;
  let mockFactory: ReturnType<typeof createMockPipelineStrategyFactory>;
  let mockQuestionBankService: ReturnType<typeof createMockQuestionBankService>;

  const BASE_JOB_DATA = {
    sessionId: 'session-123',
    userId: 'user-abc',
    sessionType: 'hr' as const,
    jobDescriptionText: 'Backend developer tại công ty ABC.',
    targetRoles: ['Backend Developer'],
    contextPack: 'VN' as const,
    language: 'vi',
    totalQuestions: 5,
  };

  const makeJob = (data = BASE_JOB_DATA) =>
    ({ data }) as Job<typeof BASE_JOB_DATA>;

  const makeGeneratedQuestions = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      text: `AI question ${index + 1}`,
      category: 'behavioral',
      competencyDomain: 'communication',
    }));

  const makeFallbackQuestions = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      questionBankId: `qb-${index + 1}`,
      text: `Fallback question ${index + 1}`,
      questionCategory: 'behavioral',
      competencyDomain: 'D4',
      estimatedTimeMin: 5,
    }));

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockSse = createMockSseService();
    mockContextPack = createMockContextPackService();
    mockFactory = createMockPipelineStrategyFactory();
    mockQuestionBankService = createMockQuestionBankService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionGenerationProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SseService, useValue: mockSse },
        { provide: ContextPackService, useValue: mockContextPack },
        { provide: PipelineStrategyFactory, useValue: mockFactory },
        { provide: QuestionBankService, useValue: mockQuestionBankService },
      ],
    }).compile();

    processor = module.get<QuestionGenerationProcessor>(
      QuestionGenerationProcessor,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('tạo questions, cập nhật session status=active và emit SSE khi thành công', async () => {
    const generatedQuestions = [
      {
        text: 'Giới thiệu bản thân?',
        category: 'intro',
        competencyDomain: 'communication',
      },
      {
        text: 'Điểm mạnh là gì?',
        category: 'behavioral',
        competencyDomain: 'self-awareness',
      },
    ];
    const mockStrategy = {
      generateQuestions: jest.fn().mockResolvedValue(generatedQuestions),
    };
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue(mockStrategy);
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 2 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockResolvedValue(undefined);

    await processor.process(
      makeJob({ ...BASE_JOB_DATA, totalQuestions: generatedQuestions.length }),
    );

    expect(mockFactory.getStrategy).toHaveBeenCalledWith('hr');
    expect(mockPrisma.sessionQuestion.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          sessionId: 'session-123',
          questionText: 'Giới thiệu bản thân?',
          orderIndex: 1,
        }),
        expect.objectContaining({
          sessionId: 'session-123',
          questionText: 'Điểm mạnh là gì?',
          orderIndex: 2,
        }),
      ],
      skipDuplicates: true,
    });
    expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-123',
        status: { in: ['generating', 'ready'] },
      },
      data: { status: 'active' },
    });
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'session.status',
      { status: 'active', sessionId: 'session-123' },
    );
    expect(mockQuestionBankService.recordUsage).not.toHaveBeenCalled();
  });

  it('QG-04: chỉ lưu đúng totalQuestions khi AI trả dư câu hỏi', async () => {
    const generatedQuestions = makeGeneratedQuestions(7);
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue(generatedQuestions),
    });
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockResolvedValue(undefined);

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    const createArgs = mockPrisma.sessionQuestion.createMany.mock.calls[0][0];
    expect(createArgs.data).toHaveLength(5);
    expect(createArgs.data.map((q: { orderIndex: number }) => q.orderIndex)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(
      mockQuestionBankService.selectFallbackQuestions,
    ).not.toHaveBeenCalled();
    expect(mockQuestionBankService.recordUsage).not.toHaveBeenCalled();
  });

  it('QG-05: dùng fallback khi AI trả thiếu số câu yêu cầu', async () => {
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue(makeGeneratedQuestions(3)),
    });
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
      makeFallbackQuestions(5),
    );
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockResolvedValue(undefined);

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    const createArgs = mockPrisma.sessionQuestion.createMany.mock.calls[0][0];
    expect(createArgs.data).toHaveLength(5);
    expect(createArgs.data[0]).toEqual(
      expect.objectContaining({
        questionBankId: 'qb-1',
        questionText: 'Fallback question 1',
      }),
    );
    expect(mockQuestionBankService.recordUsage).toHaveBeenCalledTimes(5);
  });

  it('cập nhật session status=error và emit SSE error khi AI và fallback đều thất bại', async () => {
    const mockStrategy = {
      generateQuestions: jest
        .fn()
        .mockRejectedValue(new Error('OpenAI timeout')),
    };
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue(mockStrategy);
    mockPrisma.interviewSession.update.mockResolvedValue({} as any);
    mockSse.emit.mockResolvedValue(undefined);
    mockQuestionBankService.selectFallbackQuestions.mockRejectedValue(
      new Error('No fallback questions available for hr/VN'),
    );

    await expect(processor.process(makeJob())).rejects.toThrow(
      'No fallback questions available',
    );

    expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
      where: { id: 'session-123' },
      data: { status: 'error' },
    });
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'session.status',
      { status: 'error', sessionId: 'session-123' },
    );
  });

  it('không chuyển session sang error hoặc chạy fallback lần hai khi SSE emit thất bại', async () => {
    const generatedQuestions = Array.from({ length: 5 }, (_, index) => ({
      text: `Câu hỏi ${index + 1}`,
      category: 'behavioral',
      competencyDomain: 'communication',
    }));
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue(generatedQuestions),
    });
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockRejectedValue(new Error('Redis unavailable'));

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    expect(
      mockQuestionBankService.selectFallbackQuestions,
    ).not.toHaveBeenCalled();
    expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-123',
        status: { in: ['generating', 'ready'] },
      },
      data: { status: 'active' },
    });
  });

  it('không emit active nếu session đã bị tạm dừng trước khi worker hoàn tất', async () => {
    const generatedQuestions = Array.from({ length: 5 }, (_, index) => ({
      text: `Câu hỏi ${index + 1}`,
      category: 'behavioral',
      competencyDomain: 'communication',
    }));
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue(generatedQuestions),
    });
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 0 });

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-123',
        status: { in: ['generating', 'ready'] },
      },
      data: { status: 'active' },
    });
    expect(mockSse.emit).not.toHaveBeenCalled();
  });

  it('QG-15: không emit active khi session không còn eligible để active', async () => {
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue(makeGeneratedQuestions(5)),
    });
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 0 });

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-123',
        status: { in: ['generating', 'ready'] },
      },
      data: { status: 'active' },
    });
    expect(mockSse.emit).not.toHaveBeenCalled();
  });

  it('QG-08: ghi nhận hành vi hiện tại là AI_SERVICE_ERROR vẫn fallback ngay', async () => {
    const aiServiceError = new InterviewAIException(
      ErrorCode.AI_SERVICE_ERROR,
      HttpStatus.BAD_GATEWAY,
      'AI provider API error 500',
    );
    const generateQuestions = jest.fn().mockRejectedValue(aiServiceError);
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue({ generateQuestions });
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
      makeFallbackQuestions(5),
    );
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockResolvedValue(undefined);

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    expect(generateQuestions).toHaveBeenCalledTimes(1);
    expect(mockQuestionBankService.selectFallbackQuestions).toHaveBeenCalledWith(
      'hr',
      'VN',
      5,
      'vi',
    );
    expect(mockPrisma.sessionQuestion.createMany).toHaveBeenCalledTimes(1);
  });

  describe('fallback path (AI failure)', () => {
    it('tạo SessionQuestion từ question_bank khi AI thất bại', async () => {
      const mockQuestions = Array.from({ length: 5 }, (_, index) => ({
        questionBankId: `qb-${index + 1}`,
        text: `Fallback question ${index + 1}`,
        questionCategory: 'behavioral',
        competencyDomain: 'D4',
        estimatedTimeMin: 5,
      }));
      const mockStrategy = {
        generateQuestions: jest.fn().mockRejectedValue(new Error('AI timeout')),
      };
      mockContextPack.getContextPack.mockReturnValue({} as any);
      mockFactory.getStrategy.mockReturnValue(mockStrategy);
      mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
        mockQuestions,
      );
      mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
      mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
      mockSse.emit.mockResolvedValue(undefined);

      await processor.process(makeJob());

      const createCalls = mockPrisma.sessionQuestion.createMany.mock
        .calls as unknown as Array<
        [
          {
            skipDuplicates: boolean;
            data: Array<{ sessionId: string; questionBankId: string }>;
          },
        ]
      >;
      const fallbackCreate = createCalls[0][0];
      expect(fallbackCreate.skipDuplicates).toBe(true);
      expect(fallbackCreate.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sessionId: 'session-123',
            questionBankId: 'qb-1',
            questionText: 'Fallback question 1',
          }),
        ]),
      );
      expect(
        mockQuestionBankService.selectFallbackQuestions,
      ).toHaveBeenCalledWith('hr', 'VN', 5, 'vi');
      expect(mockQuestionBankService.recordUsage).toHaveBeenCalledWith(
        'qb-1',
        'session-123',
        'user-abc',
      );
      expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'session-123',
          status: { in: ['generating', 'ready'] },
        },
        data: { status: 'active' },
      });
      expect(mockSse.emit).toHaveBeenCalledWith(
        'sse:session:session-123',
        'session.status',
        { status: 'active', sessionId: 'session-123' },
      );
    });

    it('dùng fallback ngay, không retry OpenAI khi quota đã hết', async () => {
      const quotaError = new InterviewAIException(
        ErrorCode.AI_QUOTA_EXCEEDED,
        HttpStatus.SERVICE_UNAVAILABLE,
        'AI provider quota exhausted',
      );
      const mockQuestions = Array.from({ length: 5 }, (_, index) => ({
        questionBankId: `qb-${index + 1}`,
        text: `Fallback question ${index + 1}`,
        questionCategory: 'behavioral',
        competencyDomain: 'D4',
        estimatedTimeMin: 5,
      }));
      const generateQuestions = jest.fn().mockRejectedValue(quotaError);
      mockContextPack.getContextPack.mockReturnValue({} as any);
      mockFactory.getStrategy.mockReturnValue({ generateQuestions });
      mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
        mockQuestions,
      );
      mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
      mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
      mockSse.emit.mockResolvedValue(undefined);

      await expect(processor.process(makeJob())).resolves.toBeUndefined();

      expect(generateQuestions).toHaveBeenCalledTimes(1);
      const createCalls = mockPrisma.sessionQuestion.createMany.mock
        .calls as unknown as Array<
        [
          {
            skipDuplicates: boolean;
            data: Array<{ questionBankId: string }>;
          },
        ]
      >;
      const fallbackCreate = createCalls[0][0];
      expect(fallbackCreate.skipDuplicates).toBe(true);
      expect(fallbackCreate.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ questionBankId: 'qb-1' }),
          expect.objectContaining({ questionBankId: 'qb-5' }),
        ]),
      );
      expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'session-123',
          status: { in: ['generating', 'ready'] },
        },
        data: { status: 'active' },
      });
    });

    it.each([
      ErrorCode.AI_QUOTA_EXCEEDED,
      ErrorCode.AI_RATE_LIMIT,
      ErrorCode.AI_TIMEOUT,
      ErrorCode.AI_EMPTY_RESPONSE,
      ErrorCode.SCHEMA_VALIDATION_ERROR,
    ])('QG-07: dùng fallback ngay với %s', async (errorCode) => {
      const aiError = new InterviewAIException(
        errorCode,
        HttpStatus.SERVICE_UNAVAILABLE,
        `AI error ${errorCode}`,
      );
      const generateQuestions = jest.fn().mockRejectedValue(aiError);
      mockContextPack.getContextPack.mockReturnValue({} as any);
      mockFactory.getStrategy.mockReturnValue({ generateQuestions });
      mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
        makeFallbackQuestions(5),
      );
      mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
      mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
      mockSse.emit.mockResolvedValue(undefined);

      await expect(processor.process(makeJob())).resolves.toBeUndefined();

      expect(generateQuestions).toHaveBeenCalledTimes(1);
      expect(
        mockQuestionBankService.selectFallbackQuestions,
      ).toHaveBeenCalledWith('hr', 'VN', 5, 'vi');
      expect(mockQuestionBankService.recordUsage).toHaveBeenCalledTimes(5);
    });

    it('set session status=error khi question_bank trả về 0 kết quả', async () => {
      const mockStrategy = {
        generateQuestions: jest.fn().mockRejectedValue(new Error('AI timeout')),
      };
      mockContextPack.getContextPack.mockReturnValue({} as any);
      mockFactory.getStrategy.mockReturnValue(mockStrategy);
      mockPrisma.interviewSession.update.mockResolvedValue({} as any);
      mockSse.emit.mockResolvedValue(undefined);
      mockQuestionBankService.selectFallbackQuestions.mockRejectedValue(
        new Error('No fallback questions available for hr/VN'),
      );

      await expect(processor.process(makeJob())).rejects.toThrow(
        'No fallback questions available',
      );

      expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { status: 'error' },
      });
      expect(mockPrisma.sessionQuestion.createMany).not.toHaveBeenCalled();
    });
  });
});
