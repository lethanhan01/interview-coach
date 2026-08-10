import { Global, Module } from '@nestjs/common';
import { SseService } from '../infrastructure/realtime/redis/sse.service';

@Global()
@Module({
  providers: [SseService],
  exports: [SseService],
})
export class CommonModule {}
