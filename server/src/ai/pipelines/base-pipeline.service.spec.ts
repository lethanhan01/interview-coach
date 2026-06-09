import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { HrPipelineService } from './hr.pipeline.service';
import { OpenAIGateway } from '../openai.gateway';
import { PromptBuilderService } from '../prompt-builder.service';
import { ZodValidatorService } from '../zod-validator.service';
import { InterviewAIException } from '../../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';
import { PROMPT_VERSION } from './pipeline.schemas';
import {
  createMockOpenAIGateway,
  createMockPromptBuilderService,
  createMockZodValidatorService,
} from '../../test-utils/mock-factories';

describe('BasePipelineService (via HrPipelineService)', () => {
  let service: HrPipelineService;
  let mockOpenAI: ReturnType<typeof createMockOpenAIGateway>;
  let mockPromptBuilder: ReturnType<typeof createMockPromptBuilderService>;
  let mockZodValidator: ReturnType<typeof createMockZodValidatorService>;

  const mockContextPack = {} as any;

  beforeEach(async () => {
    mockOpenAI = createMockOpenAIGateway();
    mockPromptBuilder = createMockPromptBuilderService();
    mockZodValidator = createMockZodValidatorService();

    mockPromptBuilder.buildBaseSystem.mockReturnValue('sys-prompt');
    mockPromptBuilder.applyContextPack.mockReturnValue('sys-prompt-with-pack');
    mockPromptBuilder.injectDynamicContext.mockReturnValue([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'user context' },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrPipelineService,
        { provide: OpenAIGateway, useValue: mockOpenAI },
        { provide: PromptBuilderService, useValue: mockPromptBuilder },
        { provide: ZodValidatorService, useValue: mockZodValidator },
      ],
    }).compile();

    service = module.get<HrPipelineService>(HrPipelineService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('generateQuestions', () => {
    const questionInput = {
      contextPackConfig: mockContextPack,
      jobDescriptionText: 'Backend developer với 2 năm kinh nghiệm',
      totalQuestions: 2,
    };

    it('trả về mảng GeneratedQuestion khi chatCompletion và validate thành công', async () => {
      const rawQuestions = {
        questions: [
          {
            text: 'Giới thiệu bản thân?',
            category: 'hr',
            competency_domain: 'communication',
            difficulty: 1,
          },
          {
            text: 'Điểm mạnh của bạn?',
            category: 'hr',
            competency_domain: 'self_awareness',
            difficulty: 2,
          },
        ],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawQuestions));
      mockZodValidator.validate.mockReturnValue(rawQuestions);

      const result = await service.generateQuestions(questionInput);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        text: 'Giới thiệu bản thân?',
        category: 'hr',
        competencyDomain: 'communication',
        difficulty: 1,
      });
      expect(mockZodValidator.validate).toHaveBeenCalledTimes(1);
    });

    it('ném AI_SERVICE_ERROR khi chatCompletion trả về JSON không hợp lệ', async () => {
      mockOpenAI.chatCompletion.mockResolvedValue('không phải JSON {{');

      await expect(service.generateQuestions(questionInput)).rejects.toThrow(
        InterviewAIException,
      );

      try {
        await service.generateQuestions(questionInput);
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.AI_SERVICE_ERROR,
        );
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.BAD_GATEWAY,
        );
      }
    });

    it('propagate exception khi zodValidator.validate ném lỗi', async () => {
      mockOpenAI.chatCompletion.mockResolvedValue(
        JSON.stringify({ questions: [] }),
      );
      mockZodValidator.validate.mockImplementation(() => {
        throw new InterviewAIException(
          ErrorCode.SCHEMA_VALIDATION_ERROR,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      });

      await expect(service.generateQuestions(questionInput)).rejects.toThrow(
        InterviewAIException,
      );
    });
  });

  describe('generateFollowUp', () => {
    const followUpInput = {
      contextPackConfig: mockContextPack,
      questionText: 'Điểm mạnh của bạn là gì?',
      answerText: 'Tôi học nhanh.',
    };

    it('trả về { followUpText, triggerReason } khi JSON hợp lệ với FollowUpSchema', async () => {
      mockOpenAI.chatCompletion.mockResolvedValue(
        JSON.stringify({
          follow_up: 'Bạn có thể cho ví dụ cụ thể không?',
          trigger_reason: 'incomplete_answer',
        }),
      );

      const result = await service.generateFollowUp(followUpInput);

      expect(result).toEqual({
        followUpText: 'Bạn có thể cho ví dụ cụ thể không?',
        triggerReason: 'incomplete_answer',
      });
    });

    it('trả về null khi JSON không khớp FollowUpSchema', async () => {
      mockOpenAI.chatCompletion.mockResolvedValue(
        JSON.stringify({ some_other_field: 'value' }),
      );

      const result = await service.generateFollowUp(followUpInput);

      expect(result).toBeNull();
    });

    it('ném AI_SERVICE_ERROR khi chatCompletion trả về JSON không hợp lệ', async () => {
      mockOpenAI.chatCompletion.mockResolvedValue('>>> INVALID <<<');

      await expect(service.generateFollowUp(followUpInput)).rejects.toThrow(
        InterviewAIException,
      );
    });
  });

  describe('evaluateAnswer', () => {
    const feedbackInput = {
      contextPackConfig: mockContextPack,
      questionText: 'Giới thiệu bản thân?',
      answerText: 'Tôi là developer với 2 năm kinh nghiệm.',
    };

    it('trả về SurgicalFeedback với annotatedSegments khi thành công', async () => {
      const rawFeedback = {
        overall_score: 82,
        model_answer: 'Câu trả lời tốt hơn...',
        key_takeaway: 'Cần thêm ví dụ cụ thể',
        annotated_segments: [
          {
            segment_text: '2 năm kinh nghiệm',
            start_index: 0,
            end_index: 17,
            highlight_level: 'strength' as const,
            annotation: 'Rõ ràng',
            suggestion: undefined,
            improved_version: undefined,
          },
        ],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.overallScore).toBe(82);
      expect(result.modelAnswer).toBe('Câu trả lời tốt hơn...');
      expect(result.keyTakeaway).toBe('Cần thêm ví dụ cụ thể');
      expect(result.promptVersion).toBe(PROMPT_VERSION);
      expect(result.annotatedSegments).toHaveLength(1);
      expect(result.annotatedSegments[0]).toEqual({
        segmentText: '2 năm kinh nghiệm',
        startIndex: 0,
        endIndex: 17,
        highlightLevel: 'strength',
        annotation: 'Rõ ràng',
        suggestion: undefined,
        improvedVersion: undefined,
      });
    });
  });
});
