import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvaluateAnswer } from '../../assessment/evaluate-answer.service';
import { HrPipelineService } from './hr.pipeline.service';
import { MixedPipelineService } from './mixed.pipeline.service';
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
  let mixedService: MixedPipelineService;
  let mockOpenAI: ReturnType<typeof createMockOpenAIGateway>;
  let mockPromptBuilder: ReturnType<typeof createMockPromptBuilderService>;
  let mockZodValidator: ReturnType<typeof createMockZodValidatorService>;
  let mockConfig: { get: jest.Mock };

  const mockContextPack = {
    behavioralDimensions: [
      { id: 'D1', name: 'Communication', weight: 0.2 },
      { id: 'D2', name: 'Teamwork', weight: 0.2 },
    ],
    technicalDimensions: [
      { id: 'TD1', name: 'Fundamentals', weight: 0.25 },
      { id: 'TD2', name: 'Application', weight: 0.25 },
    ],
  } as any;

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
    mockPromptBuilder.applyContextPackForEvaluation.mockReturnValue(
      'sys-prompt-with-pack',
    );
    mockPromptBuilder.injectDynamicContext.mockReturnValue([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'user context' },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrPipelineService,
        MixedPipelineService,
        { provide: OpenAIGateway, useValue: mockOpenAI },
        { provide: PromptBuilderService, useValue: mockPromptBuilder },
        { provide: ZodValidatorService, useValue: mockZodValidator },
        { provide: ConfigService, useValue: mockConfig },
        EvaluateAnswer,
      ],
    }).compile();

    service = module.get<HrPipelineService>(HrPipelineService);
    mixedService = module.get<MixedPipelineService>(MixedPipelineService);
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
        competencyDomains: ['communication'],
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

    it('gắn English language instruction vào prompt sinh câu hỏi khi language=en', async () => {
      const rawQuestions = {
        questions: [
          {
            text: 'Tell me about your most relevant backend project.',
            category: 'behavioral',
            competency_domain: 'communication',
            difficulty: 2,
          },
        ],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawQuestions));
      mockZodValidator.validate.mockReturnValue(rawQuestions);

      await service.generateQuestions({ ...questionInput, language: 'en' });

      expect(mockPromptBuilder.injectDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          systemMessage: expect.stringContaining('Output language: English.'),
        }),
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
      competencyDomains: ['D1', 'D2'],
      answerText: 'Tôi là developer với 2 năm kinh nghiệm.',
    };

    it('tính overallScore từ score×weight chuẩn hóa và trả appliedDimensions', async () => {
      const rawFeedback = {
        model_answer: 'Câu trả lời tốt hơn...',
        key_takeaway: 'Cần thêm ví dụ cụ thể',
        applied_dimensions: [
          { id: 'D1', score: 80 },
          { id: 'D2', score: 60 },
        ],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      // base weight D1=0.2, D2=0.2 → chuẩn hóa 0.5/0.5 → 80*0.5 + 60*0.5 = 70
      expect(result.overallScore).toBe(70);
      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 80, weight: 0.5 },
        { id: 'D2', name: 'Teamwork', score: 60, weight: 0.5 },
      ]);
      expect(result.promptVersion).toBe(PROMPT_VERSION);
    });

    it('cho phép mọi target criteria score 0 và overallScore bằng 0', async () => {
      const rawFeedback = {
        model_answer: 'Câu trả lời mẫu.',
        key_takeaway: 'Câu trả lời hiện tại chưa có bằng chứng phù hợp.',
        applied_dimensions: [
          { id: 'D1', score: 0 },
          { id: 'D2', score: 0 },
        ],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.overallScore).toBe(0);
      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 0, weight: 0.5 },
        { id: 'D2', name: 'Teamwork', score: 0, weight: 0.5 },
      ]);
    });

    it('AI bỏ sót target criteria hợp lệ thì criteria đó được điền score 0', async () => {
      const rawFeedback = {
        model_answer: 'Câu trả lời mẫu.',
        key_takeaway: 'Một tiêu chí có bằng chứng, một tiêu chí chưa có.',
        applied_dimensions: [{ id: 'D1', score: 80 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.overallScore).toBe(40);
      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 80, weight: 0.5 },
        { id: 'D2', name: 'Teamwork', score: 0, weight: 0.5 },
      ]);
    });

    it('loại id không thuộc rubric của sessionType rồi điền 0 cho target criteria bị thiếu', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [
          { id: 'D1', score: 90 },
          { id: 'TD1', score: 10 }, // không hợp lệ với sessionType 'hr' → bị loại
        ],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 90, weight: 0.5 },
        { id: 'D2', name: 'Teamwork', score: 0, weight: 0.5 },
      ]);
      expect(result.overallScore).toBe(45);
    });

    it('lọc applied_dimensions theo competencyDomains của câu hỏi khi có metadata', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [
          { id: 'D1', score: 90 },
          { id: 'D2', score: 10 },
        ],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer({
        ...feedbackInput,
        questionCategory: 'behavioral',
        competencyDomains: ['D1'],
      });

      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 90, weight: 1 },
      ]);
      expect(result.overallScore).toBe(90);
      expect(mockPromptBuilder.injectDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          questionCategory: 'behavioral',
          competencyDomains: ['D1'],
        }),
      );
    });

    it('lọc applied_dimensions theo competencyDomains và lưu nhiều dimension hợp lệ', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [
          { id: 'D1', score: 90 },
          { id: 'D2', score: 70 },
          { id: 'TD1', score: 10 },
        ],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer({
        ...feedbackInput,
        questionCategory: 'behavioral',
        competencyDomains: ['D1', 'D2'],
      });

      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 90, weight: 0.5 },
        { id: 'D2', name: 'Teamwork', score: 70, weight: 0.5 },
      ]);
      expect(result.overallScore).toBe(80);
    });

    it('điền score 0 khi AI không trả dimension nào khớp target criteria', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [{ id: 'ZZ', score: 50 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.overallScore).toBe(0);
      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 0, weight: 0.5 },
        { id: 'D2', name: 'Teamwork', score: 0, weight: 0.5 },
      ]);
    });

    it('throw SCHEMA_VALIDATION_ERROR khi question metadata không có target criteria hợp lệ', async () => {
      await expect(
        service.evaluateAnswer({
          ...feedbackInput,
          competencyDomains: ['ZZ'],
        }),
      ).rejects.toMatchObject({ errorCode: ErrorCode.SCHEMA_VALIDATION_ERROR });
      expect(mockOpenAI.chatCompletion).not.toHaveBeenCalled();
      expect(
        mockPromptBuilder.applyContextPackForEvaluation,
      ).not.toHaveBeenCalled();
      expect(mockPromptBuilder.injectDynamicContext).not.toHaveBeenCalled();
    });

    it('bỏ target criteria invalid trước prompt và chỉ tính trên target hợp lệ', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [{ id: 'D1', score: 80 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer({
        ...feedbackInput,
        competencyDomains: ['D1', 'ZZ', 'D2'],
      });

      expect(result.overallScore).toBe(40);
      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 80, weight: 0.5 },
        { id: 'D2', name: 'Teamwork', score: 0, weight: 0.5 },
      ]);
      expect(
        mockPromptBuilder.applyContextPackForEvaluation,
      ).toHaveBeenCalledWith(expect.any(String), mockContextPack, 'hr', {
        competencyDomains: ['D1', 'D2'],
      });
      expect(mockPromptBuilder.injectDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          competencyDomains: ['D1', 'D2'],
        }),
      );
      const contextArg =
        mockPromptBuilder.injectDynamicContext.mock.calls[0][0];
      expect(contextArg.systemMessage).toContain('competency_domains=D1, D2');
      expect(contextArg.systemMessage).not.toContain('ZZ');
    });

    it('bỏ trùng target criteria trước prompt và không nhân đôi trọng số', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [
          { id: 'D1', score: 80 },
          { id: 'D2', score: 60 },
        ],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer({
        ...feedbackInput,
        competencyDomains: ['D1', 'D1', 'D2'],
      });

      expect(result.overallScore).toBe(70);
      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 80, weight: 0.5 },
        { id: 'D2', name: 'Teamwork', score: 60, weight: 0.5 },
      ]);
      expect(
        mockPromptBuilder.applyContextPackForEvaluation,
      ).toHaveBeenCalledWith(expect.any(String), mockContextPack, 'hr', {
        competencyDomains: ['D1', 'D2'],
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

    it('gọi chatCompletion với temperature 0.2, maxTokens 3000, task feedback, responseFormat json_object', async () => {
      const rawFeedback = {
        applied_dimensions: [{ id: 'D1', score: 75 }],
        model_answer: 'Strong answer.',
        key_takeaway: 'Good use of STAR.',
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      await service.evaluateAnswer(feedbackInput);

      expect(mockOpenAI.chatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.2,
          maxTokens: 3000,
          task: 'feedback',
          responseFormat: 'json_object',
        }),
      );
    });

    it('chain buildBaseSystem → applyContextPackForEvaluation → injectDynamicContext với question và answer', async () => {
      const rawFeedback = {
        applied_dimensions: [{ id: 'D1', score: 75 }],
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
      expect(
        mockPromptBuilder.applyContextPackForEvaluation,
      ).toHaveBeenCalledWith(
        expect.stringContaining('Output language: Vietnamese.'),
        mockContextPack,
        'hr',
        { competencyDomains: ['D1', 'D2'] },
      );
      expect(
        mockPromptBuilder.applyContextPackForEvaluation,
      ).toHaveBeenCalledWith(
        expect.stringContaining('Interview strategy:'),
        mockContextPack,
        'hr',
        { competencyDomains: ['D1', 'D2'] },
      );
      expect(mockPromptBuilder.applyContextPack).not.toHaveBeenCalled();
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
        applied_dimensions: [{ id: 'D1', score: 75 }],
        model_answer: 'A.',
        key_takeaway: 'B.',
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      await service.evaluateAnswer({ ...feedbackInput, language: 'en' });

      expect(
        mockPromptBuilder.applyContextPackForEvaluation,
      ).toHaveBeenCalledWith(
        expect.stringContaining('Output language: English.'),
        mockContextPack,
        'hr',
        { competencyDomains: ['D1', 'D2'] },
      );
    });

    it('system prompt giới hạn applied_dimensions trong competency metadata của câu hỏi', async () => {
      const rawFeedback = {
        applied_dimensions: [{ id: 'D1', score: 75 }],
        model_answer: 'A.',
        key_takeaway: 'B.',
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      await service.evaluateAnswer({
        ...feedbackInput,
        questionCategory: 'behavioral',
        competencyDomains: ['D1'],
      });

      expect(
        mockPromptBuilder.applyContextPackForEvaluation,
      ).toHaveBeenCalledWith(expect.any(String), mockContextPack, 'hr', {
        competencyDomains: ['D1'],
      });
      expect(mockPromptBuilder.injectDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          systemMessage: expect.stringContaining(
            'applied_dimensions must contain exactly and only IDs from this resolved target list',
          ),
        }),
      );
    });

    it('mixed + competencyDomains=[TD2] lọc bỏ D* và chỉ giữ target domain', async () => {
      const rawFeedback = {
        applied_dimensions: [
          { id: 'D1', score: 20 },
          { id: 'TD2', score: 90 },
        ],
        model_answer: 'A.',
        key_takeaway: 'B.',
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await mixedService.evaluateAnswer({
        ...feedbackInput,
        sessionType: 'mixed',
        questionCategory: 'technical',
        competencyDomains: ['TD2'],
      });

      expect(result.appliedDimensions).toEqual([
        { id: 'TD2', name: 'Application', score: 90, weight: 1 },
      ]);
      expect(
        mockPromptBuilder.applyContextPackForEvaluation,
      ).toHaveBeenCalledWith(expect.any(String), mockContextPack, 'mixed', {
        competencyDomains: ['TD2'],
      });
    });

    it('mixed + cross-category competencyDomains chấm cả technical và behavioral target domains', async () => {
      const rawFeedback = {
        applied_dimensions: [
          { id: 'D1', score: 80 },
          { id: 'TD2', score: 80 },
          { id: 'TD1', score: 20 },
        ],
        model_answer: 'A.',
        key_takeaway: 'B.',
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await mixedService.evaluateAnswer({
        ...feedbackInput,
        sessionType: 'mixed',
        questionCategory: 'technical',
        competencyDomains: ['TD2', 'D1'],
      });

      expect(result.overallScore).toBe(80);
      expect(result.appliedDimensions.map((dimension) => dimension.id)).toEqual(
        ['TD2', 'D1'],
      );
      expect(
        mockPromptBuilder.applyContextPackForEvaluation,
      ).toHaveBeenCalledWith(expect.any(String), mockContextPack, 'mixed', {
        competencyDomains: ['TD2', 'D1'],
      });
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
        applied_dimensions: [{ id: 'D1', score: 80 }],
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

    it('sanitize annotatedSegments và không retry khi quote không thuộc answerText', async () => {
      const firstFeedback = {
        applied_dimensions: [{ id: 'D1', score: 80 }],
        model_answer: 'REST là một architectural style.',
        key_takeaway: 'Cần phân biệt REST kỹ thuật.',
        annotated_segments: [
          {
            segment_text: 'REST là một architectural style.',
            start_index: 0,
            end_index: 35,
            highlight_level: 'strength',
            annotation: 'Định nghĩa đúng REST.',
          },
        ],
      };
      mockOpenAI.chatCompletion.mockResolvedValueOnce(
        JSON.stringify(firstFeedback),
      );
      mockZodValidator.validate.mockReturnValueOnce(firstFeedback);

      const result = await service.evaluateAnswer({
        ...feedbackInput,
        answerText: 'Tôi nghĩ REST là nghỉ ngơi.',
      });

      expect(mockOpenAI.chatCompletion).toHaveBeenCalledTimes(1);
      expect(result.overallScore).toBe(40);
      expect(result.annotatedSegments).toEqual([]);
    });

    it('persist feedback đã bỏ annotatedSegments sai mà không gọi retry lần hai', async () => {
      const invalidFeedback = {
        applied_dimensions: [{ id: 'D1', score: 80 }],
        model_answer: 'REST là một architectural style.',
        key_takeaway: 'Cần phân biệt REST kỹ thuật.',
        annotated_segments: [
          {
            segment_text: 'REST là một architectural style.',
            start_index: 0,
            end_index: 35,
            highlight_level: 'strength',
            annotation: 'Định nghĩa đúng REST.',
          },
        ],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(
        JSON.stringify(invalidFeedback),
      );
      mockZodValidator.validate.mockReturnValue(invalidFeedback);

      const result = await service.evaluateAnswer({
        ...feedbackInput,
        answerText: 'Tôi nghĩ REST là nghỉ ngơi.',
      });

      expect(mockOpenAI.chatCompletion).toHaveBeenCalledTimes(1);
      expect(result.overallScore).toBe(40);
      expect(result.annotatedSegments).toEqual([]);
    });

    it('normalizer nhận camelCase, clamp score và cho phép segment thiếu index', async () => {
      const rawFeedback = {
        modelAnswer: 'Good answer.',
        keyTakeaway: 'Add clearer metrics.',
        appliedDimensions: [
          { id: 'd1', score: 125 },
          { id: 'D1', score: 40 },
          { id: 'D2', score: -5 },
        ],
        annotatedSegments: [
          {
            segmentText: 'REST là nghỉ ngơi',
            highlightLevel: 'improvement',
            annotation: 'Quote unique nên backend tự map index.',
          },
        ],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockImplementation((_schema, data) => data);

      const result = await service.evaluateAnswer({
        ...feedbackInput,
        answerText: 'Tôi nghĩ REST là nghỉ ngơi.',
      });

      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 100, weight: 0.5 },
        { id: 'D2', name: 'Teamwork', score: 0, weight: 0.5 },
      ]);
      expect(result.overallScore).toBe(50);
      expect(result.annotatedSegments).toEqual([
        expect.objectContaining({
          segmentText: 'REST là nghỉ ngơi',
          startIndex: 9,
          endIndex: 26,
        }),
      ]);
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

    it('KHÔNG log "Zod validation failed" khi Zod pass nhưng dimension không match', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [{ id: 'ZZ', score: 50 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const warnSpy = jest.spyOn((service as any).logger, 'warn');
      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.overallScore).toBe(0);
      const warnMessages = warnSpy.mock.calls.map((c) => String(c[0]));
      expect(
        warnMessages.some((m) => m.includes('Zod validation failed')),
      ).toBe(false);
    });

    it('log "No scoring dimensions matched" kèm returnedIds khi dimension fail', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [{ id: 'WRONG_ID', score: 50 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const warnSpy = jest.spyOn((service as any).logger, 'warn');
      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.overallScore).toBe(0);
      const warnMessages = warnSpy.mock.calls.map((c) => String(c[0]));
      expect(warnMessages.some((m) => m.includes('returnedIds='))).toBe(true);
      expect(
        warnMessages.some((m) => m.includes('No scoring dimensions matched')),
      ).toBe(true);
    });

    it('log "Zod validation failed" khi Zod thật sự throw', async () => {
      mockOpenAI.chatCompletion.mockResolvedValue(
        JSON.stringify({ bad: 'data' }),
      );
      const zodError = new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        422,
        'bad schema',
      );
      mockZodValidator.validate.mockImplementation(() => {
        throw zodError;
      });

      const warnSpy = jest.spyOn((service as any).logger, 'warn');
      await expect(service.evaluateAnswer(feedbackInput)).rejects.toThrow();
      const warnMessages = warnSpy.mock.calls.map((c) => String(c[0]));
      expect(
        warnMessages.some((m) => m.includes('Zod validation failed')),
      ).toBe(true);
    });

    it('gemma trả id sai casing "d1" → vẫn resolve D1, isFallback không xảy ra', async () => {
      const rawFeedback = {
        model_answer: 'Answer.',
        key_takeaway: 'Good.',
        applied_dimensions: [{ id: 'd1', score: 80 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.appliedDimensions).toHaveLength(2);
      expect(result.appliedDimensions[0]).toMatchObject({
        id: 'D1',
        name: 'Communication',
        score: 80,
      });
      expect(result.appliedDimensions[1]).toMatchObject({
        id: 'D2',
        name: 'Teamwork',
        score: 0,
      });
      expect(result.overallScore).toBe(40);
    });

    it('gemma trả tên dimension "Teamwork" → vẫn resolve D2', async () => {
      const rawFeedback = {
        model_answer: 'Answer.',
        key_takeaway: 'Good.',
        applied_dimensions: [
          { id: 'd1', score: 80 },
          { id: 'Teamwork', score: 60 },
        ],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.appliedDimensions).toHaveLength(2);
      expect(result.appliedDimensions.map((d) => d.id)).toEqual(['D1', 'D2']);
    });

    it('dimension không match sau normalize → vẫn ghi đủ target criteria với score 0', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [{ id: 'TOTALLY_BOGUS', score: 50 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.overallScore).toBe(0);
      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 0, weight: 0.5 },
        { id: 'D2', name: 'Teamwork', score: 0, weight: 0.5 },
      ]);
    });
  });
});
