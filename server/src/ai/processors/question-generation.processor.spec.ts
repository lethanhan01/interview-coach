import { Test, TestingModule } from '@nestjs/testing';
import { QuestionGenerationProcessor } from './question-generation.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import {
  createMockPrismaService,
  createMockSseService,
  createMockContextPackService,
  createMockPipelineStrategyFactory,
  createMockQuestionBank,
} from '../../test-utils/mock-factories';
import type { Job } from 'bullmq';

describe('QuestionGenerationProcessor', () => {
  let processor: QuestionGenerationProcessor;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockSse: ReturnType<typeof createMockSseService>;
  let mockContextPack: ReturnType<typeof createMockContextPackService>;
  let mockFactory: ReturnType<typeof createMockPipelineStrategyFactory>;

  const BASE_JOB_DATA = {
    sessionId: 'session-123',
    sessionType: 'HR' as const,
    jobDescriptionText: 'Backend developer tại công ty ABC.',
    targetRoles: ['Backend Developer'],
    contextPack: 'VN' as const,
    totalQuestions: 5,
  };

  const makeJob = (data = BASE_JOB_DATA) =>
    ({ data }) as Job<typeof BASE_JOB_DATA>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockSse = createMockSseService();
    mockContextPack = createMockContextPackService();
    mockFactory = createMockPipelineStrategyFactory();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionGenerationProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SseService, useValue: mockSse },
        { provide: ContextPackService, useValue: mockContextPack },
        { provide: PipelineStrategyFactory, useValue: mockFactory },
      ],
    }).compile();

    processor = module.get<QuestionGenerationProcessor>(
      QuestionGenerationProcessor,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('tạo questions, cập nhật session status=ready và emit SSE khi thành công', async () => {
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
    mockPrisma.interviewSession.update.mockResolvedValue({} as any);
    mockSse.emit.mockResolvedValue(undefined);

    await processor.process(makeJob());

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
    });
    expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
      where: { id: 'session-123' },
      data: { status: 'ready' },
    });
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'session.status',
      { status: 'ready', sessionId: 'session-123' },
    );
  });

  it('cập nhật session status=error và emit SSE error khi AI và fallback đều thất bại', async () => {
    const mockStrategy = {
      generateQuestions: jest.fn().mockRejectedValue(new Error('OpenAI timeout')),
    };
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue(mockStrategy);
    mockPrisma.interviewSession.update.mockResolvedValue({} as any);
    mockSse.emit.mockResolvedValue(undefined);
    // questionBank.findMany defaults to [] from factory — triggers fallback error path

    await processor.process(makeJob());

    expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
      where: { id: 'session-123' },
      data: { status: 'error' },
    });
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'session.status',
      { status: 'error' },
    );
  });

  describe('fallback path (AI failure)', () => {
    it('tạo SessionQuestion từ question_bank khi AI thất bại', async () => {
      const mockQuestions = [
        createMockQuestionBank({ id: 'qb-1', difficulty: 2 }),
        createMockQuestionBank({ id: 'qb-2', difficulty: 3 }),
        createMockQuestionBank({ id: 'qb-3', difficulty: 4 }),
      ];
      const mockStrategy = {
        generateQuestions: jest.fn().mockRejectedValue(new Error('AI timeout')),
      };
      mockContextPack.getContextPack.mockReturnValue({} as any);
      mockFactory.getStrategy.mockReturnValue(mockStrategy);
      mockPrisma.questionBank.findMany.mockResolvedValue(mockQuestions);
      mockPrisma.sessionQuestion.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.interviewSession.update.mockResolvedValue({} as any);
      mockSse.emit.mockResolvedValue(undefined);

      await processor.process(makeJob());

      expect(mockPrisma.sessionQuestion.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              sessionId: 'session-123',
              questionBankId: 'qb-1',
            }),
          ]),
        }),
      );
      expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { status: 'ready' },
      });
      expect(mockSse.emit).toHaveBeenCalledWith(
        'sse:session:session-123',
        'session.status',
        { status: 'ready', sessionId: 'session-123' },
      );
    });

    it('set session status=error khi question_bank trả về 0 kết quả', async () => {
      const mockStrategy = {
        generateQuestions: jest.fn().mockRejectedValue(new Error('AI timeout')),
      };
      mockContextPack.getContextPack.mockReturnValue({} as any);
      mockFactory.getStrategy.mockReturnValue(mockStrategy);
      mockPrisma.interviewSession.update.mockResolvedValue({} as any);
      mockSse.emit.mockResolvedValue(undefined);
      // questionBank.findMany defaults to [] from factory

      await processor.process(makeJob());

      expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { status: 'error' },
      });
      expect(mockPrisma.sessionQuestion.createMany).not.toHaveBeenCalled();
    });
  });
});
