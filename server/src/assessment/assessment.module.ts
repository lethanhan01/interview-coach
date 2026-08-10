import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module';
import { ReportModule } from '../report/report.module';
import { FEEDBACK_QUEUE } from '../common/constants/queue.constants';
import { RubricCatalogService } from './rubric/rubric-catalog.service';
import { ContextPackService } from './context-pack.service';
import { FeedbackProcessor } from './feedback/feedback.processor';
import { EvaluateAnswer } from './evaluate-answer.service';
import { RubricController } from './rubric.controller';

const workerProviders =
  process.env.WORKERS_ENABLED === 'false' ? [] : [FeedbackProcessor];

@Module({
  imports: [AiModule, ReportModule, BullModule.registerQueue({ name: FEEDBACK_QUEUE })],
  providers: [
    RubricCatalogService,
    ContextPackService,
    EvaluateAnswer,
    ...workerProviders,
  ],
  controllers: [RubricController],
  exports: [RubricCatalogService, ContextPackService],
})
export class AssessmentModule {}
