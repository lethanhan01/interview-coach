import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
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

@Injectable()
export class OpenAIGateway {
  private readonly client: OpenAI;

  constructor(config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  async chatCompletion(params: ChatCompletionParams): Promise<string> {
    const { messages, model, temperature, maxTokens, responseFormat, timeoutMs } = params;
    const response = await this.client.chat.completions.create(
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat === 'json_object' ? { response_format: { type: 'json_object' } } : {}),
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
  }

  async transcribe(params: TranscribeParams): Promise<TranscribeResult> {
    const { audioBuffer, mimeType, language, timeoutMs } = params;
    const ext = mimeType === 'audio/webm' ? 'webm' : mimeType === 'audio/mp4' ? 'mp4' : 'wav';
    const file = new File([audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength) as ArrayBuffer], `audio.${ext}`, { type: mimeType });
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
    const duration = typeof responseRecord.duration === 'number' ? responseRecord.duration : 0;
    return {
      text: response.text,
      durationSeconds: duration,
    };
  }
}
