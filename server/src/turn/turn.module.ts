import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import {
  FOLLOW_UP_QUEUE,
  FEEDBACK_QUEUE,
  TRANSCRIPTION_QUEUE,
} from '../common/constants/queue.constants';
import { TurnController } from './turn.controller';
import { TurnService } from './turn.service';
import { FollowUpCoordinatorService } from './follow-up-coordinator.service';
import { AudioStorageService } from './audio-storage.service';

@Module({
  imports: [
    AuthModule,
    AiModule,
    BullModule.registerQueue({ name: FOLLOW_UP_QUEUE }),
    BullModule.registerQueue({ name: FEEDBACK_QUEUE }),
    BullModule.registerQueue({ name: TRANSCRIPTION_QUEUE }),
  ],
  controllers: [TurnController],
  providers: [TurnService, FollowUpCoordinatorService, AudioStorageService],
})
export class TurnModule {}
