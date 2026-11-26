import { Module } from '@nestjs/common';
import { AiModule } from '@infra/ai/ai.module';
import { VoiceMetricsService } from './voice-metrics.service';
import { MediaFacade } from './contracts/media-facade.service';
import { MediaController } from './media.controller';

@Module({
  imports: [AiModule],
  controllers: [MediaController],
  providers: [VoiceMetricsService, MediaFacade],
  exports: [VoiceMetricsService, MediaFacade],
})
export class MediaModule {}
