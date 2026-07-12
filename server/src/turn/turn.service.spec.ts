import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { TurnService } from './turn.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';
import { AudioStorageService } from './audio-storage.service';
import { VoiceMetricsService } from './voice-metrics.service';
import {
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
  TRANSCRIPTION_QUEUE,
  TRANSCRIPTION_JOB_ATTEMPTS,
} from '../common/constants/queue.constants';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import {
  createMockPrismaService,
  createMockQuestionCriteriaService,
  createMockQueue,
  createMockVoiceMetricsService,
} from '../test-utils/mock-factories';

describe('TurnService', () => {
  let service: TurnService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockFeedbackQueue: ReturnType<typeof createMockQueue>;
  let mockTranscriptionQueue: ReturnType<typeof createMockQueue>;
  let mockQuestionCriteria: ReturnType<typeof createMockQuestionCriteriaService>;
  let mockAudioStorage: {
    uploadInterviewAudio: jest.Mock;
  };
  let mockVoiceMetrics: ReturnType<typeof createMockVoiceMetricsService>;

  const BASE_SESSION = {
    id: 'session-123',
    userId: 'user-abc',
    status: 'active',
    sessionType: 'hr',
    contextPackId: 'VN',
    language: 'vi',
    numQuestions: 5,
  };

  const BASE_QUESTION = {
    id: 'q-1',
    questionText: 'Giới thiệu bản thân?',
    questionCategory: 'behavioral',
    criteria: [
      {
        criterionCode: 'D1',
        categoryKeySnapshot: 'behavioral',
        displayOrderSnapshot: 1,
      },
    ],
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
    mockFeedbackQueue = createMockQueue();
    mockTranscriptionQueue = createMockQueue();
    mockQuestionCriteria = createMockQuestionCriteriaService();
    mockAudioStorage = {
      uploadInterviewAudio: jest.fn(),
    };
    mockVoiceMetrics = createMockVoiceMetricsService();
    mockVoiceMetrics.calculate.mockReturnValue({
      wpm: 120,
      fillerWordCount: 1,
      fillerWords: ['um'],
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QuestionCriteriaService, useValue: mockQuestionCriteria },
        {
          provide: AudioStorageService,
          useValue: mockAudioStorage,
        },
        {
          provide: VoiceMetricsService,
          useValue: mockVoiceMetrics,
        },
        { provide: getQueueToken(FEEDBACK_QUEUE), useValue: mockFeedbackQueue },
        {
          provide: getQueueToken(TRANSCRIPTION_QUEUE),
          useValue: mockTranscriptionQueue,
        },
      ],
    }).compile();

    service = module.get<TurnService>(TurnService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('uploadAudio', () => {
    const AUDIO_FILE = {
      buffer: Buffer.from([1, 2, 3]),
      mimetype: 'audio/webm',
      size: 3,
    };

    it('ném SESSION_NOT_FOUND khi session không tồn tại', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadAudio('session-123', 'user-abc', AUDIO_FILE),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.SESSION_NOT_FOUND,
      });

      expect(mockAudioStorage.uploadInterviewAudio).not.toHaveBeenCalled();
    });

    it('ném FORBIDDEN khi user không phải owner', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        userId: 'other-user',
      });

      await expect(
        service.uploadAudio('session-123', 'user-abc', AUDIO_FILE),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.FORBIDDEN,
      });

      expect(mockAudioStorage.uploadInterviewAudio).not.toHaveBeenCalled();
    });

    it('ủy quyền upload audio cho AudioStorageService khi session thuộc user', async () => {
      const uploadResult = {
        audioFileUrl:
          'https://project.supabase.co/storage/v1/object/public/interview-audio/u/s/audio.webm',
        audioSizeBytes: 3,
      };
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        userId: 'user-abc',
      });
      mockAudioStorage.uploadInterviewAudio.mockResolvedValue(uploadResult);

      await expect(
        service.uploadAudio('session-123', 'user-abc', AUDIO_FILE),
      ).resolves.toEqual(uploadResult);

      expect(mockAudioStorage.uploadInterviewAudio).toHaveBeenCalledWith({
        sessionId: 'session-123',
        userId: 'user-abc',
        file: AUDIO_FILE,
      });
    });
  });

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

      expect(mockFeedbackQueue.add).not.toHaveBeenCalled();
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();

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

    it('throw SESSION_NOT_ACTIVE khi session status là generating', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        status: 'generating',
      });

      await expect(
        service.submitAnswer('session-123', 'user-abc', TEXT_DTO),
      ).rejects.toThrow(InterviewAIException);

      expect(mockFeedbackQueue.add).not.toHaveBeenCalled();
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();

      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        status: 'generating',
      });
      try {
        await service.submitAnswer('session-123', 'user-abc', TEXT_DTO);
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.SESSION_NOT_ACTIVE,
        );
      }
    });

    it('ném INVALID_SESSION_TYPE và không enqueue khi dữ liệu DB nằm ngoài contract', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        sessionType: 'HR',
      });

      await expect(
        service.submitAnswer('session-123', 'user-abc', TEXT_DTO),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_SESSION_TYPE,
      });

      expect(mockPrisma.sessionQuestion.findFirst).not.toHaveBeenCalled();
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();
      expect(mockFeedbackQueue.add).not.toHaveBeenCalled();
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
      mockPrisma.userAnswer.findUnique.mockResolvedValue(null);
      mockPrisma.userAnswer.upsert.mockResolvedValue(BASE_ANSWER);
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

    it('text mode: tạo answer, enqueue feedback', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue(null);
      mockPrisma.userAnswer.upsert.mockResolvedValue(BASE_ANSWER);
      mockFeedbackQueue.add.mockResolvedValue({});

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        TEXT_DTO,
      );

      expect(result).toEqual({
        answerId: 'answer-1',
        feedbackQueued: true,
        transcriptionPending: false,
      });
      expect(mockFeedbackQueue.add).toHaveBeenCalledWith(
        'feedback',
        expect.objectContaining({
          sessionId: 'session-123',
          turnId: 'answer-1',
          answerId: 'answer-1',
          questionId: 'q-1',
          questionText: 'Giới thiệu bản thân?',
          questionCategory: 'behavioral',
          competencyDomains: ['D1'],
          answerText: 'Tôi là developer với 2 năm kinh nghiệm.',
          contextPack: 'VN',
          sessionType: 'hr',
          language: 'vi',
        }),
        expect.objectContaining({
          jobId: 'feedback-answer-1',
          attempts: FEEDBACK_JOB_ATTEMPTS,
          backoff: { type: 'fixed', delay: 2000 },
        }),
      );
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();
    });

    it('skipQuestion: tạo skipped answer rỗng và không enqueue feedback/transcription', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue(null);
      mockPrisma.userAnswer.upsert.mockResolvedValue({
        ...BASE_ANSWER,
        answerText: '',
        skipped: true,
      });

      const result = await service.submitAnswer('session-123', 'user-abc', {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: '',
        skipQuestion: true,
      });

      expect(result).toEqual({
        answerId: 'answer-1',
        feedbackQueued: false,
        transcriptionPending: false,
      });
      expect(mockPrisma.userAnswer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            answerMode: 'text',
            answerText: '',
            skipped: true,
            feedbackGenerated: false,
          }),
        }),
      );
      expect(mockFeedbackQueue.add).not.toHaveBeenCalled();
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();
    });

    it('skipQuestion retry: dùng lại skipped answer hiện có và không enqueue', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue({
        ...BASE_ANSWER,
        answerText: '',
        skipped: true,
        transcriptionStatus: null,
      });

      const result = await service.submitAnswer('session-123', 'user-abc', {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: '',
        skipQuestion: true,
      });

      expect(result).toEqual({
        answerId: 'answer-1',
        feedbackQueued: false,
        transcriptionPending: false,
      });
      expect(mockPrisma.userAnswer.upsert).not.toHaveBeenCalled();
      expect(mockFeedbackQueue.add).not.toHaveBeenCalled();
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();
    });

    it('skipQuestion không ghi đè câu trả lời thật đã tồn tại', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue({
        ...BASE_ANSWER,
        skipped: false,
        transcriptionStatus: null,
      });

      const result = await service.submitAnswer('session-123', 'user-abc', {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: '',
        skipQuestion: true,
      });

      expect(result).toEqual({
        answerId: 'answer-1',
        feedbackQueued: true,
        transcriptionPending: false,
      });
      expect(mockPrisma.userAnswer.upsert).not.toHaveBeenCalled();
      expect(mockFeedbackQueue.add).not.toHaveBeenCalled();
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();
    });

    it('feedback payload dùng questionText/contextPack/sessionType từ DB cho technical Western session', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        sessionType: 'technical',
        contextPackId: 'Western',
      });
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue({
        ...BASE_QUESTION,
        questionText: 'Explain a system design trade-off.',
        questionCategory: 'technical',
        criteria: [
          {
            criterionCode: 'TD3',
            categoryKeySnapshot: 'technical',
            displayOrderSnapshot: 1,
          },
        ],
      });
      mockPrisma.userAnswer.findUnique.mockResolvedValue(null);
      mockPrisma.userAnswer.upsert.mockResolvedValue({
        ...BASE_ANSWER,
        answerText: 'I chose pagination because it reduced memory usage.',
      });
      mockFeedbackQueue.add.mockResolvedValue({});

      await service.submitAnswer('session-123', 'user-abc', {
        ...TEXT_DTO,
        answerText: 'Client text should only be stored before enqueue.',
      });

      expect(mockFeedbackQueue.add).toHaveBeenCalledWith(
        'feedback',
        {
          sessionId: 'session-123',
          turnId: 'answer-1',
          answerId: 'answer-1',
          questionId: 'q-1',
          questionText: 'Explain a system design trade-off.',
          questionCategory: 'technical',
          competencyDomains: ['TD3'],
          answerText: 'I chose pagination because it reduced memory usage.',
          contextPack: 'Western',
          sessionType: 'technical',
          language: 'vi',
        },
        expect.objectContaining({
          jobId: 'feedback-answer-1',
          attempts: FEEDBACK_JOB_ATTEMPTS,
        }),
      );
    });

    it('voice mode: enqueue transcription job, không gọi Whisper trực tiếp, return transcriptionPending=true', async () => {
      const voiceDto = {
        questionId: 'q-1',
        answerMode: 'voice' as const,
        audioFileUrl: 'https://storage.example.com/audio.webm',
        audioDurationSeconds: 45,
        audioSizeBytes: 102400,
      };

      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.upsert.mockResolvedValue({
        ...BASE_ANSWER,
        answerText: '',
        audioFileUrl: 'https://storage.example.com/audio.webm',
      });
      mockTranscriptionQueue.add.mockResolvedValue({});

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        voiceDto,
      );

      expect(result).toEqual({
        answerId: 'answer-1',
        feedbackQueued: false,
        transcriptionPending: true,
      });
      expect(mockTranscriptionQueue.add).toHaveBeenCalledWith(
        'transcription',
        expect.objectContaining({
          sessionId: 'session-123',
          answerId: 'answer-1',
          audioFileUrl: 'https://storage.example.com/audio.webm',
          language: 'vi',
        }),
        expect.objectContaining({
          jobId: 'transcription-answer-1',
          attempts: TRANSCRIPTION_JOB_ATTEMPTS,
        }),
      );
      expect(mockFeedbackQueue.add).not.toHaveBeenCalled();
    });

    it('voice mode: lưu answer với transcriptionStatus=pending và answerText rỗng', async () => {
      const voiceDto = {
        questionId: 'q-1',
        answerMode: 'voice' as const,
        audioFileUrl: 'https://storage.example.com/audio.webm',
        audioDurationSeconds: 45,
        audioSizeBytes: 102400,
      };

      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.upsert.mockResolvedValue({
        ...BASE_ANSWER,
        answerText: '',
      });
      mockTranscriptionQueue.add.mockResolvedValue({});

      await service.submitAnswer('session-123', 'user-abc', voiceDto);

      expect(mockPrisma.userAnswer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            answerText: '',
            audioFileUrl: 'https://storage.example.com/audio.webm',
            transcriptionStatus: 'pending',
          }),
        }),
      );
    });

    it('voice mode với transcript đã chỉnh: lưu answerText, đánh dấu done và enqueue feedback ngay', async () => {
      const editedTranscript =
        'Tôi là developer backend, có kinh nghiệm xây dựng API NestJS.';
      const voiceDto = {
        questionId: 'q-1',
        answerMode: 'voice' as const,
        answerText: editedTranscript,
        audioFileUrl: 'https://storage.example.com/audio.webm',
        audioDurationSeconds: 30,
        audioSizeBytes: 102400,
      };

      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.upsert.mockResolvedValue({
        ...BASE_ANSWER,
        answerMode: 'voice',
        answerText: editedTranscript,
        audioFileUrl: 'https://storage.example.com/audio.webm',
        transcriptionStatus: 'done',
      });
      mockFeedbackQueue.add.mockResolvedValue({});

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        voiceDto,
      );

      expect(result).toEqual({
        answerId: 'answer-1',
        feedbackQueued: true,
        transcriptionPending: false,
      });
      expect(mockPrisma.userAnswer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            answerMode: 'voice',
            answerText: editedTranscript,
            audioFileUrl: 'https://storage.example.com/audio.webm',
            transcriptionStatus: 'done',
            voiceMetricsJson: {
              wpm: 120,
              fillerWordCount: 1,
              fillerWords: ['um'],
            },
          }),
        }),
      );
      expect(mockVoiceMetrics.calculate).toHaveBeenCalledWith(
        editedTranscript,
        30,
      );
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();
      expect(mockFeedbackQueue.add).toHaveBeenCalledWith(
        'feedback',
        expect.objectContaining({
          answerText: editedTranscript,
          language: 'vi',
        }),
        expect.objectContaining({ jobId: 'feedback-answer-1' }),
      );
    });

    it('retry dùng lại answer hiện có và không tạo record lần nữa', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue(BASE_ANSWER);
      mockFeedbackQueue.add.mockResolvedValue({});

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        TEXT_DTO,
      );

      expect(result.answerId).toBe('answer-1');
      expect(mockPrisma.userAnswer.upsert).not.toHaveBeenCalled();
      expect(mockFeedbackQueue.add).toHaveBeenCalledWith(
        'feedback',
        expect.objectContaining({ answerId: 'answer-1', language: 'vi' }),
        expect.objectContaining({ jobId: 'feedback-answer-1' }),
      );
    });

    it('voice retry: transcription đã done → return feedbackQueued=true, không tạo record mới, không re-enqueue', async () => {
      const VOICE_DTO = {
        questionId: 'q-1',
        answerMode: 'voice' as const,
        audioFileUrl: 'https://example.com/audio.mp3',
      };

      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue({
        ...BASE_ANSWER,
        answerMode: 'voice',
        transcriptionStatus: 'done',
      });

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        VOICE_DTO,
      );

      expect(result).toEqual({
        answerId: 'answer-1',
        feedbackQueued: true,
        transcriptionPending: false,
      });
      expect(mockPrisma.userAnswer.upsert).not.toHaveBeenCalled();
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();
      expect(mockFeedbackQueue.add).not.toHaveBeenCalled();
    });

    it('voice retry: transcription còn pending → re-enqueue transcription, return transcriptionPending=true', async () => {
      const VOICE_DTO = {
        questionId: 'q-1',
        answerMode: 'voice' as const,
        audioFileUrl: 'https://example.com/audio.mp3',
      };

      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue({
        ...BASE_ANSWER,
        answerMode: 'voice',
        transcriptionStatus: 'pending',
      });
      mockTranscriptionQueue.add.mockResolvedValue({});

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        VOICE_DTO,
      );

      expect(result).toEqual({
        answerId: 'answer-1',
        feedbackQueued: false,
        transcriptionPending: true,
      });
      expect(mockPrisma.userAnswer.upsert).not.toHaveBeenCalled();
      expect(mockTranscriptionQueue.add).toHaveBeenCalledWith(
        'transcription',
        expect.objectContaining({
          sessionId: 'session-123',
          answerId: 'answer-1',
          audioFileUrl: 'https://example.com/audio.mp3',
          language: 'vi',
        }),
        expect.objectContaining({
          jobId: 'transcription-answer-1',
          attempts: TRANSCRIPTION_JOB_ATTEMPTS,
        }),
      );
    });

    it('voice retry: transcription failed → return transcriptionPending=false, feedbackQueued=false, không re-enqueue', async () => {
      const VOICE_DTO = {
        questionId: 'q-1',
        answerMode: 'voice' as const,
        audioFileUrl: 'https://example.com/audio.mp3',
      };

      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue({
        ...BASE_ANSWER,
        answerMode: 'voice',
        transcriptionStatus: 'failed',
      });

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        VOICE_DTO,
      );

      expect(result).toEqual({
        answerId: 'answer-1',
        feedbackQueued: false,
        transcriptionPending: false,
      });
      expect(mockPrisma.userAnswer.upsert).not.toHaveBeenCalled();
      expect(mockTranscriptionQueue.add).not.toHaveBeenCalled();
    });
  });
});
