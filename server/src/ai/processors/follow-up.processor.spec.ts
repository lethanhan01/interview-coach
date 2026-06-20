import { Test, TestingModule } from '@nestjs/testing';
import { FollowUpProcessor } from './follow-up.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import {
  createMockPrismaService,
  createMockSseService,
  createMockContextPackService,
  createMockPipelineStrategyFactory,
} from '../../test-utils/mock-factories';
import type { Job } from 'bullmq';
import { HttpStatus } from '@nestjs/common';
import { InterviewAIException } from '../../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';

describe('FollowUpProcessor', () => {
  let processor: FollowUpProcessor;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockSse: ReturnType<typeof createMockSseService>;
  let mockContextPack: ReturnType<typeof createMockContextPackService>;
  let mockFactory: ReturnType<typeof createMockPipelineStrategyFactory>;

  const BASE_JOB_DATA = {
    sessionId: 'session-123',
    turnId: 'turn-1',
    answerId: 'answer-1',
    questionText: 'Giới thiệu bản thân?',
    answerText: 'Tôi là developer.',
    contextPack: 'VN' as const,
    sessionType: 'hr' as const,
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
        FollowUpProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SseService, useValue: mockSse },
        { provide: ContextPackService, useValue: mockContextPack },
        { provide: PipelineStrategyFactory, useValue: mockFactory },
      ],
    }).compile();

    processor = module.get<FollowUpProcessor>(FollowUpProcessor);
  });

  afterEach(() => jest.clearAllMocks());

  it('tạo FollowUpQuestion và emit SSE khi generateFollowUp trả về kết quả', async () => {
    const mockStrategy = {
      generateFollowUp: jest.fn().mockResolvedValue({
        followUpText: 'Bạn có thể cho ví dụ cụ thể?',
        triggerReason: 'incomplete_answer',
      }),
    };
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue(mockStrategy);
    mockPrisma.followUpQuestion.create.mockResolvedValue({} as any);
    mockSse.emit.mockResolvedValue(undefined);

    await processor.process(makeJob());

    expect(mockFactory.getStrategy).toHaveBeenCalledWith('hr');
    expect(mockPrisma.followUpQuestion.create).toHaveBeenCalledWith({
      data: {
        userAnswerId: 'answer-1',
        followUpText: 'Bạn có thể cho ví dụ cụ thể?',
        triggerRule: 'ai_suggested',
        triggerReason: 'incomplete_answer',
      },
    });
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'turn.follow_up',
      { turnId: 'turn-1', followUpText: 'Bạn có thể cho ví dụ cụ thể?' },
    );
  });

  it('không tạo FollowUpQuestion khi generateFollowUp trả về null', async () => {
    const mockStrategy = {
      generateFollowUp: jest.fn().mockResolvedValue(null),
    };
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue(mockStrategy);

    await processor.process(makeJob());

    expect(mockPrisma.followUpQuestion.create).not.toHaveBeenCalled();
    expect(mockSse.emit).not.toHaveBeenCalled();
  });

  it('không re-throw khi generateFollowUp ném lỗi ở last attempt (silent skip)', async () => {
    const mockStrategy = {
      generateFollowUp: jest.fn().mockRejectedValue(new Error('AI error')),
    };
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue(mockStrategy);

    const job = {
      data: BASE_JOB_DATA,
      attemptsMade: 1,   // last attempt (attempts=2, index 1)
      opts: { attempts: 2 },
    } as unknown as Job<typeof BASE_JOB_DATA>;

    await expect(processor.process(job)).resolves.toBeUndefined();
    expect(mockPrisma.followUpQuestion.create).not.toHaveBeenCalled();
  });

  it('coi quota hết là degraded mode và bỏ qua follow-up không cần stack ERROR', async () => {
    const mockStrategy = {
      generateFollowUp: jest
        .fn()
        .mockRejectedValue(
          new InterviewAIException(
            ErrorCode.AI_QUOTA_EXCEEDED,
            HttpStatus.SERVICE_UNAVAILABLE,
          ),
        ),
    };
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue(mockStrategy);
    const warnSpy = jest.spyOn((processor as any).logger, 'warn');
    const errorSpy = jest.spyOn((processor as any).logger, 'error');

    await expect(processor.process(makeJob())).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('OpenAI quota exhausted'),
    );
    expect(errorSpy).not.toHaveBeenCalled();
    expect(mockPrisma.followUpQuestion.create).not.toHaveBeenCalled();
  });

  describe('error handling', () => {
    it('re-throw lỗi transient khi chưa phải last attempt để trigger retry', async () => {
      const transientError = new Error('Connection timeout');
      mockContextPack.getContextPack.mockReturnValue({} as any);
      mockFactory.getStrategy.mockReturnValue({
        generateFollowUp: jest.fn().mockRejectedValue(transientError),
      });

      const job = {
        data: BASE_JOB_DATA,
        attemptsMade: 0,        // attempt đầu tiên, còn attempt thứ 2
        opts: { attempts: 2 },
      } as unknown as Job<typeof BASE_JOB_DATA>;

      await expect(processor.process(job)).rejects.toThrow('Connection timeout');
    });

    it('không throw khi đã đạt last attempt (graceful degradation)', async () => {
      const error = new Error('AI service error');
      mockContextPack.getContextPack.mockReturnValue({} as any);
      mockFactory.getStrategy.mockReturnValue({
        generateFollowUp: jest.fn().mockRejectedValue(error),
      });

      const job = {
        data: BASE_JOB_DATA,
        attemptsMade: 1,        // last attempt (attempts=2, index 1)
        opts: { attempts: 2 },
      } as unknown as Job<typeof BASE_JOB_DATA>;

      await expect(processor.process(job)).resolves.toBeUndefined();
      expect(mockPrisma.followUpQuestion.create).not.toHaveBeenCalled();
    });
  });
});
