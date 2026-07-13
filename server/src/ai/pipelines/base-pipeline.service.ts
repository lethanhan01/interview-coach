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
import { SURGICAL_FEEDBACK_PROMPT_CONFIG } from '../prompts/surgical-feedback-v1.5';
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

function readAlias(
  record: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
  }
  return undefined;
}

function clampScore(value: unknown): number | unknown {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  return Math.min(100, Math.max(0, Math.round(value)));
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
    const sessionAllowedDims =
      input.sessionType === 'hr'
        ? input.contextPackConfig.behavioralDimensions
        : input.sessionType === 'technical'
          ? input.contextPackConfig.technicalDimensions
          : [
              ...input.contextPackConfig.behavioralDimensions,
              ...input.contextPackConfig.technicalDimensions,
            ];
    if (input.competencyDomains.length === 0) {
      throw new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Question metadata must include at least one competency domain',
      );
    }
    const seenTargetIds = new Set<string>();
    const targetDims: typeof sessionAllowedDims = [];
    for (const domain of input.competencyDomains) {
      const dimension = sessionAllowedDims.find((d) => d.id === domain);
      if (dimension && !seenTargetIds.has(dimension.id)) {
        seenTargetIds.add(dimension.id);
        targetDims.push(dimension);
      }
    }
    if (targetDims.length === 0) {
      throw new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Question metadata contains no valid competency domains for this session',
      );
    }
    const targetDomainIds = targetDims.map((d) => d.id);
    const withPack = this.promptBuilder.applyContextPackForEvaluation(
      withStrategy,
      input.contextPackConfig,
      input.sessionType,
      { competencyDomains: targetDomainIds },
    );
    const withQuestionMetadata = `${withPack}\n\nTarget question metadata: category=${input.questionCategory ?? 'unknown'}, competency_domains=${targetDomainIds.join(', ')}. applied_dimensions must contain exactly and only IDs from this resolved target list. Do not score dimensions outside this question domain.`;
    const messages = this.promptBuilder.injectDynamicContext({
      systemMessage: withQuestionMetadata,
      jobDescription: '',
      sessionType: input.sessionType,
      question: input.questionText,
      questionCategory: input.questionCategory,
      competencyDomains: targetDomainIds,
      answer: input.answerText,
    });
    const firstAttempt = await this.requestAndValidateFeedback(messages);
    const allowedDims = targetDims;

    const firstBuilt = this.buildSurgicalFeedback(
      firstAttempt.validated,
      allowedDims,
      input.answerText,
      firstAttempt.rawLength,
    );
    if (firstBuilt.segmentIssues.length > 0) {
      this.logger.warn(
        `[feedback] Removed invalid annotated segments; sanitized result will be persisted. ` +
          `invalidSegments=${firstBuilt.segmentIssues.length} reasons=${this.formatSegmentIssueReasons(firstBuilt.segmentIssues)}`,
      );
    }
    return firstBuilt.feedback;
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
      parsed = this.normalizeFeedbackPayload(JSON.parse(raw) as unknown);
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

  private normalizeFeedbackPayload(payload: unknown): unknown {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return payload;
    }

    const record = payload as Record<string, unknown>;
    const appliedRaw = readAlias(
      record,
      'applied_dimensions',
      'appliedDimensions',
    );
    const segmentsRaw = readAlias(
      record,
      'annotated_segments',
      'annotatedSegments',
    );

    return {
      ...record,
      applied_dimensions: Array.isArray(appliedRaw)
        ? appliedRaw.map((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
              return item;
            }
            const dimension = item as Record<string, unknown>;
            return {
              ...dimension,
              id: dimension.id,
              score: clampScore(dimension.score),
            };
          })
        : appliedRaw,
      model_answer: readAlias(record, 'model_answer', 'modelAnswer'),
      key_takeaway: readAlias(record, 'key_takeaway', 'keyTakeaway'),
      annotated_segments: Array.isArray(segmentsRaw)
        ? segmentsRaw.map((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
              return item;
            }
            const segment = item as Record<string, unknown>;
            return {
              ...segment,
              segment_text: readAlias(segment, 'segment_text', 'segmentText'),
              start_index: readAlias(segment, 'start_index', 'startIndex'),
              end_index: readAlias(segment, 'end_index', 'endIndex'),
              highlight_level: readAlias(
                segment,
                'highlight_level',
                'highlightLevel',
              ),
              improved_version: readAlias(
                segment,
                'improved_version',
                'improvedVersion',
              ),
            };
          })
        : [],
    };
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
    }

    const selectedById = new Map(selected.map((d) => [d.id, d]));
    const baseSum = allowedDims.reduce((s, d) => s + d.weight, 0);
    const appliedDimensions: AppliedDimension[] = allowedDims.map((d) => ({
      id: d.id,
      name: d.name,
      score: selectedById.get(d.id)?.score ?? 0,
      weight: baseSum > 0 ? d.weight / baseSum : 1 / allowedDims.length,
    }));
    const weighted = appliedDimensions.reduce(
      (s, d) => s + d.score * d.weight,
      0,
    );
    const overallScore = Math.min(100, Math.max(0, Math.round(weighted)));

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
