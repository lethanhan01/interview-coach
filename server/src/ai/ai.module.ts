import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OpenAIGateway } from './openai.gateway';
import { OpenAIChatClient } from './openai-chat.client';
import { OpenAITranscriptionClient } from './openai-transcription.client';
import { PromptBuilderService } from './prompt-builder.service';
import { ContextPackService } from './context-pack.service';
import { RubricController } from './rubric.controller';
import { ZodValidatorService } from './zod-validator.service';
import { HrPipelineService } from './pipelines/hr.pipeline.service';
import { TechnicalPipelineService } from './pipelines/technical.pipeline.service';
import { MixedPipelineService } from './pipelines/mixed.pipeline.service';
import { PipelineStrategyFactory } from './pipelines/pipeline-strategy.factory';
import { FeedbackProcessor } from './processors/feedback.processor';
import { ComprehensiveReportProcessor } from './processors/comprehensive-report.processor';
import { ReportModule } from '../report/report.module';
import {
  FEEDBACK_QUEUE,
  REPORT_QUEUE,
} from '../common/constants/queue.constants';

const workerProviders =
  process.env.WORKERS_ENABLED === 'false'
    ? []
    : [
        FeedbackProcessor,
        ComprehensiveReportProcessor,
      ];

@Module({
  imports: [
    ReportModule,
    BullModule.registerQueue(
      { name: FEEDBACK_QUEUE },
      { name: REPORT_QUEUE },
    ),
  ],
  controllers: [RubricController],
  providers: [
    OpenAIGateway,
    OpenAIChatClient,
    OpenAITranscriptionClient,
    PromptBuilderService,
    ContextPackService,
    ZodValidatorService,
    HrPipelineService,
    TechnicalPipelineService,
    MixedPipelineService,
    PipelineStrategyFactory,
    ...workerProviders,
  ],
  exports: [PipelineStrategyFactory, ContextPackService, OpenAIGateway],
})
export class AiModule {}
