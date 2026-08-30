import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '@infra/ai/ai.module';
import { ReportModule } from '../report/report.module';
import {
  FEEDBACK_QUEUE,
  QUEUE_DEFAULT_JOB_OPTIONS,
} from '@core/common/constants/queue.constants';
import { RubricCatalogService } from './rubric/rubric-catalog.service';
import { ContextPackService } from './context-pack.service';
import { FeedbackProcessor } from './feedback/feedback.processor';
import { RubricController } from './rubric.controller';
import { workersEnabled } from '@core/runtime/runtime-role';

import { AssessmentFacade } from '../contracts/assessment-facade.service';

const workerProviders = workersEnabled() ? [FeedbackProcessor] : [];

@Module({
  imports: [
    AiModule,
    ReportModule,
    BullModule.registerQueue({
      name: FEEDBACK_QUEUE,
      defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[FEEDBACK_QUEUE],
    }),
  ],
  providers: [
    RubricCatalogService,
    ContextPackService,
    AssessmentFacade,
    ...workerProviders,
  ],
  controllers: [RubricController],
  exports: [RubricCatalogService, ContextPackService, AssessmentFacade],
})
export class EvaluationModule {}
