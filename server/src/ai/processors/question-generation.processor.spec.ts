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
import { HttpStatus } from '@nestjs/common';
import { InterviewAIException } from '../../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';

describe('QuestionGenerationProcessor', () => {
  let processor: QuestionGenerationProcessor;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockSse: ReturnType<typeof createMockSseService>;
  let mockContextPack: ReturnType<typeof createMockContextPackService>;
  let mockFactory: ReturnType<typeof createMockPipelineStrategyFactory>;

  const BASE_JOB_DATA = {
    sessionId: 'session-123',
    sessionType: 'hr' as const,
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
        status: { notIn: ['paused', 'canceled'] },
      },
      data: { status: 'active' },
    });
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'session.status',
      { status: 'active', sessionId: 'session-123' },
    );
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
    // questionBank.findMany defaults to [] from factory — triggers fallback error path

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

    expect(mockPrisma.questionBank.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-123',
        status: { notIn: ['paused', 'canceled'] },
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
        status: { notIn: ['paused', 'canceled'] },
      },
      data: { status: 'active' },
    });
    expect(mockSse.emit).not.toHaveBeenCalled();
  });

  describe('fallback path (AI failure)', () => {
    it('tạo SessionQuestion từ question_bank khi AI thất bại', async () => {
      const mockQuestions = [
        createMockQuestionBank({ id: 'qb-1', difficulty: 2 }),
        createMockQuestionBank({ id: 'qb-2', difficulty: 2 }),
        createMockQuestionBank({ id: 'qb-3', difficulty: 3 }),
        createMockQuestionBank({ id: 'qb-4', difficulty: 3 }),
        createMockQuestionBank({ id: 'qb-5', difficulty: 4 }),
      ];
      const mockStrategy = {
        generateQuestions: jest.fn().mockRejectedValue(new Error('AI timeout')),
      };
      mockContextPack.getContextPack.mockReturnValue({} as any);
      mockFactory.getStrategy.mockReturnValue(mockStrategy);
      mockPrisma.questionBank.findMany.mockResolvedValue(mockQuestions);
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
          }),
        ]),
      );
      expect(mockPrisma.interviewSession.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'session-123',
          status: { notIn: ['paused', 'canceled'] },
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
        'OpenAI quota exhausted',
      );
      const mockQuestions = Array.from({ length: 5 }, (_, index) =>
        createMockQuestionBank({
          id: `qb-${index + 1}`,
          difficulty: 2,
        }),
      );
      const generateQuestions = jest.fn().mockRejectedValue(quotaError);
      mockContextPack.getContextPack.mockReturnValue({} as any);
      mockFactory.getStrategy.mockReturnValue({ generateQuestions });
      mockPrisma.questionBank.findMany.mockResolvedValue(mockQuestions);
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
          status: { notIn: ['paused', 'canceled'] },
        },
        data: { status: 'active' },
      });
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
