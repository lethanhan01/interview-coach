import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAITranscriptionClient {
  private readonly client: OpenAI;

  constructor(config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.get<string>('OPENAI_API_KEY') ?? 'lm-studio',
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
