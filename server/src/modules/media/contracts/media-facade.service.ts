import { Injectable } from '@nestjs/common';
import {
  VoiceMetricsService,
  type VoiceMetrics,
} from '../voice-metrics.service';

@Injectable()
export class MediaFacade {
  constructor(private readonly voiceMetricsService: VoiceMetricsService) {}

  calculateVoiceMetrics(text: string, durationSeconds: number): VoiceMetrics {
    return this.voiceMetricsService.calculate(text, durationSeconds);
  }
}
