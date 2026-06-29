import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { APIError, APIUserAbortError } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';

interface ChatCompletionParams {
  messages: ChatCompletionMessageParam[];
  model?: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: 'json_object';
  task?: 'question-generation' | 'feedback' | 'report';
  timeoutMs?: number;
}

interface TranscribeParams {
  audioBuffer: Buffer;
  mimeType: 'audio/webm' | 'audio/mp4' | 'audio/wav';
  language?: 'vi' | 'en';
  timeoutMs?: number;
}

interface TranscribeResult {
  text: string;
  durationSeconds: number;
}

// Retry delays for transient rate limits only (not quota exhaustion)
const RATE_LIMIT_RETRY_DELAYS_MS = [1000, 2000];
const QUOTA_COOLDOWN_MS = 60_000;
const QUESTION_TRUNCATED_RETRY_MAX_TOKENS = 3600;

interface ChoiceMetadata {
  content: string;
  finishReason: string;
  reasoningContentLength: number;
}

@Injectable()
export class OpenAIGateway {
  private readonly chatClient: OpenAI;
  private readonly audioClient: OpenAI;
  private readonly logger = new Logger(OpenAIGateway.name);
  private readonly chatModel: string;
  private readonly jsonModeEnabled: boolean;
  private readonly defaultTimeoutMs: number;
  private readonly questionTimeoutMs: number;
  private readonly feedbackTimeoutMs: number;
  private readonly reportTimeoutMs: number;
  private quotaBlockedUntil = 0;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY') ?? 'lm-studio';
    const chatBaseURL =
      config.get<string>('OPENAI_BASE_URL') ?? 'http://127.0.0.1:1234/v1';

    this.chatModel =
      config.get<string>('OPENAI_CHAT_MODEL') ?? 'google/gemma-4-e4b';
    this.jsonModeEnabled = config.get<string>('OPENAI_JSON_MODE') === 'true';
    this.defaultTimeoutMs = Number(config.get('OPENAI_TIMEOUT_MS') ?? 30_000);
    this.questionTimeoutMs = Number(
      config.get('OPENAI_QUESTION_TIMEOUT_MS') ??
        Math.max(this.defaultTimeoutMs, 120_000),
    );
    this.feedbackTimeoutMs = Number(
      config.get('OPENAI_FEEDBACK_TIMEOUT_MS') ??
        Math.max(this.defaultTimeoutMs, 180_000),
    );
    this.reportTimeoutMs = Number(
      config.get('OPENAI_REPORT_TIMEOUT_MS') ??
        Math.max(this.defaultTimeoutMs, 180_000),
    );

    this.chatClient = new OpenAI({
      apiKey,
      baseURL: chatBaseURL,
      maxRetries: 0, // retries managed here to distinguish quota vs rate limit
    });
    this.audioClient = new OpenAI({
      apiKey,
      maxRetries: 0, // retries managed here to distinguish quota vs rate limit
    });
  }

  getChatModel(): string {
    return this.chatModel;
  }

  private isQuotaExceeded(error: APIError): boolean {
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

  private extractJsonContent(raw: string): string {
    const trimmed = raw.trim();
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      // Keep scanning for fenced or embedded JSON below.
    }
    const blockMatch = /```(?:json)?\s*\n?([\s\S]*?)\n?```/.exec(trimmed);
    if (blockMatch) {
      const inner = blockMatch[1].trim();
      try {
        JSON.parse(inner);
        return inner;
      } catch {
        // Fenced content was not pure JSON; try embedded object extraction.
      }
    }
    const objMatch = /(\{[\s\S]*\})/.exec(trimmed);
    if (objMatch) {
      try {
        JSON.parse(objMatch[1]);
        return objMatch[1];
      } catch {
        // Fall back to the raw content so the caller can classify the error.
      }
    }
    return raw;
  }

  private parseJsonContent(metadata: ChoiceMetadata): string {
    const extracted = this.extractJsonContent(metadata.content);
    try {
      JSON.parse(extracted);
      return extracted;
    } catch {
      const truncated = metadata.finishReason === 'length';
      this.logger.warn(
        `AI provider returned ${
          truncated ? 'truncated' : 'invalid'
        } JSON (finish_reason=${metadata.finishReason}, content_length=${
          metadata.content.length
        }, reasoning_content_length=${
          metadata.reasoningContentLength
        }): ${metadata.content.slice(0, 300)}`,
      );
      throw new InterviewAIException(
        ErrorCode.AI_INVALID_JSON,
        HttpStatus.BAD_GATEWAY,
        `AI provider returned ${
          truncated ? 'truncated' : 'invalid'
        } JSON response`,
      );
    }
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
      model = this.chatModel,
      temperature,
      maxTokens,
      responseFormat,
      task,
      timeoutMs,
    } = params;
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
        this.chatClient.chat.completions.create(
          {
            model,
            messages,
            temperature,
            max_tokens: tokens,
            ...(responseFormat === 'json_object' && this.jsonModeEnabled
              ? { response_format: { type: 'json_object' } }
              : {}),
          },
          requestTimeoutMs
            ? { signal: AbortSignal.timeout(requestTimeoutMs) }
            : undefined,
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
          `AI question generation returned empty final content with finish_reason=length; retrying once with max_tokens=${effectiveMaxTokens} (model=${model}, reasoning_content_length=${metadata.reasoningContentLength})`,
        );
        response = await createCompletion(effectiveMaxTokens);
        metadata = this.getChoiceMetadata(response);
      }

      if (!metadata.content) {
        this.logger.warn(
          `AI provider returned empty final content (task=${task ?? 'unknown'}, model=${model}, max_tokens=${effectiveMaxTokens}, finish_reason=${metadata.finishReason}, reasoning_content_length=${metadata.reasoningContentLength})`,
        );
        throw this.emptyResponseException(metadata);
      }

      return responseFormat === 'json_object'
        ? this.parseJsonContent(metadata)
        : metadata.content;
    });
  }

  async transcribe(params: TranscribeParams): Promise<TranscribeResult> {
    const { audioBuffer, mimeType, language, timeoutMs } = params;

    const ext =
      mimeType === 'audio/webm'
        ? 'webm'
        : mimeType === 'audio/mp4'
          ? 'mp4'
          : 'wav';

    return this.withRetry(async () => {
      const file = new File(
        [
          audioBuffer.buffer.slice(
            audioBuffer.byteOffset,
            audioBuffer.byteOffset + audioBuffer.byteLength,
          ) as ArrayBuffer,
        ],
        `audio.${ext}`,
        { type: mimeType },
      );
      const response = await this.audioClient.audio.transcriptions.create(
        {
          file,
          model: 'whisper-1',
          language,
          response_format: 'verbose_json',
        },
        timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : undefined,
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
}
