import { HttpStatus, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvaluateAnswer } from '@/assessment/evaluate-answer.service';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { AI_GATEWAY_TOKEN, type IAIGateway } from '../ai-gateway.interface';
import { getLanguageInstruction } from '../output-language';
import { PromptBuilderService } from '../prompt-builder.service';
import { QUESTION_GEN_PROMPT_CONFIG } from '../prompts/question-gen-v1.0';
import { ZodValidatorService } from '../zod-validator.service';
import {
  type FeedbackInput,
  type GeneratedQuestion,
  type InterviewPipeline,
  type QuestionGenInput,
  type SessionType,
  type SurgicalFeedback,
} from './interview-pipeline.interface';
import { QuestionsSchema } from './pipeline.schemas';

export abstract class BasePipelineService implements InterviewPipeline {
  abstract readonly sessionType: SessionType;
  protected abstract readonly strategyInstructions: string;
  protected readonly logger: Logger;

  constructor(
    @Inject(AI_GATEWAY_TOKEN)
    protected readonly openai: IAIGateway,
    protected readonly promptBuilder: PromptBuilderService,
    protected readonly zodValidator: ZodValidatorService,
    protected readonly config: ConfigService,
    private readonly evaluator: EvaluateAnswer,
  ) {
    this.logger = evaluator.logger;
  }

  async generateQuestions(
    input: QuestionGenInput,
  ): Promise<GeneratedQuestion[]> {
    const base = this.promptBuilder.buildBaseSystem('question-generation');
    const withStrategy = this.applyStrategy(base, input.sessionType);
    const withPack = this.promptBuilder.applyContextPack(
      withStrategy,
      input.contextPackConfig,
    );
    const withLanguage = `${withPack}\n\n${getLanguageInstruction(input.language)}`;
    const messages = this.promptBuilder.injectDynamicContext({
      systemMessage: withLanguage,
      jobDescription: input.jobDescriptionText,
      sessionType: input.sessionType,
      targetRoles: input.targetRoles,
      numQuestions: input.totalQuestions,
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
      competencyDomains: (q.competency_domains ?? [q.competency_domain]).filter(
        (domain): domain is string => Boolean(domain),
      ),
      difficulty: q.difficulty,
    }));
  }

  async evaluateAnswer(input: FeedbackInput): Promise<SurgicalFeedback> {
    this.applyStrategy('', input.sessionType);
    return this.evaluator.execute(input, {
      strategyInstructions: this.strategyInstructions,
      targetOrder: 'requested',
    });
  }

  private applyStrategy(
    baseSystem: string,
    requestedSessionType: SessionType,
  ): string {
    if (requestedSessionType !== this.sessionType) {
      throw new InterviewAIException(
        ErrorCode.INVALID_SESSION_TYPE,
        HttpStatus.BAD_REQUEST,
        `Pipeline ${this.sessionType} cannot handle ${requestedSessionType} sessions.`,
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
