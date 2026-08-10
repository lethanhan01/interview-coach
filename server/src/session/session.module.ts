import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { CreateInterviewSession } from './create-interview-session.service';
import { ChangeInterviewSessionStatus } from './change-interview-session-status.service';
import { SessionLifecyclePolicy } from './session-lifecycle.policy';
import { SseTokenGuard } from '../auth/guards/sse-token.guard';
import {
  QUESTION_GEN_QUEUE,
  QUEUE_DEFAULT_JOB_OPTIONS,
} from '../common/constants/queue.constants';
import { ReportModule } from '../report/report.module';
import { AuthModule } from '../auth/auth.module';
import { AssessmentModule } from '../assessment/assessment.module';
import { WorkflowModule } from '../workflow/workflow.module';

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
  ],
  exports: [SessionService],
})
export class SessionModule {}
