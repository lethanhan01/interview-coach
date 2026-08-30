import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { Chat } from 'openai/resources/chat/chat';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface OpenAIChatCompletionParams {
  messages: ChatCompletionMessageParam[];
  model: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: 'json_object';
}

@Injectable()
export class OpenAIChatClient {
  readonly chat: Chat;

  constructor(config: ConfigService) {
    this.chat = new OpenAI({
      apiKey: config.get<string>('OPENAI_API_KEY') ?? 'lm-studio',
      baseURL:
        config.get<string>('OPENAI_BASE_URL') ?? 'http://127.0.0.1:1234/v1',
      maxRetries: 0,
    }).chat;
  }

  create(params: OpenAIChatCompletionParams, timeoutMs?: number) {
    return this.chat.completions.create(
      {
        model: params.model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        ...(params.responseFormat === 'json_object'
          ? { response_format: { type: 'json_object' as const } }
          : {}),
      },
      timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : undefined,
    );
  }
}
