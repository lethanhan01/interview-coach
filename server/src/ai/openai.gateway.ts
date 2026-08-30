import { Injectable, HttpStatus, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIError, APIUserAbortError } from 'openai';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { OpenAIChatClient } from './openai-chat.client';
import { OpenAITranscriptionClient } from './openai-transcription.client';
import {
  type IAIGateway,
  type ChatTask,
  type ChatCompletionParams,
  type TranscribeParams,
  type TranscribeResult,
  type GenerateStructuredParams,
  type GenerateTextParams,
  type TranscribeAudioParams,
} from './ai-gateway.interface';

export type {
  ChatTask,
  ChatCompletionParams,
  TranscribeParams,
  TranscribeResult,
};

// Retry delays for transient rate limits only (not quota exhaustion)
const RATE_LIMIT_RETRY_DELAYS_MS = [1000, 2000];
const QUOTA_COOLDOWN_MS = 60_000;
const QUESTION_TRUNCATED_RETRY_MAX_TOKENS = 3600;

interface ChoiceMetadata {
  content: string;
  finishReason: string;
  reasoningContentLength: number;
}

interface JsonExtractionResult {
  content: string;
  source: 'plain' | 'fence' | 'embedded';
  repairApplied: string[];
}

@Injectable()
export class OpenAIGateway implements IAIGateway {
  private readonly logger = new Logger(OpenAIGateway.name);
  private readonly chatModel: string;
  private readonly feedbackModel?: string;
  private readonly reportModel?: string;
  private readonly jsonModeEnabled: boolean;
  private readonly defaultTimeoutMs: number;
  private readonly questionTimeoutMs: number;
  private readonly feedbackTimeoutMs: number;
  private readonly reportTimeoutMs: number;
  private quotaBlockedUntil = 0;

  constructor(
    config: ConfigService,
    @Inject(OpenAIChatClient)
    private readonly chatClient = new OpenAIChatClient(config),
    @Inject(OpenAITranscriptionClient)
    private readonly transcriptionClient = new OpenAITranscriptionClient(
      config,
    ),
  ) {
    this.chatModel =
      config.get<string>('OPENAI_CHAT_MODEL') ?? 'google/gemma-4-e4b';
    this.feedbackModel = config.get<string>('OPENAI_FEEDBACK_MODEL');
    this.reportModel = config.get<string>('OPENAI_REPORT_MODEL');
    this.jsonModeEnabled = config.get<string>('OPENAI_JSON_MODE') === 'true';
    this.defaultTimeoutMs = Number(config.get('OPENAI_TIMEOUT_MS') ?? 30_000);
    this.questionTimeoutMs = Number(
      config.get('OPENAI_QUESTION_TIMEOUT_MS') ??
        Math.max(this.defaultTimeoutMs, 240_000),
    );
    this.feedbackTimeoutMs = Number(
      config.get('OPENAI_FEEDBACK_TIMEOUT_MS') ??
        Math.max(this.defaultTimeoutMs, 420_000),
    );
    this.reportTimeoutMs = Number(
      config.get('OPENAI_REPORT_TIMEOUT_MS') ??
        Math.max(this.defaultTimeoutMs, 600_000),
    );
  }

  getChatModel(task?: ChatTask): string {
    return this.resolveModel(task);
  }

