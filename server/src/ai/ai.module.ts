import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OpenAIGateway } from './openai.gateway';
import { PromptBuilderService } from './prompt-builder.service';
import { ContextPackService } from './context-pack.service';
import { ZodValidatorService } from './zod-validator.service';
import { HrPipelineService } from './pipelines/hr.pipeline.service';
import { TechnicalPipelineService } from './pipelines/technical.pipeline.service';
import { MixedPipelineService } from './pipelines/mixed.pipeline.service';
import { PipelineStrategyFactory } from './pipelines/pipeline-strategy.factory';
import { QuestionGenerationProcessor } from './processors/question-generation.processor';
import { FollowUpProcessor } from './processors/follow-up.processor';
import { FeedbackProcessor } from './processors/feedback.processor';
import { ComprehensiveReportProcessor } from './processors/comprehensive-report.processor';
import { RewriteEvalProcessor } from './processors/rewrite-eval.processor';
import {
  QUESTION_GEN_QUEUE,
  FOLLOW_UP_QUEUE,
  FEEDBACK_QUEUE,
  REPORT_QUEUE,
  REWRITE_EVAL_QUEUE,
} from '../common/constants/queue.constants';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUESTION_GEN_QUEUE },
      { name: FOLLOW_UP_QUEUE },
      { name: FEEDBACK_QUEUE },
      { name: REPORT_QUEUE },
      { name: REWRITE_EVAL_QUEUE },
    ),
  ],
  providers: [
    OpenAIGateway,
    PromptBuilderService,
    ContextPackService,
    ZodValidatorService,
    HrPipelineService,
    TechnicalPipelineService,
    MixedPipelineService,
    PipelineStrategyFactory,
    QuestionGenerationProcessor,
    FollowUpProcessor,
    FeedbackProcessor,
    ComprehensiveReportProcessor,
    RewriteEvalProcessor,
  ],
  exports: [PipelineStrategyFactory, ContextPackService, OpenAIGateway],
})
export class AiModule {}
