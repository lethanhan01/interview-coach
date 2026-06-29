import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { SseTokenGuard } from '../auth/guards/sse-token.guard';
import { QUESTION_GEN_QUEUE } from '../common/constants/queue.constants';
import { ReportModule } from '../report/report.module';

@Module({
  imports: [
    ReportModule,
    BullModule.registerQueue({ name: QUESTION_GEN_QUEUE }),
  ],
  controllers: [SessionController],
  providers: [SessionService, SseTokenGuard],
  exports: [SessionService],
})
export class SessionModule {}
