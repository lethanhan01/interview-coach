import { Test, TestingModule } from '@nestjs/testing';
import { TextAnswerIntakeHandler } from './text-answer-intake.handler';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { QuestionCriteriaService } from '@modules/interview-prep/question-criteria/question-criteria.service';
import { WorkflowDispatcher } from '@infra/workflow/workflow-dispatcher.service';
import { WorkflowService } from '@infra/workflow/workflow.service';
import {
  createMockPrismaService,
  createMockQuestionCriteriaService,
  createMockWorkflowDispatcher,
  createMockWorkflowService,
} from '@core/test-utils/mock-factories';
import { AnswerIntakeContext } from './answer-intake-handler.interface';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

describe('TextAnswerIntakeHandler', () => {
  let handler: TextAnswerIntakeHandler;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockQuestionCriteria: ReturnType<
    typeof createMockQuestionCriteriaService
  >;
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
      id: 'q-101',
      sessionId: 'session-123',
      orderIndex: 1,
      questionText: 'Hãy giới thiệu kinh nghiệm của bạn?',
      questionCategory: 'behavioral',
      estimatedTimeMin: 3,
      createdAt: new Date(),
      questionBankId: null,
      criteria: [],
    } as any,
    sessionType: 'hr',
  };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockQuestionCriteria = createMockQuestionCriteriaService();
    mockWorkflow = createMockWorkflowService();
    mockDispatcher = createMockWorkflowDispatcher();

    mockQuestionCriteria.codesFromSessionQuestion.mockReturnValue(['D1', 'D2']);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TextAnswerIntakeHandler,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: QuestionCriteriaService,
          useValue: mockQuestionCriteria,
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

    handler = module.get<TextAnswerIntakeHandler>(TextAnswerIntakeHandler);
  });

  it('should have supportedMode as "text"', () => {
    expect(handler.supportedMode).toBe('text');
  });

  it('should return skipped status without enqueuing feedback if answer was already skipped', async () => {
    mockPrisma.userAnswer.findUnique.mockResolvedValue({
      id: 'ans-skipped',
      questionId: 'q-101',
      skipped: true,
    } as any);

    const dto: SubmitAnswerDto = {
      questionId: 'q-101',
      answerMode: 'text',
      answerText: 'Một câu trả lời nào đó',
    };

    const result = await handler.handle(dto, mockContext);

    expect(result).toEqual({
      answerId: 'ans-skipped',
      feedbackQueued: false,
      transcriptionPending: false,
    });
    expect(mockWorkflow.enqueueInTransaction).not.toHaveBeenCalled();
    expect(mockDispatcher.dispatchFor).not.toHaveBeenCalled();
  });

  it('should create a new text answer, enqueue feedback in outbox transaction, and dispatch job', async () => {
    mockPrisma.userAnswer.findUnique.mockResolvedValue(null);
    mockPrisma.userAnswer.upsert.mockResolvedValue({
      id: 'ans-new-1',
      questionId: 'q-101',
      answerMode: 'text',
      answerText: 'Tôi có 3 năm kinh nghiệm lập trình backend với NestJS.',
      skipped: false,
    } as any);

    const dto: SubmitAnswerDto = {
      questionId: 'q-101',
      answerMode: 'text',
      answerText: '  Tôi có 3 năm kinh nghiệm lập trình backend với NestJS.  ',
    };

    const result = await handler.handle(dto, mockContext);

    expect(mockPrisma.userAnswer.upsert).toHaveBeenCalledWith({
      where: { questionId: 'q-101' },
      create: {
        questionId: 'q-101',
        answerMode: 'text',
        answerText: 'Tôi có 3 năm kinh nghiệm lập trình backend với NestJS.',
        skipped: false,
      },
      update: {},
    });

    expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      {
        commandType: 'feedback',
        aggregateId: 'ans-new-1',
        payload: {
          sessionId: 'session-123',
          turnId: 'ans-new-1',
          answerId: 'ans-new-1',
          questionId: 'q-101',
          questionText: 'Hãy giới thiệu kinh nghiệm của bạn?',
          questionCategory: 'behavioral',
          competencyDomains: ['D1', 'D2'],
          answerText: 'Tôi có 3 năm kinh nghiệm lập trình backend với NestJS.',
          contextPack: 'VN',
          sessionType: 'hr',
          language: 'vi',
        },
      },
    );

    expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
      'feedback',
      'ans-new-1',
    );

    expect(result).toEqual({
      answerId: 'ans-new-1',
      feedbackQueued: true,
      transcriptionPending: false,
    });
  });

  it('should reuse existing non-skipped answer, enqueue feedback in outbox transaction, and dispatch job', async () => {
    mockPrisma.userAnswer.findUnique.mockResolvedValue({
      id: 'ans-existing-1',
      questionId: 'q-101',
      answerMode: 'text',
      answerText: 'Câu trả lời đã lưu trước đó',
      skipped: false,
    } as any);

    const dto: SubmitAnswerDto = {
      questionId: 'q-101',
      answerMode: 'text',
      answerText: 'Câu trả lời mới gửi lại',
    };

    const result = await handler.handle(dto, mockContext);

    expect(mockPrisma.userAnswer.upsert).not.toHaveBeenCalled();
    expect(mockWorkflow.enqueueInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        commandType: 'feedback',
        aggregateId: 'ans-existing-1',
        payload: expect.objectContaining({
          answerId: 'ans-existing-1',
          answerText: 'Câu trả lời đã lưu trước đó',
        }),
      }),
    );
    expect(mockDispatcher.dispatchFor).toHaveBeenCalledWith(
      'feedback',
      'ans-existing-1',
    );
    expect(result).toEqual({
      answerId: 'ans-existing-1',
      feedbackQueued: true,
      transcriptionPending: false,
    });
  });
});
