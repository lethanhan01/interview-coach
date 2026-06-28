import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  let mockConfig: { get: jest.Mock };

  const mockContextPack = {} as any;

  beforeEach(async () => {
    mockOpenAI = createMockOpenAIGateway();
    mockPromptBuilder = createMockPromptBuilderService();
    mockZodValidator = createMockZodValidatorService();
    mockConfig = {
      get: jest.fn((key: string) =>
        key === 'OPENAI_QUESTION_MAX_TOKENS' ? '2400' : undefined,
      ),
    };

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
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<HrPipelineService>(HrPipelineService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('generateQuestions', () => {
    const questionInput = {
      sessionType: 'hr' as const,
      contextPackConfig: mockContextPack,
      jobDescriptionText: 'Backend developer với 2 năm kinh nghiệm',
      targetRoles: ['Backend Developer'],
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

    it('gọi chatCompletion với temperature 0.4 và maxTokens từ OPENAI_QUESTION_MAX_TOKENS', async () => {
      const rawQuestions = {
        questions: [
          {
            text: 'Bạn phối hợp với frontend như thế nào?',
            category: 'behavioral',
            competency_domain: 'collaboration',
            difficulty: 2,
          },
          {
            text: 'Khi deadline gấp bạn xử lý ra sao?',
            category: 'behavioral',
            competency_domain: 'ownership',
            difficulty: 2,
          },
        ],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawQuestions));
      mockZodValidator.validate.mockReturnValue(rawQuestions);

      await service.generateQuestions(questionInput);

      expect(mockOpenAI.chatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.4,
          maxTokens: 2400,
          task: 'question-generation',
          responseFormat: 'json_object',
        }),
      );
    });

    it('truyền numQuestions vào injectDynamicContext theo totalQuestions của input', async () => {
      const rawQuestions = {
        questions: [
          {
            text: 'Q1',
            category: 'hr',
            competency_domain: 'comm',
            difficulty: 1,
          },
          {
            text: 'Q2',
            category: 'hr',
            competency_domain: 'self',
            difficulty: 2,
          },
        ],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawQuestions));
      mockZodValidator.validate.mockReturnValue(rawQuestions);

      await service.generateQuestions(questionInput);

      expect(mockPromptBuilder.injectDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({ numQuestions: questionInput.totalQuestions }),
      );
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

  describe('evaluateAnswer', () => {
    const feedbackInput = {
      sessionType: 'hr' as const,
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

    it('từ chối session type không thuộc strategy hiện tại', async () => {
      await expect(
        service.evaluateAnswer({
          ...feedbackInput,
          sessionType: 'technical',
        }),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_SESSION_TYPE,
      });
    });

    it('gọi chatCompletion với temperature 0.3, maxTokens 3000, task feedback, responseFormat json_object', async () => {
      const rawFeedback = {
        overall_score: 75,
        model_answer: 'Strong answer.',
        key_takeaway: 'Good use of STAR.',
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      await service.evaluateAnswer(feedbackInput);

      expect(mockOpenAI.chatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
          maxTokens: 3000,
          task: 'feedback',
          responseFormat: 'json_object',
        }),
      );
    });

    it('chain buildBaseSystem → applyContextPack → injectDynamicContext với question và answer', async () => {
      const rawFeedback = {
        overall_score: 75,
        model_answer: 'A.',
        key_takeaway: 'B.',
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      await service.evaluateAnswer(feedbackInput);

      expect(mockPromptBuilder.buildBaseSystem).toHaveBeenCalledWith(
        'surgical-feedback',
      );
      expect(mockPromptBuilder.applyContextPack).toHaveBeenCalledWith(
        expect.stringContaining('Output language: Vietnamese.'),
        mockContextPack,
      );
      expect(mockPromptBuilder.applyContextPack).toHaveBeenCalledWith(
        expect.stringContaining('Interview strategy:'),
        mockContextPack,
      );
      expect(mockPromptBuilder.injectDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          jobDescription: '',
          question: feedbackInput.questionText,
          answer: feedbackInput.answerText,
          sessionType: feedbackInput.sessionType,
        }),
      );
    });

    it('dùng English language instruction khi FeedbackInput.language=en', async () => {
      const rawFeedback = {
        overall_score: 75,
        model_answer: 'A.',
        key_takeaway: 'B.',
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      await service.evaluateAnswer({ ...feedbackInput, language: 'en' });

      expect(mockPromptBuilder.applyContextPack).toHaveBeenCalledWith(
        expect.stringContaining('Output language: English.'),
        mockContextPack,
      );
    });

    it('logger.warn được gọi khi zodValidator.validate ném lỗi rồi re-throw', async () => {
      const rawFeedback = { overall_score: 'bad' };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      const validationError = new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      mockZodValidator.validate.mockImplementation(() => {
        throw validationError;
      });
      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      await expect(service.evaluateAnswer(feedbackInput)).rejects.toThrow(
        validationError,
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[feedback] Zod validation failed'),
        expect.anything(),
      );
      expect(warnSpy.mock.calls[0][0]).not.toContain('"overall_score":"bad"');
    });

    it('logger.debug được gọi với raw response sau khi chatCompletion thành công', async () => {
      const rawFeedback = {
        overall_score: 80,
        model_answer: 'Good.',
        key_takeaway: 'OK.',
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);
      const debugSpy = jest.spyOn((service as any).logger, 'debug');

      await service.evaluateAnswer(feedbackInput);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[feedback] raw response length:'),
      );
      expect(debugSpy.mock.calls[0][0]).not.toContain('Good.');
    });

    it('logger.warn được gọi khi JSON.parse fail rồi ném SCHEMA_VALIDATION_ERROR', async () => {
      mockOpenAI.chatCompletion.mockResolvedValue('not-json {{');
      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      await expect(service.evaluateAnswer(feedbackInput)).rejects.toMatchObject(
        {
          errorCode: ErrorCode.SCHEMA_VALIDATION_ERROR,
        },
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[feedback] JSON parse failed. rawLength=11'),
        expect.anything(),
      );
    });
  });
});
