import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import { FeedbackProcessor } from './feedback.processor';
import { HrPipelineService } from '@infra/ai/pipelines/hr.pipeline.service';
import { TechnicalPipelineService } from '@infra/ai/pipelines/technical.pipeline.service';
import { PipelineStrategyFactory } from '@infra/ai/pipelines/pipeline-strategy.factory';
import { PromptBuilderService } from '@infra/ai/prompt-builder.service';
import { ZodValidatorService } from '@infra/ai/zod-validator.service';
import { OpenAIGateway } from '@infra/ai/openai.gateway';
import { AI_GATEWAY_TOKEN } from '@infra/ai/ai-gateway.interface';
import { ContextPackService } from '../context-pack.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { SseService } from '@infra/realtime/redis/sse.service';
import { ReportService } from '../../report/report.service';
import { EvaluateAnswer } from '../evaluate-answer.service';
import {
  createMockReportService,
  createMockSseService,
} from '@core/test-utils/mock-factories';

const VALID_FEEDBACK_JSON = JSON.stringify({
  applied_dimensions: [
    { id: 'D1', score: 78 },
    { id: 'D2', score: 78 },
  ],
  model_answer:
    'In my project, I identified the performance bottleneck by profiling the database queries and implemented pagination to reduce load time significantly.',
  key_takeaway: 'Good technical depth, but needs more concrete metrics.',
  annotated_segments: [
    {
      segment_text: 'pagination',
      start_index: 10,
      end_index: 20,
      highlight_level: 'strength',
      annotation: 'Correct solution identified.',
    },
  ],
});

