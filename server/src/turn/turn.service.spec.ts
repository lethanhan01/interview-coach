import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { TurnService } from './turn.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhisperService } from './whisper.service';
import { VoiceMetricsService } from './voice-metrics.service';
import { FollowUpCoordinatorService } from './follow-up-coordinator.service';
import {
  FOLLOW_UP_QUEUE,
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
} from '../common/constants/queue.constants';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import {
  createMockPrismaService,
  createMockQueue,
  createMockWhisperService,
  createMockVoiceMetricsService,
  createMockFollowUpCoordinatorService,
} from '../test-utils/mock-factories';

describe('TurnService', () => {
  let service: TurnService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockWhisper: ReturnType<typeof createMockWhisperService>;
  let mockVoiceMetrics: ReturnType<typeof createMockVoiceMetricsService>;
  let mockFollowUpCoordinator: ReturnType<
    typeof createMockFollowUpCoordinatorService
  >;
  let mockFollowUpQueue: ReturnType<typeof createMockQueue>;
  let mockFeedbackQueue: ReturnType<typeof createMockQueue>;

  const BASE_SESSION = {
    id: 'session-123',
    userId: 'user-abc',
    status: 'active',
    sessionType: 'hr',
    contextPackId: 'VN',
    numQuestions: 5,
  };

  const BASE_QUESTION = {
    id: 'q-1',
    questionText: 'Giới thiệu bản thân?',
    orderIndex: 1,
    sessionId: 'session-123',
  };

  const BASE_ANSWER = {
    id: 'answer-1',
    sessionId: 'session-123',
    questionId: 'q-1',
    answerText: 'Tôi là developer với 2 năm kinh nghiệm.',
  };

  const TEXT_DTO = {
    questionId: 'q-1',
    answerMode: 'text' as const,
    answerText: 'Tôi là developer với 2 năm kinh nghiệm.',
  };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockWhisper = createMockWhisperService();
    mockVoiceMetrics = createMockVoiceMetricsService();
    mockFollowUpCoordinator = createMockFollowUpCoordinatorService();
    mockFollowUpQueue = createMockQueue();
    mockFeedbackQueue = createMockQueue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WhisperService, useValue: mockWhisper },
        { provide: VoiceMetricsService, useValue: mockVoiceMetrics },
        {
          provide: FollowUpCoordinatorService,
          useValue: mockFollowUpCoordinator,
        },
        {
          provide: getQueueToken(FOLLOW_UP_QUEUE),
          useValue: mockFollowUpQueue,
        },
        { provide: getQueueToken(FEEDBACK_QUEUE), useValue: mockFeedbackQueue },
      ],
    }).compile();

    service = module.get<TurnService>(TurnService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('submitAnswer', () => {
    it('ném SESSION_NOT_FOUND (404) khi session không tồn tại', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAnswer('session-123', 'user-abc', TEXT_DTO),
      ).rejects.toThrow(InterviewAIException);

      mockPrisma.interviewSession.findUnique.mockResolvedValue(null);
      try {
        await service.submitAnswer('session-123', 'user-abc', TEXT_DTO);
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.SESSION_NOT_FOUND,
        );
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.NOT_FOUND,
        );
      }
    });

    it('ném FORBIDDEN (403) khi user không phải owner', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        userId: 'other-user',
      });

      await expect(
        service.submitAnswer('session-123', 'user-abc', TEXT_DTO),
      ).rejects.toThrow(InterviewAIException);

      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        userId: 'other-user',
      });
      try {
        await service.submitAnswer('session-123', 'user-abc', TEXT_DTO);
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(ErrorCode.FORBIDDEN);
      }
    });

    it('ném SESSION_NOT_ACTIVE (403) khi session đã completed', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        status: 'completed',
      });

      await expect(
        service.submitAnswer('session-123', 'user-abc', TEXT_DTO),
      ).rejects.toThrow(InterviewAIException);

      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        status: 'completed',
      });
      try {
        await service.submitAnswer('session-123', 'user-abc', TEXT_DTO);
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.SESSION_NOT_ACTIVE,
        );
      }
    });

    it('ném NOT_FOUND (404) khi question không tồn tại trong session', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(null);

      await expect(
        service.submitAnswer('session-123', 'user-abc', TEXT_DTO),
      ).rejects.toThrow(InterviewAIException);

      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(null);
      try {
        await service.submitAnswer('session-123', 'user-abc', TEXT_DTO);
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(ErrorCode.NOT_FOUND);
      }
    });

    it('chấp nhận session ready cũ, chuyển sang active rồi tạo answer', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        status: 'ready',
      });
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.interviewSession.update.mockResolvedValue({
        ...BASE_SESSION,
        status: 'active',
      });
      mockPrisma.userAnswer.upsert.mockResolvedValue(BASE_ANSWER);
      mockFollowUpCoordinator.shouldGenerateFollowUp.mockReturnValue(false);
      mockFeedbackQueue.add.mockResolvedValue({});

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        TEXT_DTO,
      );

      expect(result.answerId).toBe('answer-1');
      expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { status: 'active' },
      });
      expect(mockPrisma.userAnswer.upsert).toHaveBeenCalled();
    });

    it('chấp nhận session generating có question, chuyển sang active rồi tạo answer', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        status: 'generating',
      });
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.interviewSession.update.mockResolvedValue({
        ...BASE_SESSION,
        status: 'active',
      });
      mockPrisma.userAnswer.upsert.mockResolvedValue(BASE_ANSWER);
      mockFollowUpCoordinator.shouldGenerateFollowUp.mockReturnValue(false);
      mockFeedbackQueue.add.mockResolvedValue({});

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        TEXT_DTO,
      );

      expect(result.answerId).toBe('answer-1');
      expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { status: 'active' },
      });
      expect(mockPrisma.userAnswer.upsert).toHaveBeenCalled();
    });

    it('text mode: tạo answer, enqueue feedback, không enqueue follow-up khi shouldGenerateFollowUp=false', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.upsert.mockResolvedValue(BASE_ANSWER);
      mockFollowUpCoordinator.shouldGenerateFollowUp.mockReturnValue(false);
      mockFeedbackQueue.add.mockResolvedValue({});

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        TEXT_DTO,
      );

      expect(result).toEqual({
        answerId: 'answer-1',
        followUpQueued: false,
        feedbackQueued: true,
      });
      expect(mockFollowUpQueue.add).not.toHaveBeenCalled();
      expect(mockFeedbackQueue.add).toHaveBeenCalledWith(
        'feedback',
        expect.objectContaining({
          sessionId: 'session-123',
          answerId: 'answer-1',
        }),
        expect.objectContaining({
          jobId: 'feedback-answer-1',
          attempts: FEEDBACK_JOB_ATTEMPTS,
        }),
      );
      expect(mockWhisper.transcribe).not.toHaveBeenCalled();
    });

    it('text mode: enqueue follow-up khi shouldGenerateFollowUp=true', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.upsert.mockResolvedValue(BASE_ANSWER);
      mockFollowUpCoordinator.shouldGenerateFollowUp.mockReturnValue(true);
      mockFollowUpQueue.add.mockResolvedValue({});
      mockFeedbackQueue.add.mockResolvedValue({});

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        TEXT_DTO,
      );

      expect(result.followUpQueued).toBe(true);
      expect(mockFollowUpQueue.add).toHaveBeenCalledWith(
        'follow-up',
        expect.objectContaining({ sessionId: 'session-123' }),
        expect.objectContaining({ jobId: 'follow-up-answer-1' }),
      );
    });

    it('voice mode: gọi whisper.transcribe, tính voice metrics, lưu transcription', async () => {
      const voiceDto = {
        questionId: 'q-1',
        answerMode: 'voice' as const,
        audioFileUrl: 'https://storage.example.com/audio.webm',
        audioDurationSeconds: 45,
        audioSizeBytes: 102400,
      };

      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockWhisper.transcribe.mockResolvedValue({
        text: 'Tôi là backend developer.',
        durationSeconds: 43,
      });
      mockVoiceMetrics.calculate.mockReturnValue({ wpm: 120, fillerCount: 1 });
      mockPrisma.userAnswer.upsert.mockResolvedValue({
        ...BASE_ANSWER,
        answerText: 'Tôi là backend developer.',
      });
      mockFollowUpCoordinator.shouldGenerateFollowUp.mockReturnValue(false);
      mockFeedbackQueue.add.mockResolvedValue({});

      await service.submitAnswer('session-123', 'user-abc', voiceDto);

      expect(mockWhisper.transcribe).toHaveBeenCalledWith(
        'https://storage.example.com/audio.webm',
      );
      expect(mockVoiceMetrics.calculate).toHaveBeenCalled();
      expect(mockPrisma.userAnswer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            answerText: 'Tôi là backend developer.',
            audioFileUrl: 'https://storage.example.com/audio.webm',
          }),
        }),
      );
    });

    it('retry dùng lại answer hiện có và không transcribe hoặc tạo record lần nữa', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue(BASE_ANSWER);
      mockFollowUpCoordinator.shouldGenerateFollowUp.mockReturnValue(false);
      mockFeedbackQueue.add.mockResolvedValue({});

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        TEXT_DTO,
      );

      expect(result.answerId).toBe('answer-1');
      expect(mockPrisma.userAnswer.upsert).not.toHaveBeenCalled();
      expect(mockWhisper.transcribe).not.toHaveBeenCalled();
      expect(mockFeedbackQueue.add).toHaveBeenCalledWith(
        'feedback',
        expect.objectContaining({ answerId: 'answer-1' }),
        expect.objectContaining({ jobId: 'feedback-answer-1' }),
      );
    });
  });
});
