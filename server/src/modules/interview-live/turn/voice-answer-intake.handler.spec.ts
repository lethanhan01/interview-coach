import { Test, TestingModule } from '@nestjs/testing';
import { VoiceAnswerIntakeHandler } from './voice-answer-intake.handler';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { PrepFacade } from '@modules/interview-prep/contracts';
import { MediaFacade } from '@modules/media/contracts';
import { WorkflowDispatcher } from '@infra/workflow/workflow-dispatcher.service';
import { WorkflowService } from '@infra/workflow/workflow.service';
import {
  createMockPrismaService,
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

  it('should calculate voice metrics, save answer with text, enqueue feedback in outbox, and dispatch job', async () => {
    mockPrisma.userAnswer.findUnique.mockResolvedValue(null);
    mockPrisma.userAnswer.upsert.mockResolvedValue({
      id: 'ans-voice-1',
      questionId: 'q-202',
      answerMode: 'voice',
      answerText: 'Tôi thiết kế hệ thống theo Event Driven Architecture.',
      skipped: false,
      audioDurationSeconds: 45,
    } as any);

    const dto: SubmitAnswerDto = {
      questionId: 'q-202',
      answerMode: 'voice',
      answerText: '  Tôi thiết kế hệ thống theo Event Driven Architecture.  ',
      audioDurationSeconds: 45,
    };

    const result = await handler.handle(dto, mockContext);

    expect(mockMediaFacade.calculateVoiceMetrics).toHaveBeenCalledWith(
      'Tôi thiết kế hệ thống theo Event Driven Architecture.',
      45,
    );

    expect(mockPrisma.userAnswer.upsert).toHaveBeenCalledWith({
      where: { questionId: 'q-202' },
      create: {
        questionId: 'q-202',
        answerMode: 'voice',
        answerText: 'Tôi thiết kế hệ thống theo Event Driven Architecture.',
        skipped: false,
        audioDurationSeconds: 45,
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
        aggregateId: 'ans-voice-1',
        payload: {
          sessionId: 'session-123',
          turnId: 'ans-voice-1',
          answerId: 'ans-voice-1',
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
      'ans-voice-1',
    );

    expect(result).toEqual({
      answerId: 'ans-voice-1',
      feedbackQueued: true,
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
    });
    expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
    expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
  });

  it('should re-enqueue feedback if existing answer is already submitted', async () => {
    mockPrisma.userAnswer.findUnique.mockResolvedValue({
      id: 'ans-existing-voice',
      questionId: 'q-202',
      answerText: 'Câu trả lời đã lưu trước đó',
      skipped: false,
    } as any);

    const dto: SubmitAnswerDto = {
      questionId: 'q-202',
      answerMode: 'voice',
      answerText: 'Câu trả lời mới gửi lại',
    };

    const result = await handler.handle(dto, mockContext);

    expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      {
        commandType: 'feedback',
        aggregateId: 'ans-existing-voice',
        payload: expect.objectContaining({
          sessionId: 'session-123',
          turnId: 'ans-existing-voice',
          answerText: 'Câu trả lời đã lưu trước đó',
        }),
      },
    );

    expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
      'feedback',
      'ans-existing-voice',
    );

    expect(result).toEqual({
      answerId: 'ans-existing-voice',
      feedbackQueued: true,
    });
  });
});
