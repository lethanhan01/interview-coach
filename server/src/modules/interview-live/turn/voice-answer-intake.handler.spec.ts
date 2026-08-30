import { Test, TestingModule } from '@nestjs/testing';
import { VoiceAnswerIntakeHandler } from './voice-answer-intake.handler';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { PrepFacade } from '@modules/interview-prep/contracts';
import { MediaFacade } from '@modules/media/contracts';
import { WorkflowDispatcher } from '@infra/workflow/workflow-dispatcher.service';
import { WorkflowService } from '@infra/workflow/workflow.service';
import {
  createMockPrismaService,
  createMockQuestionCriteriaService,
  createMockVoiceMetricsService,
  createMockWorkflowDispatcher,
  createMockWorkflowService,
} from '@core/test-utils/mock-factories';
import { AnswerIntakeContext } from './answer-intake-handler.interface';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

describe('VoiceAnswerIntakeHandler', () => {
  let handler: VoiceAnswerIntakeHandler;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockPrepFacade: {
    codesFromSessionQuestion: jest.Mock;
  };
  let mockMediaFacade: {
    calculateVoiceMetrics: jest.Mock;
  };
  let mockWorkflow: ReturnType<typeof createMockWorkflowService>;
  let mockDispatcher: ReturnType<typeof createMockWorkflowDispatcher>;

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
    mockPrepFacade = {
      codesFromSessionQuestion: jest.fn().mockReturnValue(['T1', 'T2']),
    };
    mockMediaFacade = {
      calculateVoiceMetrics: jest.fn().mockReturnValue({
        wpm: 135,
        fillerWordCount: 2,
        fillerWords: ['à', 'ừm'],
      }),
    };
    mockWorkflow = createMockWorkflowService();
    mockDispatcher = createMockWorkflowDispatcher();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceAnswerIntakeHandler,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: PrepFacade,
          useValue: mockPrepFacade,
        },
        {
          provide: MediaFacade,
          useValue: mockMediaFacade,
        },
        {
          provide: WorkflowService,
          useValue: mockWorkflow,
        },
        {
          provide: WorkflowDispatcher,
          useValue: mockDispatcher,
        },
      ],
    }).compile();

    handler = module.get<VoiceAnswerIntakeHandler>(VoiceAnswerIntakeHandler);
  });

  it('should have supportedMode as "voice"', () => {
    expect(handler.supportedMode).toBe('voice');
  });

  describe('Audio only (no transcript)', () => {
    it('should create new voice answer, enqueue transcription in outbox, and dispatch job when audioFileUrl is present', async () => {
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

      expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        {
          commandType: 'transcription',
          aggregateId: 'ans-voice-1',
          payload: {
            sessionId: 'session-123',
            answerId: 'ans-voice-1',
            audioFileUrl: 'https://storage.example.com/audio/1.mp3',
            audioDurationSeconds: 45,
            audioSizeBytes: 102400,
            contextPack: 'VN',
            sessionType: 'technical',
            language: 'vi',
          },
        },
      );

      expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
        'transcription',
        'ans-voice-1',
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
      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
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
      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
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

      expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          commandType: 'transcription',
          aggregateId: 'ans-voice-pending',
          payload: expect.objectContaining({
            answerId: 'ans-voice-pending',
          }),
        }),
      );

      expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
        'transcription',
        'ans-voice-pending',
      );

      expect(result).toEqual({
        answerId: 'ans-voice-pending',
        feedbackQueued: false,
        transcriptionPending: true,
      });
    });
  });

  describe('Voice with transcript', () => {
    it('should calculate voice metrics, enqueue feedback in outbox, and dispatch job', async () => {
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

      expect(mockMediaFacade.calculateVoiceMetrics).toHaveBeenCalledWith(
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

      expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        {
          commandType: 'feedback',
          aggregateId: 'ans-voice-with-txt',
          payload: {
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
        },
      );

      expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
        'feedback',
        'ans-voice-with-txt',
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
      expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
      expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
    });
  });
});