describe('FeedbackProcessor Integration (real NestJS wiring, mocked OpenAI)', () => {
  let processor: FeedbackProcessor;
  let mockOpenAI: {
    chatCompletion: jest.Mock;
    transcribe: jest.Mock;
    getChatModel: jest.Mock;
  };
  let tx: {
    aiFeedback: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
    annotatedSegment: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    userAnswer: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let mockPrisma: { $transaction: jest.Mock };
  let mockSse: ReturnType<typeof createMockSseService>;
  let mockReportService: ReturnType<typeof createMockReportService>;

  const makeJob = (sessionType: 'hr' | 'technical' = 'hr') =>
    ({
      data: {
        sessionId: 'int-session-1',
        turnId: 'int-answer-1',
        answerId: 'int-answer-1',
        questionId: 'int-question-1',
        questionText: 'Tell me about a technical challenge you solved.',
        questionCategory:
          sessionType === 'technical' ? 'technical' : 'behavioral',
        competencyDomains: sessionType === 'technical' ? ['TD1'] : ['D2'],
        answerText: 'I solved a performance issue by implementing pagination.',
        contextPack: 'VN' as const,
        sessionType,
      },
      attemptsMade: 0,
      opts: { attempts: 2 },
    }) as unknown as Job<any>;

  beforeEach(async () => {
    mockOpenAI = {
      chatCompletion: jest.fn().mockResolvedValue(VALID_FEEDBACK_JSON),
      transcribe: jest.fn(),
      getChatModel: jest.fn().mockReturnValue('google/gemma-4-e4b'),
    };

    tx = {
      aiFeedback: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'fb-int-1' }),
      },
      annotatedSegment: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      userAnswer: {
        findUnique: jest.fn().mockResolvedValue({ id: 'int-answer-1' }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    mockPrisma = {
      $transaction: jest.fn((callback: any) => callback(tx)),
    };
    mockSse = createMockSseService();
    mockSse.emit.mockResolvedValue(undefined);
    mockReportService = createMockReportService();

    const mockContextPackService = {
      getContextPack: jest.fn().mockReturnValue({
        type: 'VN' as const,
        rubricDimensions: [
          'Giao tiếp & Trình bày',
          'Tư duy & Giải quyết vấn đề',
        ],
        behavioralDimensions: [
          { id: 'D1', name: 'Giao tiếp & Trình bày', weight: 0.2 },
          { id: 'D2', name: 'Tư duy & Giải quyết vấn đề', weight: 0.2 },
        ],
        technicalDimensions: [
          { id: 'TD1', name: 'Kiến thức nền tảng', weight: 0.25 },
        ],
        culturalNotes:
          'Vietnamese workplace context: emphasize teamwork and practical problem-solving.',
        scoringWeights: { behavioral_weight: 0.5, technical_weight: 0.5 },
      }),
    };

    const mockConfig = { get: jest.fn().mockReturnValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackProcessor,
        EvaluateAnswer,
        HrPipelineService,
        TechnicalPipelineService,
        PipelineStrategyFactory,
        PromptBuilderService,
        ZodValidatorService,
        { provide: AI_GATEWAY_TOKEN, useValue: mockOpenAI },
        { provide: OpenAIGateway, useValue: mockOpenAI },
        { provide: ContextPackService, useValue: mockContextPackService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SseService, useValue: mockSse },
        { provide: ReportService, useValue: mockReportService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    processor = module.get(FeedbackProcessor);
  });

  afterEach(() => jest.clearAllMocks());

  it('hr flow: chatCompletion nhận messages có system prompt và question/answer', async () => {
    await processor.process(makeJob('hr'));

    expect(mockOpenAI.chatCompletion).toHaveBeenCalledTimes(1);
    const callArgs = mockOpenAI.chatCompletion.mock.calls[0][0];
    expect(callArgs.temperature).toBe(0.2);
    expect(callArgs.maxTokens).toBe(3000);
    expect(callArgs.task).toBe('feedback');
    expect(callArgs.responseFormat).toBe('json_object');

    const systemMsg = callArgs.messages[0];
    const userMsg = callArgs.messages[1];
    expect(systemMsg.role).toBe('system');
    expect(systemMsg.content).toContain('CRITICAL: model_answer');
    expect(userMsg.role).toBe('user');
    expect(userMsg.content).toContain(
      '<job_description>\n\n</job_description>',
    );
    expect(userMsg.content).toContain(
      'Tell me about a technical challenge you solved.',
    );
    expect(userMsg.content).toContain(
      'I solved a performance issue by implementing pagination.',
    );
  });

  it('hr flow: system prompt chứa cultural notes từ context pack', async () => {
    await processor.process(makeJob('hr'));

    const callArgs = mockOpenAI.chatCompletion.mock.calls[0][0];
    const systemContent = callArgs.messages[0].content as string;
    expect(systemContent).toContain('Vietnamese workplace context');
    expect(systemContent).toContain('Giao tiếp & Trình bày');
  });

  it('hr flow: DB transaction upserts feedback với isFallback false và overallScore đúng', async () => {
    await processor.process(makeJob('hr'));

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.aiFeedback.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userAnswerId: 'int-answer-1' },
        create: expect.objectContaining({
          isFallback: false,
          overallScore: 78,
        }),
      }),
    );
    expect(tx.annotatedSegment.deleteMany).toHaveBeenCalledWith({
      where: { aiFeedbackId: 'fb-int-1' },
    });
    expect(tx.annotatedSegment.createMany).toHaveBeenCalledTimes(1);
  });

  it('feedback flow: optional annotated segment fields null không bị ghi fallback', async () => {
    mockOpenAI.chatCompletion.mockResolvedValue(
      JSON.stringify({
        applied_dimensions: [{ id: 'TD1', score: 80 }],
        model_answer:
          'I found the bottleneck through profiling, then added pagination and measured the latency reduction. I also aligned the change with the team before rolling it out.',
        key_takeaway: 'Good direction, with room for clearer metrics.',
        annotated_segments: [
          {
            segment_text: 'implementing pagination',
            start_index: 36,
            end_index: 59,
            highlight_level: 'strength',
            annotation: 'Specific technical action.',
            suggestion: null,
            improved_version: null,
          },
        ],
      }),
    );

    await processor.process(makeJob('technical'));

    const upsertArgs = tx.aiFeedback.upsert.mock.calls[0][0];
    expect(upsertArgs.create).toEqual(
      expect.objectContaining({ isFallback: false, overallScore: 80 }),
    );
    expect(tx.annotatedSegment.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          suggestion: null,
          improvedVersion: null,
        }),
      ],
    });
  });

  it('hr flow: SSE turn.feedback_ready emitted sau DB write', async () => {
    await processor.process(makeJob('hr'));

    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:int-session-1',
      'turn.feedback_ready',
      expect.objectContaining({ answerId: 'int-answer-1' }),
    );
  });

  it('technical flow: system prompt chứa strategy instructions cho technical', async () => {
    await processor.process(makeJob('technical'));

    const callArgs = mockOpenAI.chatCompletion.mock.calls[0][0];
    const systemContent = callArgs.messages[0].content as string;
    expect(systemContent).toContain('technical depth');
  });

  it('fallback: khi LLM trả về JSON không hợp lệ ở lần cuối thì ghi isFallback=true', async () => {
    mockOpenAI.chatCompletion.mockResolvedValue('not valid json {{{{');

    const lastAttemptJob = {
      ...makeJob('hr'),
      attemptsMade: 1,
    } as unknown as Job<any>;

    await expect(processor.process(lastAttemptJob)).resolves.toBeUndefined();

    const upsertArgs = tx.aiFeedback.upsert.mock.calls[0][0];
    expect(upsertArgs.create.isFallback).toBe(true);
    expect(tx.userAnswer.update).toHaveBeenCalledWith({
      where: { id: 'int-answer-1' },
      data: { feedbackGenerated: true },
    });
  });

  it('fallback: khi LLM trả JSON sai FeedbackSchema ở lần cuối thì ghi isFallback=true', async () => {
    mockOpenAI.chatCompletion.mockResolvedValue(
      JSON.stringify({
        overall_score: 101,
        model_answer: 'Score is out of range.',
        key_takeaway: 'Invalid score should fail schema validation.',
        annotated_segments: [
          {
            segment_text: 'pagination',
            start_index: 0,
            end_index: 10,
            highlight_level: 'neutral',
            annotation: 'Invalid highlight level.',
          },
        ],
      }),
    );

    const lastAttemptJob = {
      ...makeJob('technical'),
      attemptsMade: 1,
    } as unknown as Job<any>;

    await expect(processor.process(lastAttemptJob)).resolves.toBeUndefined();

    const upsertArgs = tx.aiFeedback.upsert.mock.calls[0][0];
    expect(upsertArgs.create.isFallback).toBe(true);
    expect(tx.annotatedSegment.createMany).not.toHaveBeenCalled();
    expect(tx.userAnswer.update).toHaveBeenCalledWith({
      where: { id: 'int-answer-1' },
      data: { feedbackGenerated: true },
    });
  });
});
