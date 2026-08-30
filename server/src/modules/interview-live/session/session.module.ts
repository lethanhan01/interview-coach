import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { CreateInterviewSession } from './create-interview-session.service';
import { ChangeInterviewSessionStatus } from './change-interview-session-status.service';
import { SessionLifecyclePolicy } from './session-lifecycle.policy';
import { SseTokenGuard } from '../../../auth/guards/sse-token.guard';
import {
  QUESTION_GEN_QUEUE,
  QUEUE_DEFAULT_JOB_OPTIONS,
} from '@core/common/constants/queue.constants';
import { ReportModule } from '../../../report/report.module';
import { AuthModule } from '../../../auth/auth.module';
import { AssessmentModule } from '../../../assessment/assessment.module';
import { WorkflowModule } from '@infra/workflow/workflow.module';

import { HrInterviewStrategy } from './hr-interview.strategy';
import { TechnicalInterviewStrategy } from './technical-interview.strategy';
import { SessionStrategyRegistry } from './session-strategy.registry';

@Module({
  imports: [
    ReportModule,
    AuthModule,
    AssessmentModule,
    WorkflowModule,
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
