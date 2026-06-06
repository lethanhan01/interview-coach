import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

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
    return response.choices[0]?.message?.content ?? '';
  }

  async transcribe(params: TranscribeParams): Promise<TranscribeResult> {
    const { audioBuffer, mimeType, language, timeoutMs } = params;
    const ext = mimeType === 'audio/webm' ? 'webm' : mimeType === 'audio/mp4' ? 'mp4' : 'wav';
    const file = new File([audioBuffer], `audio.${ext}`, { type: mimeType });
    const response = await this.client.audio.transcriptions.create(
      {
        file,
        model: 'whisper-1',
        language,
        response_format: 'verbose_json',
      },
      timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : undefined,
    );
    return {
      text: response.text,
      durationSeconds: (response as unknown as { duration?: number }).duration ?? 0,
    };
  }
}
