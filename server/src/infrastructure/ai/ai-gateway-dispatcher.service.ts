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
        if (!fallbackEnabled) {
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
