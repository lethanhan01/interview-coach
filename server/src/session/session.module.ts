import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { SseService } from '../common/services/sse.service';
import { SseTokenGuard } from '../auth/guards/sse-token.guard';
import {
  QUESTION_GEN_QUEUE,
  REPORT_QUEUE,
} from '../common/constants/queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUESTION_GEN_QUEUE }),
    BullModule.registerQueue({ name: REPORT_QUEUE }),
  ],
  controllers: [SessionController],
  providers: [SessionService, SseService, SseTokenGuard],
  exports: [SessionService],
})
export class SessionModule {}
