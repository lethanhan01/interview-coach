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
import { FeedbackProcessor } from './processors/feedback.processor';
import { ComprehensiveReportProcessor } from './processors/comprehensive-report.processor';
import { TranscriptionProcessor } from './processors/transcription.processor';
import { WhisperService } from '../turn/whisper.service';
import { VoiceMetricsService } from '../turn/voice-metrics.service';
import { ReportModule } from '../report/report.module';
import { QuestionBankModule } from '../question-bank/question-bank.module';
import {
  QUESTION_GEN_QUEUE,
  FEEDBACK_QUEUE,
  REPORT_QUEUE,
  TRANSCRIPTION_QUEUE,
} from '../common/constants/queue.constants';

@Module({
  imports: [
    ReportModule,
    QuestionBankModule,
    BullModule.registerQueue(
      { name: QUESTION_GEN_QUEUE },
      { name: FEEDBACK_QUEUE },
      { name: REPORT_QUEUE },
      { name: TRANSCRIPTION_QUEUE },
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
    FeedbackProcessor,
    ComprehensiveReportProcessor,
    TranscriptionProcessor,
    WhisperService,
    VoiceMetricsService,
  ],
  exports: [PipelineStrategyFactory, ContextPackService, OpenAIGateway],
})
export class AiModule {}
