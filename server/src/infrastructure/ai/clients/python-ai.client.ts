import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import type {
  TranscribeAudioParams,
  TranscribeWithMetricsResult,
  SynthesizeSpeechParams,
  SynthesizeSpeechResult,
} from '../ai-gateway.interface';

@Injectable()
export class PythonAiClient {
  private readonly logger = new Logger(PythonAiClient.name);
  private readonly baseUrl: string;
  private readonly internalSecret: string;
  private readonly defaultTimeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (
      config.get<string>('AI_SERVICE_URL') ?? 'http://localhost:8000'
    ).replace(/\/+$/, '');
    this.internalSecret =
      config.get<string>('INTERNAL_AI_SECRET') ?? 'dev-secret-internal-ai-key';
    this.defaultTimeoutMs = 8000;
  }

  async transcribe(
    params: TranscribeAudioParams,
  ): Promise<TranscribeWithMetricsResult> {
    const timeoutMs = params.timeoutMs ?? this.defaultTimeoutMs;
    const url = `${this.baseUrl}/api/v1/stt/transcribe`;
    const mimeType = params.mimeType || 'audio/webm';
    const filename = this.resolveFilename(mimeType);

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(params.audioBuffer)], {
      type: mimeType,
    });
    formData.append('file', blob, filename);

    if (params.language) {
      formData.append('language', params.language);
    }

    const requestId = randomUUID();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-internal-secret': this.internalSecret,
          'x-request-id': requestId,
          'x-correlation-id': requestId,
        },
        body: formData,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        await this.handleHttpError(response, 'Python STT');
      }

      const data = (await response.json()) as TranscribeWithMetricsResult;
      return data;
    } catch (error) {
      if (error instanceof InterviewAIException) {
        throw error;
      }
      this.logger.error(
        `Failed to call Python STT service at ${url}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InterviewAIException(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        HttpStatus.BAD_GATEWAY,
        `AI speech service unreachable: ${(error as Error).message}`,
        { cause: error },
      );
    }
  }

  async synthesizeSpeech(
    params: SynthesizeSpeechParams,
  ): Promise<SynthesizeSpeechResult> {
    const url = `${this.baseUrl}/api/v1/tts/synthesize`;
    const requestId = randomUUID();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': this.internalSecret,
          'x-request-id': requestId,
          'x-correlation-id': requestId,
        },
        body: JSON.stringify({
          text: params.text,
          language: params.language,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        await this.handleHttpError(response, 'Python TTS');
      }

      const contentType =
        response.headers.get('content-type') || 'audio/wav';

      if (!response.body) {
        throw new InterviewAIException(
          ErrorCode.AI_SERVICE_UNAVAILABLE,
          HttpStatus.BAD_GATEWAY,
          'Python TTS service returned empty response stream',
        );
      }

      const stream = Readable.fromWeb(response.body as any);

      return {
        stream,
        contentType,
      };
    } catch (error) {
      if (error instanceof InterviewAIException) {
        throw error;
      }
      this.logger.error(
        `Failed to call Python TTS service at ${url}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InterviewAIException(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        HttpStatus.BAD_GATEWAY,
        `AI speech synthesis service unreachable: ${(error as Error).message}`,
        { cause: error },
      );
    }
  }

  private resolveFilename(mimeType: string): string {
    if (mimeType.includes('wav')) return 'audio.wav';
    if (mimeType.includes('mp4') || mimeType.includes('m4a'))
      return 'audio.mp4';
    if (mimeType.includes('ogg')) return 'audio.ogg';
    if (mimeType.includes('mpeg') || mimeType.includes('mp3'))
      return 'audio.mp3';
    return 'audio.webm';
  }

  private async handleHttpError(
    response: Response,
    serviceName: string,
  ): Promise<never> {
    let errorCode = ErrorCode.AI_SERVICE_UNAVAILABLE;
    let message = `${serviceName} request failed with HTTP ${response.status}`;
    let details: unknown;

    try {
      const body = (await response.json()) as {
        error?: { code?: string; message?: string; details?: unknown };
      };
      if (body?.error?.message) {
        message = body.error.message;
      }
      if (body?.error?.details) {
        details = body.error.details;
      }
    } catch (parseError) {
      this.logger.debug(
        `Failed to parse error response body as JSON: ${(parseError as Error).message}`,
      );
    }

    let status = HttpStatus.BAD_GATEWAY;
    if (response.status === 400) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = ErrorCode.VALIDATION_ERROR;
    } else if (response.status === 401 || response.status === 403) {
      status = HttpStatus.FORBIDDEN;
      errorCode = ErrorCode.FORBIDDEN;
    } else if (response.status === 413) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      errorCode = ErrorCode.PAYLOAD_TOO_LARGE;
    } else if (response.status === 415) {
      status = HttpStatus.UNSUPPORTED_MEDIA_TYPE;
      errorCode = ErrorCode.UNSUPPORTED_MEDIA_TYPE;
    } else if (response.status === 422) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      errorCode = ErrorCode.VALIDATION_ERROR;
    }

    throw new InterviewAIException(errorCode, status, message, { details });
  }
}
