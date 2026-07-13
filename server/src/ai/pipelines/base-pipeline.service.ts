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
  AppliedDimension,
} from './interview-pipeline.interface';
import {
  QuestionsSchema,
  FeedbackSchema,
  PROMPT_VERSION,
} from './pipeline.schemas';
import { SURGICAL_FEEDBACK_PROMPT_CONFIG } from '../prompts/surgical-feedback-v1.4';
import { getLanguageInstruction } from '../output-language';
import { QUESTION_GEN_PROMPT_CONFIG } from '../prompts/question-gen-v1.0';
import { z } from 'zod';
import { resolveAppliedDimensions } from './dimension-matcher';
import {
  sanitizeFeedbackSegments,
  type SegmentSanitizerIssue,
} from '../feedback-segment-sanitizer';

type ValidatedFeedback = z.infer<typeof FeedbackSchema>;

interface FeedbackParseResult {
  validated: ValidatedFeedback;
  rawLength: number;
}

interface BuiltFeedback {
  feedback: SurgicalFeedback;
  segmentIssues: SegmentSanitizerIssue[];
}

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
    const base = this.promptBuilder.buildBaseSystem('surgical-feedback');
    const withLanguage = `${base}\n\n${getLanguageInstruction(input.language)}`;
    const withStrategy = this.applyStrategy(withLanguage, input.sessionType);
    const withPack = this.promptBuilder.applyContextPackForEvaluation(
      withStrategy,
      input.contextPackConfig,
      input.sessionType,
      { competencyDomains: input.competencyDomains },
    );
    if (input.competencyDomains.length === 0) {
      throw new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Question metadata must include at least one competency domain',
      );
    }
    const withQuestionMetadata = `${withPack}\n\nTarget question metadata: category=${input.questionCategory ?? 'unknown'}, competency_domains=${input.competencyDomains.join(', ')}. applied_dimensions must contain only IDs from this list when they are listed in the allowed dimensions. Do not score dimensions outside this question domain.`;
    const messages = this.promptBuilder.injectDynamicContext({
      systemMessage: withQuestionMetadata,
      jobDescription: '',
      sessionType: input.sessionType,
      question: input.questionText,
      questionCategory: input.questionCategory,
      competencyDomains: input.competencyDomains,
      answer: input.answerText,
    });
    const firstAttempt = await this.requestAndValidateFeedback(messages);
    const sessionAllowedDims =
      input.sessionType === 'hr'
        ? input.contextPackConfig.behavioralDimensions
        : input.sessionType === 'technical'
          ? input.contextPackConfig.technicalDimensions
          : [
              ...input.contextPackConfig.behavioralDimensions,
              ...input.contextPackConfig.technicalDimensions,
            ];
    const targetDims = input.competencyDomains
      .map((domain) => sessionAllowedDims.find((d) => d.id === domain))
      .filter((d): d is (typeof sessionAllowedDims)[number] => Boolean(d));
    if (targetDims.length === 0) {
      throw new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Question metadata contains no valid competency domains for this session',
      );
    }
    const allowedDims = targetDims;

    const firstBuilt = this.buildSurgicalFeedback(
      firstAttempt.validated,
      allowedDims,
      input.answerText,
      firstAttempt.rawLength,
    );
    if (firstBuilt.segmentIssues.length === 0) {
      return firstBuilt.feedback;
    }

    this.logger.warn(
      `[feedback] Removed invalid annotated segments before retry. ` +
        `invalidSegments=${firstBuilt.segmentIssues.length} reasons=${this.formatSegmentIssueReasons(firstBuilt.segmentIssues)}`,
    );

    try {
      const retryAttempt = await this.requestAndValidateFeedback([
        ...messages,
        {
          role: 'system',
          content:
            'Correction: annotated_segments quotes must be copied only from the candidate answer inside <answer>. Do not quote model_answer, the question, job description, or outside knowledge. If no exact candidate-answer quote supports feedback, return annotated_segments as an empty array.',
        },
      ]);
      const retryBuilt = this.buildSurgicalFeedback(
        retryAttempt.validated,
        allowedDims,
        input.answerText,
        retryAttempt.rawLength,
      );
      if (retryBuilt.segmentIssues.length > 0) {
        this.logger.warn(
          `[feedback] Retry still returned invalid annotated segments; sanitized result will be persisted. ` +
            `invalidSegments=${retryBuilt.segmentIssues.length} reasons=${this.formatSegmentIssueReasons(retryBuilt.segmentIssues)}`,
        );
      }
      return retryBuilt.feedback;
    } catch (err) {
      this.logger.warn(
        '[feedback] Segment correction retry failed; using sanitized first feedback result',
        err instanceof Error ? err.message : String(err),
      );
      return firstBuilt.feedback;
    }
  }

  private async requestAndValidateFeedback(
    messages: ReturnType<PromptBuilderService['injectDynamicContext']>,
  ): Promise<FeedbackParseResult> {
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
      return {
        validated: this.zodValidator.validate(FeedbackSchema, parsed),
        rawLength: raw.length,
      };
    } catch (err) {
      this.logger.warn(
        `[feedback] Zod validation failed. rawLength=${raw.length}`,
        err,
      );
      throw err;
    }
  }

  private buildSurgicalFeedback(
    validated: ValidatedFeedback,
    allowedDims: { id: string; name: string; weight: number }[],
    answerText: string,
    rawLength: number,
  ): BuiltFeedback {
    const selected = resolveAppliedDimensions(
      validated.applied_dimensions,
      allowedDims,
    );
    if (selected.length === 0) {
      this.logger.warn(
        `[feedback] No scoring dimensions matched. ` +
          `returnedIds=${JSON.stringify(validated.applied_dimensions.map((d) => d.id))} ` +
          `allowedIds=${JSON.stringify(allowedDims.map((d) => d.id))} rawLength=${rawLength}`,
      );
      throw new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'AI returned no valid scoring dimensions',
      );
    }

    const baseSum = selected.reduce((s, d) => s + d.baseWeight, 0);
    const appliedDimensions: AppliedDimension[] = selected.map((d) => ({
      id: d.id,
      name: d.name,
      score: d.score,
      weight: baseSum > 0 ? d.baseWeight / baseSum : 1 / selected.length,
    }));
    const weighted = appliedDimensions.reduce(
      (s, d) => s + d.score * d.weight,
      0,
    );
    const overallScore = Math.min(100, Math.max(1, Math.round(weighted)));

    const rawSegments = validated.annotated_segments.map((s) => ({
      segmentText: s.segment_text,
      startIndex: s.start_index,
      endIndex: s.end_index,
      highlightLevel: s.highlight_level,
      annotation: s.annotation,
      suggestion: s.suggestion,
      improvedVersion: s.improved_version,
    }));
    const sanitized = sanitizeFeedbackSegments(answerText, rawSegments);

    return {
      feedback: {
        overallScore,
        modelAnswer: validated.model_answer,
        keyTakeaway: validated.key_takeaway,
        promptVersion: PROMPT_VERSION,
        appliedDimensions,
        annotatedSegments: sanitized.segments.map((s) => ({
          segmentText: s.segmentText,
          startIndex: s.startIndex,
          endIndex: s.endIndex,
          highlightLevel: s.highlightLevel,
          annotation: s.annotation,
          suggestion: s.suggestion ?? undefined,
          improvedVersion: s.improvedVersion ?? undefined,
        })),
      },
      segmentIssues: sanitized.issues,
    };
  }

  private formatSegmentIssueReasons(issues: SegmentSanitizerIssue[]): string {
    const counts = issues.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.reason] = (acc[issue.reason] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([reason, count]) => `${reason}:${count}`)
      .join(',');
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
