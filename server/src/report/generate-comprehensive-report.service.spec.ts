import { Test, TestingModule } from '@nestjs/testing';
import type { Job } from 'bullmq';
import { GenerateComprehensiveReport } from './generate-comprehensive-report.service';
import { PrismaService } from '../prisma/prisma.service';
import { SseService } from '../infrastructure/realtime/redis/sse.service';
import { OpenAIGateway } from '../ai/openai.gateway';
import {
  createMockOpenAIGateway,
  createMockSseService,
} from '../test-utils/mock-factories';

interface FeedbackRow {
  userAnswerId: string;
  overallScore: number;
  keyTakeaway: string;
  isFallback?: boolean;
  dimensionScores?: unknown;
}

interface SessionUpdateArgs {
  where: { id: string };
  data: {
    status: string;
    overallScore: number | null;
    completedAt: Date;
  };
}

interface PrismaMock {
  userAnswer: {
    findMany: jest.MockedFunction<
      () => Promise<
        Array<{
          id: string;
          skipped: boolean;
          question: {
            questionText: string;
            orderIndex: number;
            criteria: Array<{
              rubricCriterion: {
                code: string;
                name: string;
                weight: number;
                displayOrder: number;
                rubricCategory: {
                  categoryKey: string;
                };
              };
            }>;
          };
        }>
      >
    >;
  };
  aiFeedback: {
    findMany: jest.MockedFunction<() => Promise<FeedbackRow[]>>;
    upsert: jest.MockedFunction<
      (args: unknown) => Promise<Record<string, never>>
    >;
  };
  interviewSession: {
    update: jest.MockedFunction<
      (args: SessionUpdateArgs) => Promise<Record<string, never>>
    >;
  };
  sessionReport: {
    upsert: jest.MockedFunction<
      (args: unknown) => Promise<Record<string, never>>
    >;
  };
  $transaction: jest.MockedFunction<
    (ops: Promise<unknown>[]) => Promise<unknown[]>
  >;
}

