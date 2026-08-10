import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { OpenAIGateway } from '../ai/openai.gateway';
import { PromptBuilderService } from '../ai/prompt-builder.service';
import { ZodValidatorService } from '../ai/zod-validator.service';
import { SURGICAL_FEEDBACK_PROMPT_CONFIG } from '../ai/prompts/surgical-feedback-v1.5';
import {
  FeedbackSchema,
  PROMPT_VERSION,
} from '../ai/pipelines/pipeline.schemas';
import type {
  AppliedDimension,
  FeedbackInput,
  SurgicalFeedback,
} from '../ai/pipelines/interview-pipeline.interface';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { getLanguageInstruction } from '../ai/output-language';
import { resolveAppliedDimensions } from './dimension-matcher';
import { sanitizeFeedbackSegments } from './feedback-segment-sanitizer';

const strategyInstructions = {
  hr: 'Focus on behavioral evidence, motivation, communication, collaboration, self-awareness, and culture fit. Probe for concrete STAR examples. Avoid deep technical trivia unless the job description explicitly requires it.',
  technical:
    'Focus on technical depth, applied problem-solving, trade-offs, debugging, system design, and engineering quality. Ask for reasoning and concrete implementation decisions.',
  mixed:
    'Balance behavioral evidence with technical depth. Cover communication and collaboration alongside applied problem-solving, trade-offs, and role-specific engineering judgment.',
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function alias(record: Record<string, unknown>, ...keys: string[]): unknown {
  return keys.map((key) => record[key]).find((value) => value !== undefined);
}

function clampScore(value: unknown): unknown {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value)))
    : value;
}

@Injectable()
export class EvaluateAnswer {
  private readonly logger = new Logger(EvaluateAnswer.name);

  constructor(
    private readonly openai: OpenAIGateway,
    private readonly promptBuilder: PromptBuilderService,
    private readonly zodValidator: ZodValidatorService,
  ) {}

  async execute(input: FeedbackInput): Promise<SurgicalFeedback> {
    const allowed =
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
    const target = allowed.filter(
      (dimension, index, dimensions) =>
        input.competencyDomains.includes(dimension.id) &&
        dimensions.findIndex(({ id }) => id === dimension.id) === index,
    );
    if (target.length === 0) {
      throw new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Question metadata contains no valid competency domains for this session',
      );
    }

    const targetIds = target.map(({ id }) => id);
    const base = this.promptBuilder.buildBaseSystem('surgical-feedback');
    const strategy = `${base}\n\n${getLanguageInstruction(input.language)}\n\nInterview strategy: ${strategyInstructions[input.sessionType]}`;
    const withPack = this.promptBuilder.applyContextPackForEvaluation(
      strategy,
      input.contextPackConfig,
      input.sessionType,
      { competencyDomains: targetIds },
    );
    const messages = this.promptBuilder.injectDynamicContext({
      systemMessage: `${withPack}\n\nTarget question metadata: category=${input.questionCategory ?? 'unknown'}, competency_domains=${targetIds.join(', ')}. applied_dimensions must contain exactly and only IDs from this resolved target list. Do not score dimensions outside this question domain.`,
      jobDescription: '',
      sessionType: input.sessionType,
      question: input.questionText,
      questionCategory: input.questionCategory,
      competencyDomains: targetIds,
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
      parsed = this.normalize(JSON.parse(raw));
    } catch (error) {
      this.logger.warn(
        `[feedback] JSON parse failed. rawLength=${raw.length}`,
        error,
      );
      throw new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Invalid JSON from AI',
      );
    }
    const validated = this.zodValidator.validate(FeedbackSchema, parsed);
    const selected = resolveAppliedDimensions(
      validated.applied_dimensions,
      target,
    );
    const selectedById = new Map(
      selected.map((dimension) => [dimension.id, dimension]),
    );
    const baseSum = target.reduce(
      (sum, dimension) => sum + dimension.weight,
      0,
    );
    const appliedDimensions: AppliedDimension[] = target.map((dimension) => ({
      id: dimension.id,
      name: dimension.name,
      score: selectedById.get(dimension.id)?.score ?? 0,
      weight: baseSum > 0 ? dimension.weight / baseSum : 1 / target.length,
    }));
    const sanitized = sanitizeFeedbackSegments(
      input.answerText,
      validated.annotated_segments.map((segment) => ({
        segmentText: segment.segment_text,
        startIndex: segment.start_index,
        endIndex: segment.end_index,
        highlightLevel: segment.highlight_level,
        annotation: segment.annotation,
        suggestion: segment.suggestion,
        improvedVersion: segment.improved_version,
      })),
    );
    if (sanitized.issues.length > 0) {
      this.logger.warn(
        `[feedback] Removed invalid annotated segments; invalidSegments=${sanitized.issues.length}`,
      );
    }
    return {
      overallScore: Math.min(
        100,
        Math.max(
          0,
          Math.round(
            appliedDimensions.reduce(
              (sum, dimension) => sum + dimension.score * dimension.weight,
              0,
            ),
          ),
        ),
      ),
      modelAnswer: validated.model_answer,
      keyTakeaway: validated.key_takeaway,
      promptVersion: PROMPT_VERSION,
      appliedDimensions,
      annotatedSegments: sanitized.segments.map((segment) => ({
        ...segment,
        suggestion: segment.suggestion ?? undefined,
        improvedVersion: segment.improvedVersion ?? undefined,
      })),
    };
  }

  private normalize(payload: unknown): unknown {
    if (!isRecord(payload)) return payload;
    const dimensions = alias(
      payload,
      'applied_dimensions',
      'appliedDimensions',
    );
    const segments = alias(payload, 'annotated_segments', 'annotatedSegments');
    return {
      ...payload,
      applied_dimensions: Array.isArray(dimensions)
        ? (dimensions as Record<string, unknown>[]).map((item) =>
            isRecord(item) ? { ...item, score: clampScore(item.score) } : item,
          )
        : dimensions,
      model_answer: alias(payload, 'model_answer', 'modelAnswer'),
      key_takeaway: alias(payload, 'key_takeaway', 'keyTakeaway'),
      annotated_segments: Array.isArray(segments)
        ? (segments as Record<string, unknown>[]).map((item) =>
            isRecord(item)
              ? {
                  ...item,
                  segment_text: alias(item, 'segment_text', 'segmentText'),
                  start_index: alias(item, 'start_index', 'startIndex'),
                  end_index: alias(item, 'end_index', 'endIndex'),
                  highlight_level: alias(
                    item,
                    'highlight_level',
                    'highlightLevel',
                  ),
                  improved_version: alias(
                    item,
                    'improved_version',
                    'improvedVersion',
                  ),
                }
              : item,
          )
        : [],
    };
  }
}
