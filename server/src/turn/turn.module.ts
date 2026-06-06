import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { FOLLOW_UP_QUEUE, FEEDBACK_QUEUE } from '../common/constants/queue.constants';
import { TurnController } from './turn.controller';
import { TurnService } from './turn.service';
import { WhisperService } from './whisper.service';
import { VoiceMetricsService } from './voice-metrics.service';
import { FollowUpCoordinatorService } from './follow-up-coordinator.service';

@Module({
  imports: [
    AuthModule,
    AiModule,
    BullModule.registerQueue({ name: FOLLOW_UP_QUEUE }),
    BullModule.registerQueue({ name: FEEDBACK_QUEUE }),
  ],
  controllers: [TurnController],
  providers: [
    TurnService,
    WhisperService,
    VoiceMetricsService,
    FollowUpCoordinatorService,
  ],
})
export class TurnModule {}