  private isQuotaExceeded(error: unknown): boolean {
    if (!(error instanceof APIError)) return false;

    const body = error.error as Record<string, unknown> | undefined;
    return (
      body?.code === 'insufficient_quota' ||
      error.message.includes('exceeded your current quota')
    );
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    if (Date.now() < this.quotaBlockedUntil) {
      throw this.quotaExceededException();
    }

    for (
      let attempt = 0;
      attempt <= RATE_LIMIT_RETRY_DELAYS_MS.length;
      attempt++
    ) {
      try {
        return await fn();
      } catch (error) {
        if (error instanceof InterviewAIException) throw error;

        if (!(error instanceof APIError)) {
          throw new InterviewAIException(
            ErrorCode.AI_SERVICE_ERROR,
            HttpStatus.BAD_GATEWAY,
            `AI provider error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }

        if (error instanceof APIUserAbortError) {
          throw new InterviewAIException(
            ErrorCode.AI_TIMEOUT,
            HttpStatus.GATEWAY_TIMEOUT,
            'AI provider request timed out',
          );
        }

        if (error.status === 429 && this.isQuotaExceeded(error)) {
          this.quotaBlockedUntil = Date.now() + QUOTA_COOLDOWN_MS;
          throw this.quotaExceededException();
        }

        const delay = RATE_LIMIT_RETRY_DELAYS_MS[attempt];
        if (error.status === 429 && delay !== undefined) {
          this.logger.warn(
            `AI provider rate limited, retry ${attempt + 1}/${RATE_LIMIT_RETRY_DELAYS_MS.length} after ${delay}ms`,
          );
          await new Promise<void>((r) => setTimeout(r, delay));
          continue;
        }

        if (error.status === 429) {
          throw new InterviewAIException(
            ErrorCode.AI_RATE_LIMIT,
            HttpStatus.TOO_MANY_REQUESTS,
            `AI provider rate limit persists after ${RATE_LIMIT_RETRY_DELAYS_MS.length} retries.`,
          );
        }

        throw new InterviewAIException(
          ErrorCode.AI_SERVICE_ERROR,
          HttpStatus.BAD_GATEWAY,
          `AI provider API error ${error.status ?? 'unknown'}: ${error.message}`,
        );
      }
    }
    // unreachable — loop always returns or throws
    throw new InterviewAIException(
      ErrorCode.AI_SERVICE_ERROR,
      HttpStatus.BAD_GATEWAY,
      'Unexpected retry exit',
    );
  }

  private quotaExceededException(): InterviewAIException {
    return new InterviewAIException(
      ErrorCode.AI_QUOTA_EXCEEDED,
      HttpStatus.SERVICE_UNAVAILABLE,
      'AI provider quota exhausted. AI features are temporarily unavailable.',
    );
  }

  private tryParseJson(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  private removeTrailingCommas(value: string): string {
    return value.replace(/,\s*([}\]])/g, '$1');
  }

  private repairSingleQuotedJson(value: string): string | null {
    if (value.includes('"')) return null;

    let changed = false;
    const repaired = value.replace(
      /'([^'\\]*(?:\\.[^'\\]*)*)'/g,
      (_match, inner: string) => {
        changed = true;
        return JSON.stringify(
          inner.replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
        );
      },
    );

    return changed ? repaired : null;
  }

  private tryNormalizeJsonCandidate(
    content: string,
    source: JsonExtractionResult['source'],
  ): JsonExtractionResult | null {
    const candidate = content.trim();
    if (this.tryParseJson(candidate)) {
      return { content: candidate, source, repairApplied: [] };
    }

    const withoutTrailingCommas = this.removeTrailingCommas(candidate);
    if (
      withoutTrailingCommas !== candidate &&
      this.tryParseJson(withoutTrailingCommas)
    ) {
      return {
        content: withoutTrailingCommas,
        source,
        repairApplied: ['trailing_comma'],
      };
    }

    for (const singleQuoteCandidate of [candidate, withoutTrailingCommas]) {
      const repaired = this.repairSingleQuotedJson(singleQuoteCandidate);
      if (repaired && this.tryParseJson(repaired)) {
        const repairApplied =
          singleQuoteCandidate === withoutTrailingCommas &&
          withoutTrailingCommas !== candidate
            ? ['trailing_comma', 'single_quotes']
            : ['single_quotes'];
        return { content: repaired, source, repairApplied };
      }
    }

    return null;
  }

  private extractJsonContent(raw: string): JsonExtractionResult {
    const trimmed = raw.trim();
    const plain = this.tryNormalizeJsonCandidate(trimmed, 'plain');
    if (plain) {
      return plain;
    }

    const blockMatch = /```(?:json)?\s*\n?([\s\S]*?)\n?```/.exec(trimmed);
    if (blockMatch) {
      const fenced = this.tryNormalizeJsonCandidate(blockMatch[1], 'fence');
      if (fenced) {
        return fenced;
      }
    }

    const objMatch = /(\{[\s\S]*\})/.exec(trimmed);
    if (objMatch) {
      const embedded = this.tryNormalizeJsonCandidate(objMatch[1], 'embedded');
      if (embedded) {
        return embedded;
      }
    }

    return { content: raw, source: 'plain', repairApplied: [] };
  }

  private parseJsonContent(
    metadata: ChoiceMetadata,
    context: { task?: ChatTask; model: string },
  ): string {
    const extracted = this.extractJsonContent(metadata.content);
    if (this.tryParseJson(extracted.content)) {
      this.logger.debug(
        JSON.stringify({
          event: 'ai_json_output',
          task: context.task ?? 'unknown',
          model: context.model,
          finishReason: metadata.finishReason,
          rawLength: metadata.content.length,
          source: extracted.source,
          repairApplied: extracted.repairApplied,
          reasoningContentLength: metadata.reasoningContentLength,
        }),
      );
      return extracted.content;
    }

    const truncated = metadata.finishReason === 'length';
    this.logger.warn(
      JSON.stringify({
        event: 'ai_invalid_json',
        task: context.task ?? 'unknown',
        model: context.model,
        finishReason: metadata.finishReason,
        rawLength: metadata.content.length,
        source: extracted.source,
        repairApplied: extracted.repairApplied,
        reasoningContentLength: metadata.reasoningContentLength,
        kind: truncated ? 'truncated' : 'invalid',
      }),
    );
    throw new InterviewAIException(
      ErrorCode.AI_INVALID_JSON,
      HttpStatus.BAD_GATEWAY,
      `AI provider returned ${truncated ? 'truncated' : 'invalid'} JSON response`,
    );
  }

  private resolveModel(task?: ChatTask, explicitModel?: string): string {
    if (explicitModel) return explicitModel;
    if (task === 'feedback' && this.feedbackModel) return this.feedbackModel;
    if (task === 'report' && this.reportModel) return this.reportModel;
    return this.chatModel;
  }

  private getChoiceMetadata(response: unknown): ChoiceMetadata {
    const responseRecord = response as
      | {
          choices?: Array<{
            finish_reason?: unknown;
            message?: Record<string, unknown>;
          }>;
        }
      | undefined;
    const choice = responseRecord?.choices?.[0];
    const message = choice?.message;
    const content = typeof message?.content === 'string' ? message.content : '';
    const finishReason =
      typeof choice?.finish_reason === 'string'
        ? choice.finish_reason
        : 'unknown';
    const reasoningContent = message?.reasoning_content;
    const reasoningContentLength =
      typeof reasoningContent === 'string' ? reasoningContent.length : 0;

    return { content, finishReason, reasoningContentLength };
  }

  private emptyResponseException(
    metadata: ChoiceMetadata,
  ): InterviewAIException {
    return new InterviewAIException(
      ErrorCode.AI_EMPTY_RESPONSE,
      HttpStatus.BAD_GATEWAY,
      `AI provider returned empty final content (finish_reason=${metadata.finishReason}, reasoning_content_length=${metadata.reasoningContentLength})`,
    );
  }

  async chatCompletion(params: ChatCompletionParams): Promise<string> {
    const {
      messages,
      model,
      temperature,
      maxTokens,
      responseFormat,
      task,
      timeoutMs,
    } = params;
    const resolvedModel = this.resolveModel(task, model);
    let requestTimeoutMs: number;
    if (timeoutMs !== undefined) {
      requestTimeoutMs = timeoutMs;
    } else if (task === 'feedback') {
      requestTimeoutMs = this.feedbackTimeoutMs;
    } else if (task === 'question-generation') {
      requestTimeoutMs = this.questionTimeoutMs;
    } else if (task === 'report') {
      requestTimeoutMs = this.reportTimeoutMs;
    } else {
      requestTimeoutMs = this.defaultTimeoutMs;
    }

    return this.withRetry(async () => {
      const createCompletion = (tokens: number) =>
        this.chatClient.create(
          {
            model: resolvedModel,
            messages,
            temperature,
            maxTokens: tokens,
            responseFormat:
              responseFormat === 'json_object' && this.jsonModeEnabled
                ? 'json_object'
                : undefined,
          },
          requestTimeoutMs,
        );

      let effectiveMaxTokens = maxTokens;
      let response = await createCompletion(effectiveMaxTokens);
      let metadata = this.getChoiceMetadata(response);

      if (
        task === 'question-generation' &&
        !metadata.content &&
        metadata.finishReason === 'length'
      ) {
        effectiveMaxTokens = Math.max(
          maxTokens,
          QUESTION_TRUNCATED_RETRY_MAX_TOKENS,
        );
        this.logger.warn(
          `AI question generation returned empty final content with finish_reason=length; retrying once with max_tokens=${effectiveMaxTokens} (model=${resolvedModel}, reasoning_content_length=${metadata.reasoningContentLength})`,
        );
        response = await createCompletion(effectiveMaxTokens);
        metadata = this.getChoiceMetadata(response);
      }

      if (!metadata.content) {
        this.logger.warn(
          `AI provider returned empty final content (task=${task ?? 'unknown'}, model=${resolvedModel}, max_tokens=${effectiveMaxTokens}, finish_reason=${metadata.finishReason}, reasoning_content_length=${metadata.reasoningContentLength})`,
        );
        throw this.emptyResponseException(metadata);
      }

      return responseFormat === 'json_object'
        ? this.parseJsonContent(metadata, { task, model: resolvedModel })
        : metadata.content;
    });
  }

  async transcribe(params: TranscribeParams): Promise<TranscribeResult> {
    const { audioBuffer, mimeType, language, timeoutMs } = params;

    return this.withRetry(async () => {
      const response = await this.transcriptionClient.create(
        audioBuffer,
        mimeType,
        language,
        timeoutMs,
      );
      const responseRecord = response as unknown as Record<string, unknown>;
      const duration =
        typeof responseRecord.duration === 'number'
          ? responseRecord.duration
          : 0;
      return {
        text: response.text,
        durationSeconds: duration,
      };
    });
  }

  async generateStructured<T>(params: GenerateStructuredParams<T>): Promise<T> {
    const raw = await this.chatCompletion({
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      model: params.model,
      temperature: params.temperature ?? 0.2,
      maxTokens: params.maxTokens ?? 2000,
      responseFormat: 'json_object',
      task: params.task,
      timeoutMs: params.timeoutMs,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new InterviewAIException(
        ErrorCode.AI_INVALID_JSON,
        HttpStatus.BAD_GATEWAY,
        'Invalid JSON returned by AI provider',
      );
    }

    const validation = params.schema.safeParse(parsed);
    if (!validation.success) {
      this.logger.warn(
        `AI output schema validation failed: ${validation.error.message}`,
      );
      throw new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.BAD_GATEWAY,
        `AI response failed schema validation${params.schemaName ? ` for ${params.schemaName}` : ''}: ${validation.error.message}`,
      );
    }

    return validation.data;
  }

  async generateText(params: GenerateTextParams): Promise<string> {
    return this.chatCompletion({
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      model: params.model,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 2000,
      task: params.task,
      timeoutMs: params.timeoutMs,
    });
  }

  async transcribeAudio(
    params: TranscribeAudioParams,
  ): Promise<TranscribeResult> {
    return this.transcribe({
      audioBuffer: params.audioBuffer,
      mimeType: params.mimeType ?? 'audio/webm',
      language: params.language,
      timeoutMs: params.timeoutMs,
    });
  }
}
