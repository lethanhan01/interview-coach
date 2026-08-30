import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { TurnService } from './turn.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { QuestionCriteriaService } from '@modules/interview-prep/question-criteria/question-criteria.service';
import { UploadAndTranscribeAnswerAudio } from '@modules/media/upload-and-transcribe-answer-audio.service';
import { VoiceMetricsService } from '@modules/media/voice-metrics.service';
import { WorkflowDispatcher } from '@infra/workflow/workflow-dispatcher.service';
import { WorkflowService } from '@infra/workflow/workflow.service';
import { TurnAnswerContext } from './turn-answer-context.service';
import { SubmitTurnAnswer } from './submit-turn-answer.service';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import {
  createMockPrismaService,
  createMockQuestionCriteriaService,
  createMockVoiceMetricsService,
  createMockWorkflowDispatcher,
  createMockWorkflowService,
} from '@core/test-utils/mock-factories';

import { TextAnswerIntakeHandler } from './text-answer-intake.handler';
import { VoiceAnswerIntakeHandler } from './voice-answer-intake.handler';
import { AnswerIntakeRegistry } from './answer-intake.registry';

describe('TurnService', () => {
  let service: TurnService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockWorkflow: ReturnType<typeof createMockWorkflowService>;
  let mockDispatcher: ReturnType<typeof createMockWorkflowDispatcher>;
  let mockQuestionCriteria: ReturnType<
    typeof createMockQuestionCriteriaService
  >;
  let mockAudioStorage: {
    execute: jest.Mock;
  };
  let mockVoiceMetrics: ReturnType<typeof createMockVoiceMetricsService>;

  const BASE_SESSION = {
    id: 'session-123',
    status: 'active',
    sessionType: 'hr',
    contextPackId: 'VN',
    language: 'vi',
    numQuestions: 5,
    savedJobDescription: {
      userId: 'user-abc',
    },
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
    mockWorkflow = createMockWorkflowService();
    mockDispatcher = createMockWorkflowDispatcher();
    mockQuestionCriteria = createMockQuestionCriteriaService();
    mockAudioStorage = {
      execute: jest.fn(),
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
        TurnAnswerContext,
        TextAnswerIntakeHandler,
        VoiceAnswerIntakeHandler,
        AnswerIntakeRegistry,
        SubmitTurnAnswer,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QuestionCriteriaService, useValue: mockQuestionCriteria },
        {
          provide: UploadAndTranscribeAnswerAudio,
          useValue: mockAudioStorage,
        },
        {
          provide: VoiceMetricsService,
          useValue: mockVoiceMetrics,
        },
        { provide: WorkflowService, useValue: mockWorkflow },
        { provide: WorkflowDispatcher, useValue: mockDispatcher },
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

      expect(mockAudioStorage.execute).not.toHaveBeenCalled();
    });

    it('ném FORBIDDEN khi user không phải owner', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        savedJobDescription: { userId: 'other-user' },
      });

      await expect(
        service.uploadAudio('session-123', 'user-abc', AUDIO_FILE),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.FORBIDDEN,
      });

      expect(mockAudioStorage.execute).not.toHaveBeenCalled();
    });

    it('ủy quyền upload audio cho use case khi session thuộc user', async () => {
      const uploadResult = {
        audioFileUrl:
          'https://project.supabase.co/storage/v1/object/public/interview-audio/u/s/audio.webm',
        audioSizeBytes: 3,
      };
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        savedJobDescription: { userId: 'user-abc' },
      });
      mockAudioStorage.execute.mockResolvedValue(uploadResult);

      await expect(
        service.uploadAudio('session-123', 'user-abc', AUDIO_FILE),
      ).resolves.toEqual(uploadResult);

      expect(mockAudioStorage.execute).toHaveBeenCalledWith({
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
        savedJobDescription: { userId: 'other-user' },
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

      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();

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

      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();

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
      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
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

    it('text mode: tạo answer, enqueue feedback in outbox, dispatch', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue(null);
      mockPrisma.userAnswer.upsert.mockResolvedValue(BASE_ANSWER);

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
      expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        {
          commandType: 'feedback',
          aggregateId: 'answer-1',
          payload: expect.objectContaining({
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
        },
      );
      expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
        'feedback',
        'answer-1',
      );
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
      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
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
      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
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
      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
    });

    it('không enqueue feedback nếu submit đến sau khi câu hỏi đã bị skipped', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue({
        ...BASE_ANSWER,
        answerText: '',
        skipped: true,
        transcriptionStatus: null,
      });

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        TEXT_DTO,
      );

      expect(result).toEqual({
        answerId: 'answer-1',
        feedbackQueued: false,
        transcriptionPending: false,
      });
      expect(mockPrisma.userAnswer.upsert).not.toHaveBeenCalled();
      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
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

      await service.submitAnswer('session-123', 'user-abc', {
        ...TEXT_DTO,
        answerText: 'Client text should only be stored before enqueue.',
      });

      expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        {
          commandType: 'feedback',
          aggregateId: 'answer-1',
          payload: expect.objectContaining({
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
          }),
        },
      );
      expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
        'feedback',
        'answer-1',
      );
    });

    it('voice mode: enqueue transcription in outbox, không gọi Whisper trực tiếp, return transcriptionPending=true', async () => {
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
      expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        {
          commandType: 'transcription',
          aggregateId: 'answer-1',
          payload: expect.objectContaining({
            sessionId: 'session-123',
            answerId: 'answer-1',
            audioFileUrl: 'https://storage.example.com/audio.webm',
            language: 'vi',
          }),
        },
      );
      expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
        'transcription',
        'answer-1',
      );
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
      expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        {
          commandType: 'feedback',
          aggregateId: 'answer-1',
          payload: expect.objectContaining({
            answerText: editedTranscript,
            language: 'vi',
          }),
        },
      );
      expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
        'feedback',
        'answer-1',
      );
    });

    it('retry dùng lại answer hiện có và không tạo record lần nữa', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.findFirst.mockResolvedValue(BASE_QUESTION);
      mockPrisma.userAnswer.findUnique.mockResolvedValue(BASE_ANSWER);

      const result = await service.submitAnswer(
        'session-123',
        'user-abc',
        TEXT_DTO,
      );

      expect(result.answerId).toBe('answer-1');
      expect(mockPrisma.userAnswer.upsert).not.toHaveBeenCalled();
      expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          commandType: 'feedback',
          aggregateId: 'answer-1',
          payload: expect.objectContaining({
            answerId: 'answer-1',
            language: 'vi',
          }),
        }),
      );
      expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
        'feedback',
        'answer-1',
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
      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
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
      expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        {
          commandType: 'transcription',
          aggregateId: 'answer-1',
          payload: expect.objectContaining({
            sessionId: 'session-123',
            answerId: 'answer-1',
            audioFileUrl: 'https://example.com/audio.mp3',
            language: 'vi',
          }),
        },
      );
      expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
        'transcription',
        'answer-1',
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
      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
    });
  });
});
