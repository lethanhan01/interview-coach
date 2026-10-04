import { Global, Module } from '@nestjs/common';
import { SseService } from '@infra/realtime/redis/sse.service';

@Global()
@Module({
  providers: [SseService],
  exports: [SseService],
})
export class CommonModule {}
