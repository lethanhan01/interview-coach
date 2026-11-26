import { Injectable, Inject } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  VoiceMetricsService,
  type VoiceMetrics,
} from '../voice-metrics.service';
import {
  AI_GATEWAY_TOKEN,
  type IAIGateway,
} from '@infra/ai/ai-gateway.interface';
import { TranscribeResponseDto } from '../dto/transcribe-response.dto';

@Injectable()
export class MediaFacade {
  constructor(
    private readonly voiceMetricsService: VoiceMetricsService,
    @Inject(AI_GATEWAY_TOKEN)
    private readonly aiGateway: IAIGateway,
  ) {}

  calculateVoiceMetrics(text: string, durationSeconds: number): VoiceMetrics {
    return this.voiceMetricsService.calculate(text, durationSeconds);
  }

  async transcribeAudio(
    file: Express.Multer.File,
    language?: 'vi' | 'en',
  ): Promise<TranscribeResponseDto> {
    const result = await this.aiGateway.transcribeWithMetrics({
      audioBuffer: file.buffer,
      mimeType: file.mimetype,
      language,
    });
    return plainToInstance(TranscribeResponseDto, result);
  }

  async synthesizeSpeech(
    text: string,
    language?: 'vi' | 'en',
  ): Promise<{ stream: NodeJS.ReadableStream; contentType: string }> {
    return this.aiGateway.synthesizeSpeech({ text, language });
  }
}
