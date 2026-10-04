import { Test, TestingModule } from '@nestjs/testing';
import { QuestionGenerationProcessor } from './question-generation.processor';
import { GenerateSessionQuestions } from './generate-session-questions.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { SseService } from '@infra/realtime/redis/sse.service';
import { AssessmentFacade } from '@modules/interview-assessment/contracts';
import { PipelineStrategyFactory } from '@infra/ai/pipelines/pipeline-strategy.factory';
import { QuestionBankService } from '../question-bank/question-bank.service';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';
import { HybridMappingService } from '../taxonomy/hybrid-mapping.service';
import { OpenAIGateway } from '@infra/ai/openai.gateway';
import { AI_GATEWAY_TOKEN } from '@infra/ai/ai-gateway.interface';
import {
  createMockPrismaService,
  createMockSseService,
  createMockContextPackService,
  createMockPipelineStrategyFactory,
  createMockQuestionBankService,
  createMockQuestionCriteriaService,
  createMockSkillTargetedQuestionGeneratorService,
  createMockOpenAIGateway,
} from '@core/test-utils/mock-factories';
import { SkillTargetedQuestionGeneratorService } from './skill-targeted-question-generator.service';
import type { Job } from 'bullmq';
import { HttpStatus } from '@nestjs/common';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

