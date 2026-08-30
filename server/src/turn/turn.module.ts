import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { InterviewModule } from '../interview/interview.module';
import { QuestionCriteriaModule } from '../question-criteria/question-criteria.module';
import {
  FEEDBACK_QUEUE,
  QUEUE_DEFAULT_JOB_OPTIONS,
  TRANSCRIPTION_QUEUE,
} from '../common/constants/queue.constants';
import { TurnController } from './turn.controller';
import { TurnService } from './turn.service';
import { TurnAnswerContext } from './turn-answer-context.service';
import { SubmitTurnAnswer } from './submit-turn-answer.service';
import { TextAnswerIntakeHandler } from './text-answer-intake.handler';
import { VoiceAnswerIntakeHandler } from './voice-answer-intake.handler';
import { AnswerIntakeRegistry } from './answer-intake.registry';

@Module({
  imports: [
    AuthModule,
    InterviewModule,
    QuestionCriteriaModule,
    BullModule.registerQueue({
      name: FEEDBACK_QUEUE,
      defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[FEEDBACK_QUEUE],
    }),
    BullModule.registerQueue({
      name: TRANSCRIPTION_QUEUE,
      defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[TRANSCRIPTION_QUEUE],
    }),
  ],
  controllers: [TurnController],
  providers: [
    TurnService,
    TurnAnswerContext,
    TextAnswerIntakeHandler,
    VoiceAnswerIntakeHandler,
    AnswerIntakeRegistry,
    SubmitTurnAnswer,
  ],
  exports: [TurnService, AnswerIntakeRegistry],
})
export class TurnModule {}
