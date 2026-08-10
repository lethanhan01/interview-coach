import { Module } from '@nestjs/common';
import { OpenAIGateway } from './openai.gateway';
import { OpenAIChatClient } from './openai-chat.client';
import { OpenAITranscriptionClient } from './openai-transcription.client';
import { PromptBuilderService } from './prompt-builder.service';
import { ZodValidatorService } from './zod-validator.service';
import { HrPipelineService } from './pipelines/hr.pipeline.service';
import { TechnicalPipelineService } from './pipelines/technical.pipeline.service';
import { MixedPipelineService } from './pipelines/mixed.pipeline.service';
import { PipelineStrategyFactory } from './pipelines/pipeline-strategy.factory';
import { EvaluateAnswer } from '../assessment/evaluate-answer.service';
@Module({
  providers: [
    OpenAIGateway,
    OpenAIChatClient,
    OpenAITranscriptionClient,
    PromptBuilderService,
    ZodValidatorService,
    EvaluateAnswer,
    HrPipelineService,
    TechnicalPipelineService,
    MixedPipelineService,
    PipelineStrategyFactory,
  ],
  exports: [
    PipelineStrategyFactory,
    OpenAIGateway,
    PromptBuilderService,
    ZodValidatorService,
    EvaluateAnswer,
  ],
})
export class AiModule {}
