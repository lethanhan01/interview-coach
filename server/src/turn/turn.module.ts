import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { QuestionCriteriaModule } from '../question-criteria/question-criteria.module';
import {
  FEEDBACK_QUEUE,
  TRANSCRIPTION_QUEUE,
} from '../common/constants/queue.constants';
import { TurnController } from './turn.controller';
import { TurnService } from './turn.service';
import { AudioStorageService } from './audio-storage.service';
import { WhisperService } from './whisper.service';
import { VoiceMetricsService } from './voice-metrics.service';

@Module({
  imports: [
    AuthModule,
    AiModule,
    QuestionCriteriaModule,
    BullModule.registerQueue({ name: FEEDBACK_QUEUE }),
    BullModule.registerQueue({ name: TRANSCRIPTION_QUEUE }),
  ],
  controllers: [TurnController],
  providers: [
    TurnService,
    AudioStorageService,
    WhisperService,
    VoiceMetricsService,
  ],
})
export class TurnModule {}
