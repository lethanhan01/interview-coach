import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { TranscriptionProcessor } from './transcription.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { WhisperService } from '../../turn/whisper.service';
import { VoiceMetricsService } from '../../turn/voice-metrics.service';
import {
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
} from '../../common/constants/queue.constants';
import {
  createMockPrismaService,
  createMockSseService,
  createMockWhisperService,
  createMockVoiceMetricsService,
  createMockReportService,
  createMockQueue,
} from '../../test-utils/mock-factories';
import { ReportService } from '../../report/report.service';
import { FALLBACK_FEEDBACK_MESSAGE } from '../fallback-content';

const BASE_JOB_DATA = {
  sessionId: 'session-123',
  answerId: 'answer-1',
  audioFileUrl: 'https://example.com/audio.mp3',
  audioDurationSeconds: 60,
  audioSizeBytes: 1024,
  contextPack: 'VN' as const,
  sessionType: 'hr' as const,
  language: 'vi' as const,
};

describe('TranscriptionProcessor', () => {
  let processor: TranscriptionProcessor;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockSse: ReturnType<typeof createMockSseService>;
  let mockWhisper: ReturnType<typeof createMockWhisperService>;
  let mockVoiceMetrics: ReturnType<typeof createMockVoiceMetricsService>;
  let mockReportService: ReturnType<typeof createMockReportService>;
  let mockFeedbackQueue: ReturnType<typeof createMockQueue>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockSse = createMockSseService();
    mockWhisper = createMockWhisperService();
    mockVoiceMetrics = createMockVoiceMetricsService();
    mockReportService = createMockReportService();
    mockFeedbackQueue = createMockQueue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SseService, useValue: mockSse },
        { provide: WhisperService, useValue: mockWhisper },
        { provide: VoiceMetricsService, useValue: mockVoiceMetrics },
        { provide: ReportService, useValue: mockReportService },
        { provide: getQueueToken(FEEDBACK_QUEUE), useValue: mockFeedbackQueue },
      ],
    }).compile();

    processor = module.get<TranscriptionProcessor>(TranscriptionProcessor);
  });

  afterEach(() => jest.clearAllMocks());

  it('transcribe audio, cập nhật answer, enqueue feedback, emit SSE', async () => {
    mockWhisper.transcribe.mockResolvedValue({
      text: 'Transcribed text',
      durationSeconds: 60,
    });
    mockVoiceMetrics.calculate.mockReturnValue({
      wpm: 120,
      fillerWordCount: 2,
    });
    mockPrisma.userAnswer.update.mockResolvedValue({
      id: 'answer-1',
      sessionId: 'session-123',
      questionId: 'q-1',
      answerText: 'Transcribed text',
    });
    mockPrisma.sessionQuestion.findFirst.mockResolvedValue({
      id: 'q-1',
      questionText: 'Tell me about yourself?',
      orderIndex: 1,
      sessionId: 'session-123',
    });
    mockSse.emit.mockResolvedValue(undefined);
    mockFeedbackQueue.add.mockResolvedValue({} as any);

    const job = {
      data: BASE_JOB_DATA,
      attemptsMade: 0,
      opts: { attempts: 2 },
    } as unknown as Job<typeof BASE_JOB_DATA>;
    await processor.process(job);

    expect(mockWhisper.transcribe).toHaveBeenCalledWith(
      'https://example.com/audio.mp3',
    );
    expect(mockPrisma.userAnswer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'answer-1' },
        data: expect.objectContaining({
          answerText: 'Transcribed text',
          transcriptionStatus: 'done',
        }),
      }),
    );
    expect(mockFeedbackQueue.add).toHaveBeenCalledWith(
      'feedback',
      expect.objectContaining({ answerId: 'answer-1', language: 'vi' }),
      expect.objectContaining({
        jobId: 'feedback-answer-1',
        attempts: FEEDBACK_JOB_ATTEMPTS,
      }),
    );
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'turn.transcription_ready',
      expect.objectContaining({ answerId: 'answer-1' }),
    );
  });

  it('vẫn enqueue feedback và emit SSE khi question không tìm thấy', async () => {
    mockWhisper.transcribe.mockResolvedValue({
      text: 'Some answer text here.',
      durationSeconds: 30,
    });
    mockVoiceMetrics.calculate.mockReturnValue({
      wpm: 100,
      fillerWordCount: 0,
    });
    mockPrisma.userAnswer.update.mockResolvedValue({
      id: 'answer-1',
      sessionId: 'session-123',
      questionId: 'q-missing',
      answerText: 'Some answer text here.',
    });
    mockPrisma.sessionQuestion.findFirst.mockResolvedValue(null);
    mockSse.emit.mockResolvedValue(undefined);
    mockFeedbackQueue.add.mockResolvedValue({} as any);

    const job = {
      data: BASE_JOB_DATA,
      attemptsMade: 0,
      opts: { attempts: 2 },
    } as unknown as Job<typeof BASE_JOB_DATA>;
    await processor.process(job);

    expect(mockFeedbackQueue.add).toHaveBeenCalled();
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'turn.transcription_ready',
      expect.objectContaining({ answerId: 'answer-1' }),
    );
  });

  describe('error handling', () => {
    it('re-throw error khi chưa phải last attempt', async () => {
      const err = new Error('Whisper timeout');
      mockWhisper.transcribe.mockRejectedValue(err);

      const job = {
        data: BASE_JOB_DATA,
        attemptsMade: 0,
        opts: { attempts: 2 },
      } as unknown as Job<typeof BASE_JOB_DATA>;

      await expect(processor.process(job)).rejects.toThrow('Whisper timeout');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('last attempt: insert fallback aiFeedback, set transcriptionStatus=failed, call enqueueIfAllFeedbacksReady, emit SSE', async () => {
      const err = new Error('Whisper quota exceeded');
      mockWhisper.transcribe.mockRejectedValue(err);

      const txMock = {
        aiFeedback: { upsert: jest.fn().mockResolvedValue(undefined) },
        userAnswer: { update: jest.fn().mockResolvedValue(undefined) },
      };
      mockPrisma.$transaction.mockImplementation(
        (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock),
      );
      mockReportService.enqueueIfAllFeedbacksReady.mockResolvedValue(undefined);
      mockSse.emit.mockResolvedValue(undefined);

      const job = {
        data: BASE_JOB_DATA,
        attemptsMade: 1,
        opts: { attempts: 2 },
      } as unknown as Job<typeof BASE_JOB_DATA>;

      await processor.process(job);

      expect(txMock.aiFeedback.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userAnswerId: 'answer-1' },
          create: expect.objectContaining({
            userAnswerId: 'answer-1',
            isFallback: true,
            keyTakeaway: FALLBACK_FEEDBACK_MESSAGE,
            promptVersion: 'transcription-failed',
          }),
        }),
      );
      expect(txMock.userAnswer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'answer-1' },
          data: expect.objectContaining({
            transcriptionStatus: 'failed',
            feedbackGenerated: true,
          }),
        }),
      );
      expect(mockReportService.enqueueIfAllFeedbacksReady).toHaveBeenCalledWith(
        'session-123',
        'hr',
        'VN',
        'vi',
      );
      expect(mockSse.emit).toHaveBeenCalledWith(
        'sse:session:session-123',
        'turn.transcription_ready',
        expect.objectContaining({ answerId: 'answer-1' }),
      );
    });
  });
});
