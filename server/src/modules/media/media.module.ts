import { Module } from '@nestjs/common';
import { VoiceMetricsService } from './voice-metrics.service';
import { MediaFacade } from './contracts/media-facade.service';

@Module({
  providers: [VoiceMetricsService, MediaFacade],
  exports: [VoiceMetricsService, MediaFacade],
})
export class MediaModule {}