describe('GenerateComprehensiveReport', () => {
  let processor: GenerateComprehensiveReport;
  let prisma: PrismaMock;
  let mockSse: ReturnType<typeof createMockSseService>;
  let mockOpenAI: ReturnType<typeof createMockOpenAIGateway>;

  const jobData = {
    sessionId: 'session-123',
    sessionType: 'hr' as const,
    contextPack: 'VN' as const,
    language: 'vi' as const,
    turnIds: ['answer-1', 'answer-2'],
  };
  const job = { data: jobData } as Job<typeof jobData>;
  const criterion = (
    code: string,
    name: string,
    weight: number,
    displayOrder: number,
    categoryKey = 'behavioral',
  ) => ({
    rubricCriterion: {
      code,
      name,
      weight,
      displayOrder,
      rubricCategory: { categoryKey },
    },
  });

  beforeEach(async () => {
    prisma = {
      userAnswer: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'answer-1',
            skipped: false,
            question: {
              questionText: 'Question 1',
              orderIndex: 1,
              criteria: [],
            },
          },
          {
            id: 'answer-2',
            skipped: false,
            question: {
              questionText: 'Question 2',
              orderIndex: 2,
              criteria: [],
            },
          },
        ]),
      },
      aiFeedback: { findMany: jest.fn(), upsert: jest.fn() },
      interviewSession: { update: jest.fn() },
      sessionReport: { upsert: jest.fn() },
      $transaction: jest
        .fn()
        .mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    mockSse = createMockSseService();
    mockOpenAI = createMockOpenAIGateway();
    mockSse.emit.mockResolvedValue(undefined);
    mockOpenAI.chatCompletion.mockResolvedValue(
      JSON.stringify({ items: ['Practice concise STAR examples'] }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateComprehensiveReport,
        { provide: PrismaService, useValue: prisma },
        { provide: SseService, useValue: mockSse },
        { provide: OpenAIGateway, useValue: mockOpenAI },
      ],
    }).compile();

    processor = module.get(GenerateComprehensiveReport);
  });

  it('ném lỗi để BullMQ retry khi feedback chưa đủ', async () => {
    prisma.aiFeedback.findMany.mockResolvedValue([
      {
        userAnswerId: 'answer-1',
        overallScore: 80,
        keyTakeaway: 'Good',
      },
    ]);

    await expect(processor.process(job)).rejects.toThrow('1/2 feedbacks');

    expect(mockOpenAI.chatCompletion).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('chỉ chuyển session sang completed khi đủ feedback', async () => {
    prisma.aiFeedback.findMany.mockResolvedValue([
      {
        userAnswerId: 'answer-1',
        overallScore: 80,
        keyTakeaway: 'Good',
      },
      {
        userAnswerId: 'answer-2',
        overallScore: 60,
        keyTakeaway: 'Improve structure',
      },
    ]);
    prisma.sessionReport.upsert.mockResolvedValue({});
    prisma.aiFeedback.upsert.mockResolvedValue({});
    prisma.interviewSession.update.mockResolvedValue({});

    await processor.process(job);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const updateArgs = prisma.interviewSession.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: 'session-123' });
    expect(updateArgs.data.status).toBe('completed');
    expect(updateArgs.data.overallScore).toBe(70);
    expect(updateArgs.data.completedAt).toBeInstanceOf(Date);
  });

  it('prompt action plan yêu cầu output tiếng Việt khi language=vi', async () => {
    prisma.aiFeedback.findMany.mockResolvedValue([
      {
        userAnswerId: 'answer-1',
        overallScore: 80,
        keyTakeaway: 'Cần thêm ví dụ cụ thể',
      },
      {
        userAnswerId: 'answer-2',
        overallScore: 60,
        keyTakeaway: 'Cần trình bày mạch lạc hơn',
      },
    ]);
    prisma.sessionReport.upsert.mockResolvedValue({});
    prisma.aiFeedback.upsert.mockResolvedValue({});
    prisma.interviewSession.update.mockResolvedValue({});
    mockOpenAI.chatCompletion.mockResolvedValue(
      JSON.stringify({ items: ['Luyện câu trả lời theo cấu trúc STAR.'] }),
    );

    await processor.process(job);

    expect(mockOpenAI.chatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        task: 'report',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Output language: Vietnamese.'),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Feedback summaries JSON:'),
          }),
        ]),
      }),
    );
    expect(
      mockOpenAI.chatCompletion.mock.calls[0][0].messages[1].content,
    ).toContain('"answerId":"answer-1"');
  });

  it('không gọi OpenAI và không ghi điểm 0 giả khi toàn bộ feedback là fallback', async () => {
    prisma.aiFeedback.findMany.mockResolvedValue([
      {
        userAnswerId: 'answer-1',
        overallScore: 80,
        keyTakeaway: 'Good',
        isFallback: true,
      },
      {
        userAnswerId: 'answer-2',
        overallScore: 60,
        keyTakeaway: 'Improve structure',
        isFallback: true,
      },
    ]);
    prisma.sessionReport.upsert.mockResolvedValue({});
    prisma.aiFeedback.upsert.mockResolvedValue({});
    prisma.interviewSession.update.mockResolvedValue({});
    const warnSpy = jest.spyOn((processor as any).logger, 'warn');
    const errorSpy = jest.spyOn((processor as any).logger, 'error');

    await expect(processor.process(job)).resolves.toBeUndefined();

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const updateArgs = prisma.interviewSession.update.mock.calls[0][0];
    expect(updateArgs.data.status).toBe('completed');
    expect(updateArgs.data.overallScore).toBeNull();
    // action_plan upsert called with localized fallback action plan (3 items)
    const actionPlanCall = prisma.sessionReport.upsert.mock.calls.find(
      (call) => (call[0] as any).create.reportType === 'action_plan',
    );
    expect((actionPlanCall?.[0] as any).create.contentJson.items).toHaveLength(
      3,
    );
    expect((actionPlanCall?.[0] as any).create.contentJson.items[0]).toContain(
      'Viết lại',
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('skipping the action-plan API call'),
    );
    expect(errorSpy).not.toHaveBeenCalled();
    expect(mockOpenAI.chatCompletion).not.toHaveBeenCalled();
  });

  it('fallback action plan trả tiếng Anh khi language=en', async () => {
    prisma.aiFeedback.findMany.mockResolvedValue([
      {
        userAnswerId: 'answer-1',
        overallScore: 80,
        keyTakeaway: 'Good',
        isFallback: true,
      },
      {
        userAnswerId: 'answer-2',
        overallScore: 60,
        keyTakeaway: 'Improve structure',
        isFallback: true,
      },
    ]);
    prisma.sessionReport.upsert.mockResolvedValue({});
    prisma.aiFeedback.upsert.mockResolvedValue({});
    prisma.interviewSession.update.mockResolvedValue({});

    await processor.process({
      data: { ...jobData, language: 'en' },
    } as Job<any>);

    const actionPlanCall = prisma.sessionReport.upsert.mock.calls.find(
      (call) => (call[0] as any).create.reportType === 'action_plan',
    );
    expect((actionPlanCall?.[0] as any).create.contentJson.items[0]).toBe(
      'Rewrite each answer using the STAR structure.',
    );
  });

  it('mixed answered/skipped: chỉ chờ feedback câu đã trả lời và lưu suggested answer cho câu skipped', async () => {
    prisma.userAnswer.findMany.mockResolvedValue([
      {
        id: 'answer-1',
        skipped: false,
        question: {
          questionText: 'Tell me about yourself.',
          orderIndex: 1,
          criteria: [],
        },
      },
      {
        id: 'answer-2',
        skipped: true,
        question: {
          questionText: 'Why should we hire you?',
          orderIndex: 2,
          criteria: [
            criterion('D1', 'Communication', 0.6, 1),
            criterion('D2', 'Problem solving', 0.4, 2),
          ],
        },
      },
    ]);
    prisma.aiFeedback.findMany.mockResolvedValue([
      {
        userAnswerId: 'answer-1',
        overallScore: 80,
        keyTakeaway: 'Good structure',
        isFallback: false,
      },
    ]);
    prisma.sessionReport.upsert.mockResolvedValue({});
    prisma.aiFeedback.upsert.mockResolvedValue({});
    prisma.interviewSession.update.mockResolvedValue({});
    mockOpenAI.chatCompletion
      .mockResolvedValueOnce(
        JSON.stringify({
          answers: [
            {
              answer_id: 'answer-2',
              model_answer: 'Bạn nên nêu các điểm mạnh phù hợp vị trí.',
            },
            {
              id: 'unknown-answer',
              answer: 'Không được nhận vì sai answerId.',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({ items: ['Luyện thêm ví dụ STAR.'] }),
      );

    await processor.process(job);

    expect(prisma.aiFeedback.findMany).toHaveBeenCalledWith({
      where: { userAnswerId: { in: ['answer-1'] } },
    });
    const updateArgs = prisma.interviewSession.update.mock.calls[0][0];
    expect(updateArgs.data.overallScore).toBe(40);
    expect(prisma.aiFeedback.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userAnswerId: 'answer-2' },
        create: expect.objectContaining({
          userAnswerId: 'answer-2',
          overallScore: 0,
          isFallback: false,
          dimensionScores: [
            { id: 'D1', name: 'Communication', score: 0, weight: 0.6 },
            { id: 'D2', name: 'Problem solving', score: 0, weight: 0.4 },
          ],
        }),
      }),
    );
    const skippedAnswersCall = prisma.sessionReport.upsert.mock.calls.find(
      (call) => (call[0] as any).create.reportType === 'skipped_answers',
    );
    expect((skippedAnswersCall?.[0] as any).create.contentJson.answers).toEqual(
      [
        {
          answerId: 'answer-2',
          modelAnswer: 'Bạn nên nêu các điểm mạnh phù hợp vị trí.',
        },
      ],
    );
    expect(mockOpenAI.chatCompletion.mock.calls[0][0].task).toBe('report');
    expect(mockOpenAI.chatCompletion.mock.calls[1][0].task).toBe('report');
  });

  it('normalize action plan từ alias và bổ sung fallback khi item malformed/thiếu', async () => {
    prisma.aiFeedback.findMany.mockResolvedValue([
      {
        userAnswerId: 'answer-1',
        overallScore: 80,
        keyTakeaway: 'Good',
        isFallback: false,
      },
      {
        userAnswerId: 'answer-2',
        overallScore: 60,
        keyTakeaway: 'Improve structure',
        isFallback: false,
      },
    ]);
    prisma.sessionReport.upsert.mockResolvedValue({});
    prisma.aiFeedback.upsert.mockResolvedValue({});
    prisma.interviewSession.update.mockResolvedValue({});
    mockOpenAI.chatCompletion.mockResolvedValue(
      JSON.stringify({
        actionPlan: ['Luyện ví dụ STAR rõ hơn.', 123, ''],
      }),
    );

    await processor.process(job);

    const actionPlanCall = prisma.sessionReport.upsert.mock.calls.find(
      (call) => (call[0] as any).create.reportType === 'action_plan',
    );
    expect((actionPlanCall?.[0] as any).create.contentJson.items).toEqual([
      'Luyện ví dụ STAR rõ hơn.',
      'Viết lại từng câu trả lời theo cấu trúc STAR.',
      'Bổ sung một ví dụ cụ thể và một kết quả đo lường được cho mỗi câu trả lời.',
      'Luyện nói lại các câu trả lời yếu nhất trước buổi phỏng vấn tiếp theo.',
    ]);
  });

  it('skipped-only: không yêu cầu feedback AI, score=0 và vẫn lưu suggested answers', async () => {
    prisma.userAnswer.findMany.mockResolvedValue([
      {
        id: 'answer-1',
        skipped: true,
        question: {
          questionText: 'Tell me about yourself.',
          orderIndex: 1,
          criteria: [criterion('D1', 'Communication', 1, 1)],
        },
      },
      {
        id: 'answer-2',
        skipped: true,
        question: {
          questionText: 'Why should we hire you?',
          orderIndex: 2,
          criteria: [criterion('D2', 'Problem solving', 1, 1)],
        },
      },
    ]);
    prisma.aiFeedback.findMany.mockResolvedValue([]);
    prisma.sessionReport.upsert.mockResolvedValue({});
    prisma.aiFeedback.upsert.mockResolvedValue({});
    prisma.interviewSession.update.mockResolvedValue({});
    mockOpenAI.chatCompletion.mockResolvedValueOnce(
      JSON.stringify({
        answers: [
          { answerId: 'answer-1', modelAnswer: 'Suggested answer 1' },
          { answerId: 'answer-2', modelAnswer: 'Suggested answer 2' },
        ],
      }),
    );

    await processor.process(job);

    expect(prisma.aiFeedback.findMany).toHaveBeenCalledWith({
      where: { userAnswerId: { in: [] } },
    });
    const updateArgs = prisma.interviewSession.update.mock.calls[0][0];
    expect(updateArgs.data.overallScore).toBe(0);
    expect(prisma.aiFeedback.upsert).toHaveBeenCalledTimes(2);
    const executiveSummaryCall = prisma.sessionReport.upsert.mock.calls.find(
      (call) => (call[0] as any).create.reportType === 'executive_summary',
    );
    expect((executiveSummaryCall?.[0] as any).create.contentJson).toEqual(
      expect.objectContaining({
        overallScore: 0,
        evaluatedTurns: 2,
        skippedTurns: 2,
      }),
    );
    const skippedAnswersCall = prisma.sessionReport.upsert.mock.calls.find(
      (call) => (call[0] as any).create.reportType === 'skipped_answers',
    );
    expect(
      (skippedAnswersCall?.[0] as any).create.contentJson.answers,
    ).toHaveLength(2);
  });
});
