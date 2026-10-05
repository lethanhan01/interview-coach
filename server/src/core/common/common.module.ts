import { Global, Module } from '@nestjs/common';
import { SseService } from '@infra/realtime/redis/sse.service';
import { AppLogger } from './services/app-logger.service';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';

@Global()
@Module({
  providers: [SseService, AppLogger, IdempotencyInterceptor],
  exports: [SseService, AppLogger, IdempotencyInterceptor],
})
export class CommonModule {}
