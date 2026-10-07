import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAITranscriptionClient {
  private readonly client: OpenAI;

  constructor(config: ConfigService) {
    const whisperBaseUrl = config.get<string>('WHISPER_BASE_URL');
    const openaiBaseUrl = config.get<string>('OPENAI_BASE_URL');
    const whisperApiKey = config.get<string>('WHISPER_API_KEY');
    const openaiApiKey = config.get<string>('OPENAI_API_KEY');

    // Do NOT inherit LM Studio URL for Whisper Client
    let baseURL: string | undefined = whisperBaseUrl;
    if (
      !baseURL &&
      openaiBaseUrl &&
      !openaiBaseUrl.includes(':1234') &&
      !openaiBaseUrl.includes('localhost:1234') &&
      !openaiBaseUrl.includes('127.0.0.1:1234')
    ) {
      baseURL = openaiBaseUrl;
    }

    const apiKey =
      whisperApiKey ||
      (baseURL ? 'whisper-api-key' : openaiApiKey) ||
      'dummy-whisper-key';

    this.client = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
      maxRetries: 0,
    });
  }

  create(
    audioBuffer: Buffer,
    mimeType: 'audio/webm' | 'audio/mp4' | 'audio/wav',
    language?: 'vi' | 'en',
    timeoutMs?: number,
  ) {
    const extension =
      mimeType === 'audio/webm'
        ? 'webm'
        : mimeType === 'audio/mp4'
          ? 'mp4'
          : 'wav';
    const file = new File(
      [
        audioBuffer.buffer.slice(
          audioBuffer.byteOffset,
          audioBuffer.byteOffset + audioBuffer.byteLength,
        ) as ArrayBuffer,
      ],
      `audio.${extension}`,
      { type: mimeType },
    );

    return this.client.audio.transcriptions.create(
      { file, model: 'whisper-1', language, response_format: 'verbose_json' },
      timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : undefined,
    );
  }
}
