import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { APIError } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';

interface ChatCompletionParams {
  messages: ChatCompletionMessageParam[];
  model: 'gpt-4o';
  temperature: number;
  maxTokens: number;
  responseFormat?: 'json_object';
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

@Injectable()
export class OpenAIGateway {
  private readonly client: OpenAI;
  private readonly logger = new Logger(OpenAIGateway.name);
  private quotaBlockedUntil = 0;

  constructor(config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.getOrThrow<string>('OPENAI_API_KEY'),
      maxRetries: 0, // retries managed here to distinguish quota vs rate limit
    });
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
        if (!(error instanceof APIError)) throw error;

        if (error.status === 429 && this.isQuotaExceeded(error)) {
          this.quotaBlockedUntil = Date.now() + QUOTA_COOLDOWN_MS;
          throw this.quotaExceededException();
        }

        const delay = RATE_LIMIT_RETRY_DELAYS_MS[attempt];
        if (error.status === 429 && delay !== undefined) {
          this.logger.warn(
            `OpenAI rate limited, retry ${attempt + 1}/${RATE_LIMIT_RETRY_DELAYS_MS.length} after ${delay}ms`,
          );
          await new Promise<void>((r) => setTimeout(r, delay));
          continue;
        }

        if (error.status === 429) {
          throw new InterviewAIException(
            ErrorCode.AI_RATE_LIMIT,
            HttpStatus.TOO_MANY_REQUESTS,
            `OpenAI rate limit persists after ${RATE_LIMIT_RETRY_DELAYS_MS.length} retries.`,
          );
        }

        throw new InterviewAIException(
          ErrorCode.AI_SERVICE_ERROR,
          HttpStatus.BAD_GATEWAY,
          `OpenAI API error ${error.status ?? 'unknown'}: ${error.message}`,
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
      'OpenAI quota exhausted — add billing credits to resume AI features.',
    );
  }

  async chatCompletion(params: ChatCompletionParams): Promise<string> {
    const {
      messages,
      model,
      temperature,
      maxTokens,
      responseFormat,
      timeoutMs,
    } = params;

    return this.withRetry(async () => {
      const response = await this.client.chat.completions.create(
        {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          ...(responseFormat === 'json_object'
            ? { response_format: { type: 'json_object' } }
            : {}),
        },
        timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : undefined,
      );
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new InterviewAIException(
          ErrorCode.AI_SERVICE_ERROR,
          HttpStatus.BAD_GATEWAY,
          'OpenAI returned empty response',
        );
      }
      return content;
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
      const response = await this.client.audio.transcriptions.create(
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