describe('QuestionGenerationProcessor', () => {
  let processor: QuestionGenerationProcessor;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockSse: ReturnType<typeof createMockSseService>;
  let mockContextPack: ReturnType<typeof createMockContextPackService>;
  let mockFactory: ReturnType<typeof createMockPipelineStrategyFactory>;
  let mockQuestionBankService: ReturnType<typeof createMockQuestionBankService>;
  let mockSkillGenerator: ReturnType<
    typeof createMockSkillTargetedQuestionGeneratorService
  >;
  let mockQuestionCriteria: ReturnType<
    typeof createMockQuestionCriteriaService
  >;
  let mockOpenAI: ReturnType<typeof createMockOpenAIGateway>;

  const BASE_JOB_DATA = {
    sessionId: 'session-123',
    sessionType: 'hr' as const,
    jobDescriptionText: 'Backend developer tại công ty ABC.',
    targetRoles: ['Backend Developer'],
    contextPack: 'VN' as const,
    rubricVersionId: 'rubric-version-vn',
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
      { id: 'TD3', name: 'System Design', weight: 0.2 },
      { id: 'TD4', name: 'Code Quality', weight: 0.2 },
      { id: 'TD5', name: 'Troubleshooting & Debugging', weight: 0.15 },
    ],
    scoringWeights: {
      behavioral_weight: 0.4,
      technical_weight: 0.6,
    },
    culturalNotes: 'Văn hóa công sở tại Việt Nam.',
    rubricDimensions: [
      'D1',
      'D2',
      'D3',
      'D4',
      'D5',
      'D6',
      'TD1',
      'TD2',
      'TD3',
      'TD4',
      'TD5',
    ],
  };

  const makeJob = (
    data?: Partial<
      typeof BASE_JOB_DATA & {
        onetSocCode?: string;
        targetSfiaLevel?: number;
        normalizedTechStack?: string[];
      }
    >,
  ) => ({ data: { ...BASE_JOB_DATA, ...data } }) as Job<any>;

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
    mockSkillGenerator = createMockSkillTargetedQuestionGeneratorService();
    mockQuestionCriteria = createMockQuestionCriteriaService();
    mockOpenAI = createMockOpenAIGateway();
    mockPrisma.$transaction.mockImplementation((operations) =>
      Promise.all(operations),
    );
    mockQuestionCriteria.buildSessionQuestionCriteriaData.mockImplementation(
      async ({ sessionQuestionId, criterionCodes }) =>
        criterionCodes.map((code) => ({
          sessionQuestionId,
          rubricCriterionId: `criterion-${code}`,
        })),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionGenerationProcessor,
        GenerateSessionQuestions,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SseService, useValue: mockSse },
        { provide: AssessmentFacade, useValue: mockContextPack },
        { provide: PipelineStrategyFactory, useValue: mockFactory },
        { provide: QuestionBankService, useValue: mockQuestionBankService },
        {
          provide: SkillTargetedQuestionGeneratorService,
          useValue: mockSkillGenerator,
        },
        { provide: QuestionCriteriaService, useValue: mockQuestionCriteria },
        { provide: AI_GATEWAY_TOKEN, useValue: mockOpenAI },
        { provide: OpenAIGateway, useValue: mockOpenAI },
        {
          provide: HybridMappingService,
          useValue: {
            resolveSkillsForSession: jest.fn().mockResolvedValue([
              {
                skillCode: 'PROG',
                targetLevel: 3,
                weight: 1.5,
                isCore: true,
                source: 'curated',
                techContext: ['Node.js'],
              },
              {
                skillCode: 'TEST',
                targetLevel: 3,
                weight: 1.0,
                isCore: true,
                source: 'curated',
                techContext: ['Jest'],
              },
            ]),
          },
        },
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
    expect(mockContextPack.getContextPack).toHaveBeenCalledWith('VN');
    expect(mockContextPack.getRubricSnapshot).not.toHaveBeenCalled();
    expect(mockStrategy.generateQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'vi' }),
    );
    expect(
      mockQuestionBankService.selectFallbackQuestions,
    ).toHaveBeenCalledWith('hr', 'VN', 4, 'vi', 'rubric-version-vn');
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
        estimatedTimeMin: 5,
      }),
    );
    expect(createArgs.data[4]).not.toHaveProperty('competencyDomains');
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
    ).toHaveBeenCalledWith('hr', 'Western', 4, 'en', 'rubric-version-vn');
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
        estimatedTimeMin: 5,
      }),
    );
    expect(createArgs.data[4]).not.toHaveProperty('competencyDomains');
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
    ).toHaveBeenCalledWith('hr', 'VN', 5, 'vi', 'rubric-version-vn');
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
    ).toHaveBeenCalledWith('hr', 'VN', 4, 'vi', 'rubric-version-vn');
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
        makeJob({
          ...BASE_JOB_DATA,
          totalQuestions: 3,
          durationMin: 30,
        } as any),
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
    ).toHaveBeenCalledWith('hr', 'VN', 2, 'vi', 'rubric-version-vn');
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
    ).toHaveBeenCalledWith('hr', 'VN', 4, 'vi', 'rubric-version-vn');
    expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-123',
        status: { in: ['generating', 'ready'] },
      },
      data: { status: 'active' },
    });
  });

  it('persist session_question_criteria theo rubric version đã khóa của session', async () => {
    mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
    mockFactory.getStrategy.mockReturnValue({
      generateQuestions: jest.fn().mockResolvedValue(makeGeneratedQuestions(1)),
    });
    mockQuestionBankService.selectFallbackQuestions.mockResolvedValue(
      makeFallbackQuestions(4),
    );
    mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 5 });
    mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
    mockSse.emit.mockResolvedValue(undefined);

    await processor.process(makeJob());

    const createArgs = mockPrisma.sessionQuestion.createMany.mock.calls[0][0];
    expect(createArgs.data).toHaveLength(5);
    expect(createArgs.data.every((row: object) => !('rubricJson' in row))).toBe(
      true,
    );
    expect(
      mockQuestionCriteria.buildSessionQuestionCriteriaData,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ rubricVersionId: 'rubric-version-vn' }),
    );
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

  it.each(['canceled', 'error'])(
    'không hồi sinh session %s khi question worker hoàn tất muộn',
    async () => {
      mockContextPack.getContextPack.mockReturnValue(MOCK_CONTEXT_PACK as any);
      mockFactory.getStrategy.mockReturnValue({
        generateQuestions: jest
          .fn()
          .mockResolvedValue(makeGeneratedQuestions(1)),
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
    },
  );

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
    ).toHaveBeenCalledWith('hr', 'VN', 5, 'vi', 'rubric-version-vn');
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
      ).toHaveBeenCalledWith('hr', 'VN', 5, 'vi', 'rubric-version-vn');
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
      ).toHaveBeenCalledWith('hr', 'VN', 5, 'vi', 'rubric-version-vn');
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

    it('khởi tạo các bản ghi session_skills cho session trước khi cấp phát câu hỏi', async () => {
      const mockStrategy = {
        generateQuestions: jest.fn().mockResolvedValue([
          {
            text: 'Mô tả kinh nghiệm lập trình',
            category: 'technical',
            competencyDomains: ['TD1'],
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
          sessionType: 'technical',
          onetSocCode: '15-1252.00',
          targetSfiaLevel: 3,
          normalizedTechStack: ['Node.js', 'PostgreSQL'],
        }),
      );

      expect(mockPrisma.sessionSkill.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            sessionId: 'session-123',
            skillCode: 'PROG',
            techContext: ['Node.js'],
          }),
        ]),
        skipDuplicates: true,
      });
    });

    it('thực thi Hybrid Unified Allocation khi session_skills tồn tại (phân bổ QuestionBank + AI fallback và rubricCriteria)', async () => {
      // Mock session_skills trong DB
      mockPrisma.sessionSkill.findMany.mockResolvedValue([
        {
          id: 'sk-prog',
          sessionId: 'session-123',
          skillCode: 'PROG',
          targetLevel: 4,
          weight: 1.5,
          techContext: ['NestJS', 'PostgreSQL'],
        },
        {
          id: 'sk-dbds',
          sessionId: 'session-123',
          skillCode: 'DBDS',
          targetLevel: 4,
          weight: 1.0,
          techContext: ['PostgreSQL'],
        },
      ]);

      // Mock allocateQuestionsForSessionSkills: PROG được 1 câu từ bank, DBDS thiếu 1 câu
      mockQuestionBankService.allocateQuestionsForSessionSkills.mockResolvedValue(
        {
          allocatedQuestions: [
            {
              questionBankId: 'qb-prog-1',
              sessionSkillId: 'sk-prog',
              sfiaSkillCode: 'PROG',
              targetLevel: 4,
              questionText: 'Explain NestJS dependency injection lifecycle.',
              questionCategory: 'technical',
              source: 'bank',
              difficulty: 2,
              estimatedTimeMin: 5,
              rubricCriteria: [
                {
                  id: 'c1',
                  text: 'Core DI understanding',
                  dimension: 'core',
                  weight: 1.0,
                },
                {
                  id: 'c2',
                  text: 'Seniority scope management',
                  dimension: 'seniority',
                  weight: 1.0,
                },
              ],
            },
          ],
          uncoveredRequirements: [
            {
              requirement: {
                sessionSkillId: 'sk-dbds',
                skillCode: 'DBDS',
                targetLevel: 4,
                weight: 1.0,
                techContext: ['PostgreSQL'],
              },
              neededCount: 1,
            },
          ],
        },
      );

      // Mock AI Generator trả về câu hỏi cho DBDS
      mockSkillGenerator.generateQuestion.mockResolvedValue({
        questionText:
          'Trong PostgreSQL tải cao, làm sao giảm thiểu lock contention trên bảng lớn?',
        estimatedTimeMin: 6,
        rubricCriteria: [
          {
            id: 'crit_db_core',
            text: 'Nêu đúng cơ chế MVCC và Row-level locking',
            dimension: 'core',
            weight: 1.0,
          },
          {
            id: 'crit_db_sen',
            text: 'Phân tích trade-off khi phân vùng bảng (Partitioning)',
            dimension: 'seniority',
            weight: 1.0,
          },
        ],
        source: 'ai_generated',
        difficulty: 4,
      });

      mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.interviewSession.updateMany.mockResolvedValue({ count: 1 });
      mockSse.emit.mockResolvedValue(undefined);

      await processor.process(
        makeJob({
          sessionType: 'technical',
          totalQuestions: 2,
        }),
      );

      expect(
        mockQuestionBankService.allocateQuestionsForSessionSkills,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          totalQuestions: 2,
          sessionType: 'technical',
        }),
      );
      expect(mockSkillGenerator.generateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          skillCode: 'DBDS',
          targetLevel: 4,
        }),
      );

      const createArgs = mockPrisma.sessionQuestion.createMany.mock.calls[0][0];
      expect(createArgs.data).toHaveLength(2);
      // Kiểm tra progressive order: Dễ (difficulty 2) trước, Khó (difficulty 4) sau
      expect(createArgs.data[0].sfiaSkillCode).toBe('PROG');
      expect(createArgs.data[0].orderIndex).toBe(1);
      expect(createArgs.data[0].sessionSkillId).toBe('sk-prog');
      expect(createArgs.data[0].rubricCriteria).toHaveLength(2);

      expect(createArgs.data[1].sfiaSkillCode).toBe('DBDS');
      expect(createArgs.data[1].orderIndex).toBe(2);
      expect(createArgs.data[1].sessionSkillId).toBe('sk-dbds');
      expect(createArgs.data[1].source).toBe('ai_generated');
      expect(createArgs.data[1].rubricCriteria).toHaveLength(2);
    });
  });
});
