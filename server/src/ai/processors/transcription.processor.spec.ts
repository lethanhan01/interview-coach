import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { TranscriptionProcessor } from './transcription.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { WhisperService } from '../../turn/whisper.service';
import { VoiceMetricsService } from '../../turn/voice-metrics.service';
import { FollowUpCoordinatorService } from '../../turn/follow-up-coordinator.service';
import {
  FEEDBACK_QUEUE,
  FOLLOW_UP_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
  FOLLOW_UP_JOB_ATTEMPTS,
} from '../../common/constants/queue.constants';
import {
  createMockPrismaService,
  createMockSseService,
  createMockWhisperService,
  createMockVoiceMetricsService,
  createMockFollowUpCoordinatorService,
  createMockQueue,
} from '../../test-utils/mock-factories';

const BASE_JOB_DATA = {
  sessionId: 'session-123',
  answerId: 'answer-1',
  audioFileUrl: 'https://example.com/audio.mp3',
  audioDurationSeconds: 60,
  audioSizeBytes: 1024,
  contextPack: 'VN' as const,
  sessionType: 'hr' as const,
};

describe('TranscriptionProcessor', () => {
  let processor: TranscriptionProcessor;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockSse: ReturnType<typeof createMockSseService>;
  let mockWhisper: ReturnType<typeof createMockWhisperService>;
  let mockVoiceMetrics: ReturnType<typeof createMockVoiceMetricsService>;
  let mockFollowUpCoordinator: ReturnType<typeof createMockFollowUpCoordinatorService>;
  let mockFeedbackQueue: ReturnType<typeof createMockQueue>;
  let mockFollowUpQueue: ReturnType<typeof createMockQueue>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockSse = createMockSseService();
    mockWhisper = createMockWhisperService();
    mockVoiceMetrics = createMockVoiceMetricsService();
    mockFollowUpCoordinator = createMockFollowUpCoordinatorService();
    mockFeedbackQueue = createMockQueue();
    mockFollowUpQueue = createMockQueue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SseService, useValue: mockSse },
        { provide: WhisperService, useValue: mockWhisper },
        { provide: VoiceMetricsService, useValue: mockVoiceMetrics },
        { provide: FollowUpCoordinatorService, useValue: mockFollowUpCoordinator },
        { provide: getQueueToken(FEEDBACK_QUEUE), useValue: mockFeedbackQueue },
        { provide: getQueueToken(FOLLOW_UP_QUEUE), useValue: mockFollowUpQueue },
      ],
    }).compile();

    processor = module.get<TranscriptionProcessor>(TranscriptionProcessor);
  });

  afterEach(() => jest.clearAllMocks());

  it('transcribe audio, cập nhật answer, enqueue feedback, emit SSE', async () => {
    mockWhisper.transcribe.mockResolvedValue({ text: 'Transcribed text', durationSeconds: 60 });
    mockVoiceMetrics.calculate.mockReturnValue({ wpm: 120, fillerWordCount: 2 });
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
    mockPrisma.interviewSession.findUnique.mockResolvedValue({
      id: 'session-123',
      numQuestions: 5,
    });
    mockFollowUpCoordinator.shouldGenerateFollowUp.mockReturnValue(false);
    mockSse.emit.mockResolvedValue(undefined);
    mockFeedbackQueue.add.mockResolvedValue({} as any);

    const job = { data: BASE_JOB_DATA, attemptsMade: 0, opts: { attempts: 2 } } as unknown as Job<typeof BASE_JOB_DATA>;
    await processor.process(job);

    expect(mockWhisper.transcribe).toHaveBeenCalledWith('https://example.com/audio.mp3');
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
      expect.objectContaining({ answerId: 'answer-1' }),
      expect.objectContaining({ jobId: 'feedback-answer-1', attempts: FEEDBACK_JOB_ATTEMPTS }),
    );
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'turn.transcription_ready',
      expect.objectContaining({ answerId: 'answer-1' }),
    );
  });

  it('enqueue follow-up khi shouldGenerateFollowUp=true', async () => {
    mockWhisper.transcribe.mockResolvedValue({ text: 'A detailed answer about my background.', durationSeconds: 60 });
    mockVoiceMetrics.calculate.mockReturnValue({ wpm: 130, fillerWordCount: 1 });
    mockPrisma.userAnswer.update.mockResolvedValue({
      id: 'answer-1',
      sessionId: 'session-123',
      questionId: 'q-1',
      answerText: 'A detailed answer about my background.',
    });
    mockPrisma.sessionQuestion.findFirst.mockResolvedValue({
      id: 'q-1',
      questionText: 'Tell me about yourself?',
      orderIndex: 1,
      sessionId: 'session-123',
    });
    mockPrisma.interviewSession.findUnique.mockResolvedValue({
      id: 'session-123',
      numQuestions: 5,
    });
    mockFollowUpCoordinator.shouldGenerateFollowUp.mockReturnValue(true);
    mockSse.emit.mockResolvedValue(undefined);
    mockFeedbackQueue.add.mockResolvedValue({} as any);
    mockFollowUpQueue.add.mockResolvedValue({} as any);

    const job = { data: BASE_JOB_DATA, attemptsMade: 0, opts: { attempts: 2 } } as unknown as Job<typeof BASE_JOB_DATA>;
    await processor.process(job);

    expect(mockFollowUpQueue.add).toHaveBeenCalledWith(
      'follow-up',
      expect.objectContaining({ answerId: 'answer-1' }),
      expect.objectContaining({ jobId: 'follow-up-answer-1', attempts: FOLLOW_UP_JOB_ATTEMPTS }),
    );
    expect(mockFeedbackQueue.add).toHaveBeenCalled();
  });

  it('vẫn enqueue feedback và emit SSE khi question không tìm thấy', async () => {
    mockWhisper.transcribe.mockResolvedValue({ text: 'Some answer text here.', durationSeconds: 30 });
    mockVoiceMetrics.calculate.mockReturnValue({ wpm: 100, fillerWordCount: 0 });
    mockPrisma.userAnswer.update.mockResolvedValue({
      id: 'answer-1',
      sessionId: 'session-123',
      questionId: 'q-missing',
      answerText: 'Some answer text here.',
    });
    mockPrisma.sessionQuestion.findFirst.mockResolvedValue(null);
    mockSse.emit.mockResolvedValue(undefined);
    mockFeedbackQueue.add.mockResolvedValue({} as any);

    const job = { data: BASE_JOB_DATA, attemptsMade: 0, opts: { attempts: 2 } } as unknown as Job<typeof BASE_JOB_DATA>;
    await processor.process(job);

    expect(mockFeedbackQueue.add).toHaveBeenCalled();
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'turn.transcription_ready',
      expect.objectContaining({ answerId: 'answer-1' }),
    );
    expect(mockFollowUpQueue.add).not.toHaveBeenCalled();
  });
});
