import { Test, TestingModule } from '@nestjs/testing';
import type { Job } from 'bullmq';
import { ComprehensiveReportProcessor } from './comprehensive-report.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { OpenAIGateway } from '../openai.gateway';
import {
  createMockOpenAIGateway,
  createMockSseService,
} from '../../test-utils/mock-factories';

interface FeedbackRow {
  userAnswerId: string;
  overallScore: number;
  keyTakeaway: string;
  isFallback?: boolean;
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
  aiFeedback: {
    findMany: jest.MockedFunction<() => Promise<FeedbackRow[]>>;
  };
  interviewSession: {
    update: jest.MockedFunction<
      (args: SessionUpdateArgs) => Promise<Record<string, never>>
    >;
  };
  sessionReport: {
    upsert: jest.MockedFunction<(args: unknown) => Promise<Record<string, never>>>;
  };
  $transaction: jest.MockedFunction<(ops: Promise<unknown>[]) => Promise<unknown[]>>;
}

describe('ComprehensiveReportProcessor', () => {
  let processor: ComprehensiveReportProcessor;
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

  beforeEach(async () => {
    prisma = {
      aiFeedback: { findMany: jest.fn() },
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
        ComprehensiveReportProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: SseService, useValue: mockSse },
        { provide: OpenAIGateway, useValue: mockOpenAI },
      ],
    }).compile();

    processor = module.get(ComprehensiveReportProcessor);
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
    prisma.interviewSession.update.mockResolvedValue({});
    mockOpenAI.chatCompletion.mockResolvedValue(
      JSON.stringify({ items: ['Luyện câu trả lời theo cấu trúc STAR.'] }),
    );

    await processor.process(job);

    expect(mockOpenAI.chatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Output language: Vietnamese.'),
          }),
        ]),
      }),
    );
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
    expect((actionPlanCall?.[0] as any).create.contentJson.items).toHaveLength(3);
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
});
