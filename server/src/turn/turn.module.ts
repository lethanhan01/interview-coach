import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InterviewModule } from '../interview/interview.module';
import { QuestionCriteriaModule } from '../question-criteria/question-criteria.module';
import { WorkflowModule } from '@infra/workflow/workflow.module';
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
    WorkflowModule,
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
