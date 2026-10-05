import { Global, Module } from '@nestjs/common';
import { SseService } from '@infra/realtime/redis/sse.service';
import { AppLogger } from './services/app-logger.service';

@Global()
@Module({
  providers: [SseService, AppLogger],
  exports: [SseService, AppLogger],
})
export class CommonModule {}
