import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { CreateInterviewSession } from './create-interview-session.service';
import { ChangeInterviewSessionStatus } from './change-interview-session-status.service';
import { SessionLifecyclePolicy } from './session-lifecycle.policy';
import { SseTokenGuard } from '@modules/auth/guards/sse-token.guard';
import {
  QUESTION_GEN_QUEUE,
  QUEUE_DEFAULT_JOB_OPTIONS,
} from '@core/common/constants/queue.constants';
import { AuthModule } from '@modules/auth/auth.module';
import { EvaluationModule } from '@modules/interview-assessment/evaluation/evaluation.module';
import { WorkflowModule } from '@infra/workflow/workflow.module';
import { OnetModule } from '@modules/onet/onet.module';
import { SfiaModule } from '@modules/sfia/sfia.module';

import { HrInterviewStrategy } from './hr-interview.strategy';
import { TechnicalInterviewStrategy } from './technical-interview.strategy';
import { SessionStrategyRegistry } from './session-strategy.registry';

@Module({
  imports: [
    AuthModule,
    EvaluationModule,
    WorkflowModule,
    OnetModule,
    SfiaModule,
    BullModule.registerQueue({
      name: QUESTION_GEN_QUEUE,
      defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[QUESTION_GEN_QUEUE],
    }),
  ],
  controllers: [SessionController],
  providers: [
    SessionService,
    CreateInterviewSession,
    ChangeInterviewSessionStatus,
    SessionLifecyclePolicy,
    SseTokenGuard,
    HrInterviewStrategy,
    TechnicalInterviewStrategy,
    SessionStrategyRegistry,
  ],
  exports: [SessionService, SessionStrategyRegistry],
})
export class SessionModule {}
