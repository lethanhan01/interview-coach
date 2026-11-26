import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  FEEDBACK_QUEUE,
  QUESTION_GEN_QUEUE,
  QUEUE_DEFAULT_JOB_OPTIONS,
  REPORT_QUEUE,
} from '@core/common/constants/queue.constants';
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { WorkflowDispatcher } from './workflow-dispatcher.service';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      {
        name: QUESTION_GEN_QUEUE,
        defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[QUESTION_GEN_QUEUE],
      },
      {
        name: REPORT_QUEUE,
        defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[REPORT_QUEUE],
      },
      {
        name: FEEDBACK_QUEUE,
        defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[FEEDBACK_QUEUE],
      },
    ),
  ],
  providers: [WorkflowService, WorkflowDispatcher],
  exports: [WorkflowService, WorkflowDispatcher],
})
export class WorkflowModule {}
