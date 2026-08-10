import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { InterviewModule } from '../interview/interview.module';
import { QuestionModule } from '../question/question.module';
import {
  FEEDBACK_QUEUE,
  TRANSCRIPTION_QUEUE,
} from '../common/constants/queue.constants';
import { TurnController } from './turn.controller';
import { TurnService } from './turn.service';

@Module({
  imports: [
    AuthModule,
    InterviewModule,
    QuestionModule,
    BullModule.registerQueue({ name: FEEDBACK_QUEUE }),
    BullModule.registerQueue({ name: TRANSCRIPTION_QUEUE }),
  ],
  controllers: [TurnController],
  providers: [
    TurnService,
  ],
})
export class TurnModule {}
