import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { VoiceAnswerIntakeHandler } from './voice-answer-intake.handler';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';
import { VoiceMetricsService } from '../interview/voice-metrics.service';
import {
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
  TRANSCRIPTION_QUEUE,
  TRANSCRIPTION_JOB_ATTEMPTS,
} from '../common/constants/queue.constants';
import {
  createMockPrismaService,
  createMockQuestionCriteriaService,
  createMockQueue,
  createMockVoiceMetricsService,
} from '../test-utils/mock-factories';
import { AnswerIntakeContext } from './answer-intake-handler.interface';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

describe('VoiceAnswerIntakeHandler', () => {
  let handler: VoiceAnswerIntakeHandler;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockQuestionCriteria: ReturnType<typeof createMockQuestionCriteriaService>;
  let mockVoiceMetrics: ReturnType<typeof createMockVoiceMetricsService>;
  let mockFeedbackQueue: ReturnType<typeof createMockQueue>;
  let mockTranscriptionQueue: ReturnType<typeof createMockQueue>;

  const mockContext: AnswerIntakeContext = {
    sessionId: 'session-123',
    userId: 'user-456',
    session: {
      contextPackId: 'VN',
      language: 'vi',
    },
    question: {
      id: 'q-202',
      sessionId: 'session-123',
      orderIndex: 2,
      questionText: 'Mô tả kiến trúc dự án gần nhất của bạn?',
      questionCategory: 'technical',
      estimatedTimeMin: 5,
      createdAt: new Date(),
      questionBankId: null,
      criteria: [],
    } as any,
    sessionType: 'technical',
  };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockQuestionCriteria = createMockQuestionCriteriaService();
    mockVoiceMetrics = createMockVoiceMetricsService();
    mockFeedbackQueue = createMockQueue();
    mockTranscriptionQueue = createMockQueue();

    mockQuestionCriteria.codesFromSessionQuestion.mockReturnValue(['T1', 'T2']);
    mockVoiceMetrics.calculate.mockReturnValue({
      wpm: 135,
      fillerWordCount: 2,
      fillerWords: ['à', 'ừm'],
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceAnswerIntakeHandler,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: QuestionCriteriaService,
          useValue: mockQuestionCriteria,
        },
        {
          provide: VoiceMetricsService,
          useValue: mockVoiceMetrics,
        },
        {
          provide: getQueueToken(FEEDBACK_QUEUE),
          useValue: mockFeedbackQueue,
        },
        {
          provide: getQueueToken(TRANSCRIPTION_QUEUE),
          useValue: mockTranscriptionQueue,
        },
      ],
    }).compile();

    handler = module.get<VoiceAnswerIntakeHandler>(VoiceAnswerIntakeHandler);
  });

  it('should have supportedMode as "voice"', () => {
    expect(handler.supportedMode).toBe('voice');
  });

  describe('Audio only (no transcript)', () => {
    it('should create new voice answer and enqueue transcription job when audioFileUrl is present', async () => {
      mockPrisma.userAnswer.findUnique.mockResolvedValue(null);
      mockPrisma.userAnswer.upsert.mockResolvedValue({
        id: 'ans-voice-1',
        questionId: 'q-202',
        answerMode: 'voice',
        answerText: '',
        skipped: false,
        audioFileUrl: 'https://storage.example.com/audio/1.mp3',
        audioDurationSeconds: 45,
        audioSizeBytes: 102400,
        transcriptionStatus: 'pending',
      } as any);

      const dto: SubmitAnswerDto = {
        questionId: 'q-202',
        answerMode: 'voice',
        audioFileUrl: 'https://storage.example.com/audio/1.mp3',
        audioDurationSeconds: 45,
        audioSizeBytes: 102400,
      };

      const result = await handler.handle(dto, mockContext);

      expect(mockPrisma.userAnswer.upsert).toHaveBeenCalledWith({
        where: { questionId: 'q-202' },
        create: {
          questionId: 'q-202',
          answerMode: 'voice',
          answerText: '',
          skipped: false,
          audioFileUrl: 'https://storage.example.com/audio/1.mp3',
          audioDurationSeconds: 45,
          audioSizeBytes: 102400,
          transcriptionStatus: 'pending',
        },
        update: {},
      });

      expect(mockTranscriptionQueue.add).toHaveBeenCalledWith(
        'transcription',
        {
          sessionId: 'session-123',
          answerId: 'ans-voice-1',
          audioFileUrl: 'https://storage.example.com/audio/1.mp3',
          audioDurationSeconds: 45,
          audioSizeBytes: 102400,
          contextPack: 'VN',
          sessionType: 'technical',
          language: 'vi',
        },
        {
          jobId: 'transcription-ans-voice-1',
          attempts: TRANSCRIPTION_JOB_ATTEMPTS,
          backoff: { type: 'fixed', delay: 3000 },
        },
      );

      expect(result).toEqual({
        answerId: 'ans-voice-1',
        feedbackQueued: false,
        transcriptionPending: true,
      });
    });

    it('should return feedbackQueued: true if existing answer has transcriptionStatus "done"', async () => {
      mockPrisma.userAnswer.findUnique.mockResolvedValue({
        id: 'ans-voice-done',
        questionId: 'q-202',
        transcriptionStatus: 'done',
      } as any);

      const dto: SubmitAnswerDto = {
        questionId: 'q-202',
        answerMode: 'voice',
        audioFileUrl: 'https://storage.example.com/audio/1.mp3',
      };

      const result = await handler.handle(dto, mockContext);

      expect(result).toEqual({
        answerId: 'ans-voice-done',
        feedbackQueued: true,
        transcriptionPending: false,
      });
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();
    });

    it('should return feedbackQueued: false if existing answer has transcriptionStatus "failed"', async () => {
      mockPrisma.userAnswer.findUnique.mockResolvedValue({
        id: 'ans-voice-failed',
        questionId: 'q-202',
        transcriptionStatus: 'failed',
      } as any);

      const dto: SubmitAnswerDto = {
        questionId: 'q-202',
        answerMode: 'voice',
        audioFileUrl: 'https://storage.example.com/audio/1.mp3',
      };

      const result = await handler.handle(dto, mockContext);

      expect(result).toEqual({
        answerId: 'ans-voice-failed',
        feedbackQueued: false,
        transcriptionPending: false,
      });
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();
    });

    it('should re-enqueue transcription if existing answer is still pending', async () => {
      mockPrisma.userAnswer.findUnique.mockResolvedValue({
        id: 'ans-voice-pending',
        questionId: 'q-202',
        transcriptionStatus: 'pending',
      } as any);

      const dto: SubmitAnswerDto = {
        questionId: 'q-202',
        answerMode: 'voice',
        audioFileUrl: 'https://storage.example.com/audio/1.mp3',
        audioDurationSeconds: 30,
        audioSizeBytes: 50000,
      };

      const result = await handler.handle(dto, mockContext);

      expect(mockTranscriptionQueue.add).toHaveBeenCalledWith(
        'transcription',
        expect.objectContaining({
          answerId: 'ans-voice-pending',
        }),
        expect.objectContaining({
          jobId: 'transcription-ans-voice-pending',
        }),
      );

      expect(result).toEqual({
        answerId: 'ans-voice-pending',
        feedbackQueued: false,
        transcriptionPending: true,
      });
    });
  });

  describe('Voice with transcript', () => {
    it('should calculate voice metrics and enqueue feedback job', async () => {
      mockPrisma.userAnswer.findUnique.mockResolvedValue(null);
      mockPrisma.userAnswer.upsert.mockResolvedValue({
        id: 'ans-voice-with-txt',
        questionId: 'q-202',
        answerMode: 'voice',
        answerText: 'Tôi thiết kế hệ thống theo Event Driven Architecture.',
        skipped: false,
        transcriptionStatus: 'done',
      } as any);

      const dto: SubmitAnswerDto = {
        questionId: 'q-202',
        answerMode: 'voice',
        answerText: '  Tôi thiết kế hệ thống theo Event Driven Architecture.  ',
        audioFileUrl: 'https://storage.example.com/audio/2.mp3',
        audioDurationSeconds: 20,
      };

      const result = await handler.handle(dto, mockContext);

      expect(mockVoiceMetrics.calculate).toHaveBeenCalledWith(
        'Tôi thiết kế hệ thống theo Event Driven Architecture.',
        20,
      );

      expect(mockPrisma.userAnswer.upsert).toHaveBeenCalledWith({
        where: { questionId: 'q-202' },
        create: {
          questionId: 'q-202',
          answerMode: 'voice',
          answerText: 'Tôi thiết kế hệ thống theo Event Driven Architecture.',
          skipped: false,
          audioFileUrl: 'https://storage.example.com/audio/2.mp3',
          audioDurationSeconds: 20,
          audioSizeBytes: undefined,
          transcriptionStatus: 'done',
          voiceMetricsJson: {
            wpm: 135,
            fillerWordCount: 2,
            fillerWords: ['à', 'ừm'],
          },
        },
        update: {},
      });

      expect(mockFeedbackQueue.add).toHaveBeenCalledWith(
        'feedback',
        {
          sessionId: 'session-123',
          turnId: 'ans-voice-with-txt',
          answerId: 'ans-voice-with-txt',
          questionId: 'q-202',
          questionText: 'Mô tả kiến trúc dự án gần nhất của bạn?',
          questionCategory: 'technical',
          competencyDomains: ['T1', 'T2'],
          answerText: 'Tôi thiết kế hệ thống theo Event Driven Architecture.',
          contextPack: 'VN',
          sessionType: 'technical',
          language: 'vi',
        },
        {
          jobId: 'feedback-ans-voice-with-txt',
          attempts: FEEDBACK_JOB_ATTEMPTS,
          backoff: { type: 'fixed', delay: 2000 },
        },
      );

      expect(result).toEqual({
        answerId: 'ans-voice-with-txt',
        feedbackQueued: true,
        transcriptionPending: false,
      });
    });

    it('should return skipped status if existing answer was skipped', async () => {
      mockPrisma.userAnswer.findUnique.mockResolvedValue({
        id: 'ans-skipped-voice',
        questionId: 'q-202',
        skipped: true,
      } as any);

      const dto: SubmitAnswerDto = {
        questionId: 'q-202',
        answerMode: 'voice',
        answerText: 'Một câu trả lời gửi muộn sau khi đã skip',
      };

      const result = await handler.handle(dto, mockContext);

      expect(result).toEqual({
        answerId: 'ans-skipped-voice',
        feedbackQueued: false,
        transcriptionPending: false,
      });
      expect(mockFeedbackQueue.add).not.toHaveBeenCalled();
    });
  });
});
