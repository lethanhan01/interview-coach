import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import {
  type IAIGateway,
  type ChatTask,
  type ChatCompletionParams,
  type TranscribeParams,
  type TranscribeResult,
  type GenerateStructuredParams,
  type GenerateTextParams,
  type TranscribeAudioParams,
  type TranscribeWithMetricsResult,
  type SynthesizeSpeechParams,
  type SynthesizeSpeechResult,
} from './ai-gateway.interface';
import { OpenAIGateway } from './openai.gateway';
import { PythonAiClient } from './clients/python-ai.client';

@Injectable()
export class AIGatewayDispatcher implements IAIGateway {
  private readonly logger = new Logger(AIGatewayDispatcher.name);

  constructor(
    private readonly config: ConfigService,
    private readonly openAiGateway: OpenAIGateway,
    private readonly pythonAiClient: PythonAiClient,
  ) {}

  chatCompletion(params: ChatCompletionParams): Promise<string> {
    return this.openAiGateway.chatCompletion(params);
  }

  generateStructured<T>(params: GenerateStructuredParams<T>): Promise<T> {
    return this.openAiGateway.generateStructured(params);
  }

  generateText(params: GenerateTextParams): Promise<string> {
    return this.openAiGateway.generateText(params);
  }

  getChatModel(task?: ChatTask): string {
    return this.openAiGateway.getChatModel(task);
  }

  async transcribe(params: TranscribeParams): Promise<TranscribeResult> {
    const res = await this.transcribeWithMetrics({
      audioBuffer: params.audioBuffer,
      mimeType: params.mimeType,
      language: params.language,
      timeoutMs: params.timeoutMs,
    });
    return {
      text: res.text,
      durationSeconds: res.durationSeconds,
    };
  }

  async transcribeAudio(
    params: TranscribeAudioParams,
  ): Promise<TranscribeResult> {
    const res = await this.transcribeWithMetrics(params);
    return {
      text: res.text,
      durationSeconds: res.durationSeconds,
    };
  }

  private isWhisperFallbackAvailable(): boolean {
    const whisperBaseUrl = this.config.get<string>('WHISPER_BASE_URL');
    const whisperApiKey = this.config.get<string>('WHISPER_API_KEY');
    const openaiBaseUrl = this.config.get<string>('OPENAI_BASE_URL');
    const openaiApiKey = this.config.get<string>('OPENAI_API_KEY');

    if (whisperBaseUrl || whisperApiKey) {
      return true;
    }

    // Nếu OPENAI_BASE_URL trỏ vào LM Studio thì không có Whisper server
    if (
      openaiBaseUrl &&
      (openaiBaseUrl.includes(':1234') ||
        openaiBaseUrl.includes('localhost:1234') ||
        openaiBaseUrl.includes('127.0.0.1:1234'))
    ) {
      return false;
    }

    // Nếu API key là chuỗi lm-studio mà không có endpoint Whisper riêng
    if (openaiApiKey === 'lm-studio') {
      return false;
    }

    return true;
  }

  async transcribeWithMetrics(
    params: TranscribeAudioParams,
  ): Promise<TranscribeWithMetricsResult> {
    const sttProvider = this.config.get<string>('AI_STT_PROVIDER') ?? 'python';
    const fallbackEnabled =
      this.config.get<string>('AI_FALLBACK_ENABLED') !== 'false';

    if (sttProvider === 'python') {
      try {
        return await this.pythonAiClient.transcribe(params);
      } catch (error) {
        // 1. Không bao giờ fallback khi gặp lỗi nghiệp vụ / client error (HTTP 4xx)
        if (
          error instanceof InterviewAIException &&
          error.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR
        ) {
          throw error;
        }

        // 2. Kiểm tra nếu fallback bị tắt hoặc không có cấu hình Whisper server hợp lệ
        if (!fallbackEnabled || !this.isWhisperFallbackAvailable()) {
          this.logger.warn(
            `Python STT failed (${(error as Error).message}), fallback unavailable or disabled. Propagating original error.`,
          );
          throw error;
        }

        this.logger.warn(
          `Python STT failed, falling back to OpenAI Whisper: ${(error as Error).message}`,
        );
        return this.openAiGateway.transcribeWithMetrics(params);
      }
    }

    if (sttProvider === 'openai') {
      return this.openAiGateway.transcribeWithMetrics(params);
    }

    if (sttProvider === 'disabled') {
      throw new InterviewAIException(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Speech-to-text service is currently disabled',
      );
    }

    throw new InterviewAIException(
      ErrorCode.AI_SERVICE_UNAVAILABLE,
      HttpStatus.BAD_GATEWAY,
      `Unsupported STT provider: ${sttProvider}`,
    );
  }

  async synthesizeSpeech(
    params: SynthesizeSpeechParams,
  ): Promise<SynthesizeSpeechResult> {
    const ttsProvider = this.config.get<string>('AI_TTS_PROVIDER') ?? 'python';

    if (ttsProvider === 'python') {
      return this.pythonAiClient.synthesizeSpeech(params);
    }

    if (ttsProvider === 'disabled') {
      throw new InterviewAIException(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Text-to-speech service is currently disabled',
      );
    }

    throw new InterviewAIException(
      ErrorCode.AI_SERVICE_UNAVAILABLE,
      HttpStatus.BAD_GATEWAY,
      `Unsupported TTS provider: ${ttsProvider}`,
    );
  }
}
