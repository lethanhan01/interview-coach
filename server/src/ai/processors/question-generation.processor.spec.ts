import { Test, TestingModule } from '@nestjs/testing';
import { QuestionGenerationProcessor } from './question-generation.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import { QuestionBankService } from '../../question-bank/question-bank.service';
import { OpenAIGateway } from '../openai.gateway';
import {
  createMockPrismaService,
  createMockSseService,
  createMockContextPackService,
  createMockPipelineStrategyFactory,
  createMockQuestionBankService,
  createMockOpenAIGateway,
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
  let mockOpenAI: ReturnType<typeof createMockOpenAIGateway>;

  const BASE_JOB_DATA = {
    sessionId: 'session-123',
    sessionType: 'hr' as const,
    jobDescriptionText: 'Backend developer tại công ty ABC.',
    targetRoles: ['Backend Developer'],
    contextPack: 'VN' as const,
    language: 'vi',
    totalQuestions: 5,
    durationMin: 30,
  };

  const MOCK_CONTEXT_PACK = {
    behavioralDimensions: [
      { id: 'D1', name: 'Communication', weight: 0.2 },
      { id: 'D2', name: 'Critical Thinking', weight: 0.2 },
      { id: 'D3', name: 'Collaboration & Teamwork', weight: 0.15 },
      { id: 'D4', name: 'Leadership & Initiative', weight: 0.2 },
      { id: 'D5', name: 'Culture Fit & Values', weight: 0.15 },
      { id: 'D6', name: 'Self-Awareness & Growth', weight: 0.1 },
    ],
    technicalDimensions: [
      { id: 'TD1', name: 'Foundational Knowledge', weight: 0.2 },
      { id: 'TD2', name: 'Practical Application', weight: 0.25 },
      { id: 'TD3', name: 'Systems Thinking', weight: 0.2 },
      { id: 'TD4', name: 'Code Quality & Best Practices', weight: 0.2 },
      { id: 'TD5', name: 'Debug & Problem-solving', weight: 0.15 },
    ],
  };

  const makeJob = (data = BASE_JOB_DATA) =>
    ({ data }) as Job<typeof BASE_JOB_DATA>;

  const makeGeneratedQuestions = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      text: `AI question ${index + 1}`,
      category: 'behavioral',
      competencyDomains: ['D1'],
      difficulty: 2,
    }));

  const makeFallbackQuestions = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      questionBankId: `qb-${index + 1}`,
      text: `Fallback question ${index + 1}`,
      questionCategory: 'behavioral',
      competencyDomains: ['D4'],
      estimatedTimeMin: 5,
    }));

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockSse = createMockSseService();
    mockContextPack = createMockContextPackService();
    mockFactory = createMockPipelineStrategyFactory();
    mockQuestionBankService = createMockQuestionBankService();
    mockOpenAI = createMockOpenAIGateway();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionGenerationProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SseService, useValue: mockSse },
        { provide: ContextPackService, useValue: mockContextPack },
        { provide: PipelineStrategyFactory, useValue: mockFactory },
        { provide: QuestionBankService, useValue: mockQuestionBankService },
        { provide: OpenAIGateway, useValue: mockOpenAI },
      ],
    }).compile();

    processor = module.get<QuestionGenerationProcessor>(
      QuestionGenerationProcessor,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('tạo 5 questions hybrid (QB pos 1-4, AI pos 5), cập nhật status=active và emit SSE', async () => {
    // totalQuestions=5 → aiCount=1, qbCount=4
    const aiQuestion = {
      text: 'Điểm mạnh là gì?',
      category: 'behavioral',
      competencyDomains: ['D1'],
      difficulty: 2,
    };
    const qbResult = makeFallbackQuestions(4);
    const mockStrategy = {
      generateQuestions: jest.fn().mockResolvedValue([aiQuestion]),
    };
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
    mockFactory.getStrategy.mockReturnValue(mockStrategy);
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(qbResult);
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockResolvedValue(undefined);

    await processor.process(makeJob()); // totalQuestions=5

    expect(mockFactory.getStrategy).toHaveBeenCalledWith('hr');
    expect(mockStrategy.generateQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'vi' }),
    );
    expect(
      mockQuestionBankService.selectFallbackQuestions,
    ).toHaveBeenCalledWith('hr', 'VN', 4, 'vi');
    const createArgs = mockPrisma.sessionQuestion.createMany.mock.calls[0][0];
    expect(createArgs.data).toHaveLength(5);
    // QB questions at pos 1-4
    expect(createArgs.data[0]).toEqual(
      expect.objectContaining({
        sessionId: 'session-123',
        questionBankId: 'qb-1',
        orderIndex: 1,
      }),
    );
    expect(createArgs.data[3]).toEqual(
      expect.objectContaining({
        sessionId: 'session-123',
        questionBankId: 'qb-4',
        orderIndex: 4,
      }),
    );
    // AI question at pos 5, no questionBankId
    expect(createArgs.data[4]).toEqual(
      expect.objectContaining({
        sessionId: 'session-123',
        questionText: 'Điểm mạnh là gì?',
        orderIndex: 5,
        questionCategory: 'behavioral',
        competencyDomains: ['D1'],
        estimatedTimeMin: 5,
      }),
    );
    expect(createArgs.data[4]).not.toHaveProperty('questionBankId');
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

  it('truyền language=en vào AI strategy và Question Bank khi session dùng Western', async () => {
    const mockStrategy = {
      generateQuestions: jest.fn().mockResolvedValue([
        {
          text: 'Tell me about a time you handled a conflict.',
          category: 'behavioral',
          competencyDomains: ['D4'],
          difficulty: 2,
        },
      ]),
    };
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
    mockFactory.getStrategy.mockReturnValue(mockStrategy);
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
      makeFallbackQuestions(4),
    );
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockResolvedValue(undefined);

    await processor.process(
      makeJob({
        ...BASE_JOB_DATA,
        contextPack: 'Western',
        language: 'en',
      } as any),
    );

    expect(mockContextPack.getContextPack).toHaveBeenCalledWith('Western');
    expect(mockStrategy.generateQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en' }),
    );
    expect(
      mockQuestionBankService.selectFallbackQuestions,
    ).toHaveBeenCalledWith('hr', 'Western', 4, 'en');
  });

  it('normalize AI free-form rubric name trước khi persist', async () => {
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue([
        {
          text: 'Tell me about a time you learned from feedback.',
          category: 'Self-Awareness & Growth',
          competencyDomains: ['Self-Awareness & Growth'],
          difficulty: 2,
        },
      ]),
    });
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
      makeFallbackQuestions(4),
    );
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockResolvedValue(undefined);

    await processor.process(
      makeJob({ ...BASE_JOB_DATA, contextPack: 'Western' } as any),
    );

    const createArgs = mockPrisma.sessionQuestion.createMany.mock.calls[0][0];
    expect(createArgs.data[4]).toEqual(
      expect.objectContaining({
        questionText: 'Tell me about a time you learned from feedback.',
        questionCategory: 'behavioral',
        competencyDomains: ['D6'],
        estimatedTimeMin: 5,
      }),
    );
  });

  it('drop AI question sai domain sessionType và bù đủ bằng question_bank', async () => {
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue([
        {
          text: 'Explain a production debugging workflow.',
          category: 'technical',
          competencyDomains: ['TD5'],
          difficulty: 2,
        },
      ]),
    });
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
      makeFallbackQuestions(5),
    );
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockResolvedValue(undefined);

    await processor.process(makeJob());

    expect(
      mockQuestionBankService.selectFallbackQuestions,
    ).toHaveBeenCalledWith('hr', 'VN', 5, 'vi');
    const createArgs = mockPrisma.sessionQuestion.createMany.mock.calls[0][0];
    expect(createArgs.data).toHaveLength(5);
    expect(
      createArgs.data.some(
        (q: { questionText: string }) =>
          q.questionText === 'Explain a production debugging workflow.',
      ),
    ).toBe(false);
  });

  it('QG-04: chỉ lấy aiCount câu từ AI khi AI trả dư; tổng vẫn bằng totalQuestions', async () => {
    // totalQuestions=5 → aiCount=1; AI returns 7 but gets sliced to 1
    const generatedQuestions = makeGeneratedQuestions(7);
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue(generatedQuestions),
    });
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
      makeFallbackQuestions(4),
    );
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockResolvedValue(undefined);

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    const createArgs = mockPrisma.sessionQuestion.createMany.mock.calls[0][0];
    expect(createArgs.data).toHaveLength(5);
    expect(
      createArgs.data.map((q: { orderIndex: number }) => q.orderIndex),
    ).toEqual([1, 2, 3, 4, 5]);
    expect(
      mockQuestionBankService.selectFallbackQuestions,
    ).toHaveBeenCalledWith('hr', 'VN', 4, 'vi');
  });

  it('đặt AI question vào vị trí hợp lệ khi phiên ngắn hơn chu kỳ 5 câu', async () => {
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue(makeGeneratedQuestions(1)),
    });
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
      makeFallbackQuestions(2),
    );
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 3 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockResolvedValue(undefined);

    await expect(
      processor.process(
        makeJob({ ...BASE_JOB_DATA, totalQuestions: 3, durationMin: 30 } as any),
      ),
    ).resolves.toBeUndefined();

    const createArgs = mockPrisma.sessionQuestion.createMany.mock.calls[0][0];
    expect(createArgs.data).toHaveLength(3);
    expect(
      createArgs.data.map(
        (q: { orderIndex: number; questionText: string }) => ({
          orderIndex: q.orderIndex,
          questionText: q.questionText,
        }),
      ),
    ).toEqual([
      { orderIndex: 1, questionText: 'Fallback question 1' },
      { orderIndex: 2, questionText: 'Fallback question 2' },
      { orderIndex: 3, questionText: 'AI question 1' },
    ]);
    expect(
      mockQuestionBankService.selectFallbackQuestions,
    ).toHaveBeenCalledWith('hr', 'VN', 2, 'vi');
  });

  it('QG-05: dùng fallback khi AI trả 0 câu (ít hơn aiCount=1)', async () => {
    // totalQuestions=5 → aiCount=1; AI returns 0 → 0 < 1 → fallback all-QB
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue([]),
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
  });

  it('cập nhật session status=error và emit SSE error khi AI và fallback đều thất bại', async () => {
    const mockStrategy = {
      generateQuestions: jest
        .fn()
        .mockRejectedValue(new Error('OpenAI timeout')),
    };
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
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
    // totalQuestions=5 → aiCount=1, qbCount=4; QB called once (hybrid), not twice
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue(makeGeneratedQuestions(1)),
    });
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
      makeFallbackQuestions(4),
    );
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockRejectedValue(new Error('Redis unavailable'));

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    // QB called once for hybrid qbCount=4 — not zero, not twice (no second fallback)
    expect(
      mockQuestionBankService.selectFallbackQuestions,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockQuestionBankService.selectFallbackQuestions,
    ).toHaveBeenCalledWith('hr', 'VN', 4, 'vi');
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
      competencyDomains: ['D1'],
      difficulty: 2,
    }));
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue(generatedQuestions),
    });
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
      makeFallbackQuestions(4),
    );
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
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue(makeGeneratedQuestions(5)),
    });
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
      makeFallbackQuestions(4),
    );
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
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
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
    expect(mockPrisma.sessionQuestion.createMany).toHaveBeenCalledTimes(1);
  });

  describe('fallback path (AI failure)', () => {
    it('tạo SessionQuestion từ question_bank khi AI thất bại', async () => {
      const mockQuestions = Array.from({ length: 5 }, (_, index) => ({
        questionBankId: `qb-${index + 1}`,
        text: `Fallback question ${index + 1}`,
        questionCategory: 'behavioral',
        competencyDomains: ['D4'],
        estimatedTimeMin: 5,
      }));
      const mockStrategy = {
        generateQuestions: jest.fn().mockRejectedValue(new Error('AI timeout')),
      };
      mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
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
        competencyDomains: ['D4'],
        estimatedTimeMin: 5,
      }));
      const generateQuestions = jest.fn().mockRejectedValue(quotaError);
      mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
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
      mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
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
    });

    it('set session status=error khi question_bank trả về 0 kết quả', async () => {
      const mockStrategy = {
        generateQuestions: jest.fn().mockRejectedValue(new Error('AI timeout')),
      };
      mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
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
