import { HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIGateway } from '../openai.gateway';
import { PromptBuilderService } from '../prompt-builder.service';
import { ZodValidatorService } from '../zod-validator.service';
import { InterviewAIException } from '../../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';
import {
  InterviewPipeline,
  QuestionGenInput,
  GeneratedQuestion,
  FeedbackInput,
  SurgicalFeedback,
  SessionType,
} from './interview-pipeline.interface';
import {
  QuestionsSchema,
  FeedbackSchema,
  PROMPT_VERSION,
} from './pipeline.schemas';
import { SURGICAL_FEEDBACK_PROMPT_CONFIG } from '../prompts/surgical-feedback-v1.1';
import { QUESTION_GEN_PROMPT_CONFIG } from '../prompts/question-gen-v1.0';

export abstract class BasePipelineService implements InterviewPipeline {
  protected abstract readonly supportedSessionType: SessionType;
  protected abstract readonly strategyInstructions: string;
  protected readonly logger = new Logger(BasePipelineService.name);

  constructor(
    protected readonly openai: OpenAIGateway,
    protected readonly promptBuilder: PromptBuilderService,
    protected readonly zodValidator: ZodValidatorService,
    protected readonly config: ConfigService,
  ) {}

  async generateQuestions(
    input: QuestionGenInput,
  ): Promise<GeneratedQuestion[]> {
    const base = this.promptBuilder.buildBaseSystem('question-generation');
    const withStrategy = this.applyStrategy(base, input.sessionType);
    const withPack = this.promptBuilder.applyContextPack(
      withStrategy,
      input.contextPackConfig,
    );
    const messages = this.promptBuilder.injectDynamicContext({
      systemMessage: withPack,
      jobDescription: input.jobDescriptionText,
      sessionType: input.sessionType,
      targetRoles: input.targetRoles,
    });
    const raw = await this.openai.chatCompletion({
      messages,
      temperature: QUESTION_GEN_PROMPT_CONFIG.temperature,
      maxTokens: this.getQuestionMaxTokens(),
      responseFormat: 'json_object',
      task: 'question-generation',
    });
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new InterviewAIException(
        ErrorCode.AI_SERVICE_ERROR,
        HttpStatus.BAD_GATEWAY,
        'Invalid JSON from AI',
      );
    }
    const validated = this.zodValidator.validate(QuestionsSchema, parsed);
    return validated.questions.slice(0, input.totalQuestions).map((q) => ({
      text: q.text,
      category: q.category,
      competencyDomain: q.competency_domain,
      difficulty: q.difficulty,
    }));
  }

  async evaluateAnswer(input: FeedbackInput): Promise<SurgicalFeedback> {
    const base = this.promptBuilder.buildBaseSystem('surgical-feedback');
    const withStrategy = this.applyStrategy(base, input.sessionType);
    const withPack = this.promptBuilder.applyContextPack(
      withStrategy,
      input.contextPackConfig,
    );
    const messages = this.promptBuilder.injectDynamicContext({
      systemMessage: withPack,
      jobDescription: '',
      sessionType: input.sessionType,
      question: input.questionText,
      answer: input.answerText,
    });
    const raw = await this.openai.chatCompletion({
      messages,
      temperature: SURGICAL_FEEDBACK_PROMPT_CONFIG.temperature,
      maxTokens: SURGICAL_FEEDBACK_PROMPT_CONFIG.maxTokens,
      responseFormat: 'json_object',
      task: 'feedback',
    });
    this.logger.debug(`[feedback] raw response length: ${raw.length}`);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.logger.warn(
        `[feedback] JSON parse failed. rawLength=${raw.length}`,
        err,
      );
      throw new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Invalid JSON from AI',
      );
    }
    try {
      const validated = this.zodValidator.validate(FeedbackSchema, parsed);
      return {
        overallScore: validated.overall_score,
        modelAnswer: validated.model_answer,
        keyTakeaway: validated.key_takeaway,
        promptVersion: PROMPT_VERSION,
        annotatedSegments: validated.annotated_segments.map((s) => ({
          segmentText: s.segment_text,
          startIndex: s.start_index,
          endIndex: s.end_index,
          highlightLevel: s.highlight_level,
          annotation: s.annotation,
          suggestion: s.suggestion,
          improvedVersion: s.improved_version,
        })),
      };
    } catch (err) {
      this.logger.warn(
        `[feedback] Zod validation failed. rawLength=${raw.length}`,
        err,
      );
      throw err;
    }
  }

  private applyStrategy(
    baseSystem: string,
    requestedSessionType: SessionType,
  ): string {
    if (requestedSessionType !== this.supportedSessionType) {
      throw new InterviewAIException(
        ErrorCode.INVALID_SESSION_TYPE,
        HttpStatus.BAD_REQUEST,
        `Pipeline ${this.supportedSessionType} cannot handle ${requestedSessionType} sessions.`,
      );
    }

    return `${baseSystem}\n\nInterview strategy: ${this.strategyInstructions}`;
  }

  private getQuestionMaxTokens(): number {
    const configured = Number(
      this.config.get('OPENAI_QUESTION_MAX_TOKENS') ??
        QUESTION_GEN_PROMPT_CONFIG.maxTokens,
    );

    return Number.isFinite(configured) && configured > 0
      ? configured
      : QUESTION_GEN_PROMPT_CONFIG.maxTokens;
  }
}
