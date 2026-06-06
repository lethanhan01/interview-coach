import { Module } from '@nestjs/common';
import { OpenAIGateway } from './openai.gateway';
import { PromptBuilderService } from './prompt-builder.service';
import { ContextPackService } from './context-pack.service';
import { ZodValidatorService } from './zod-validator.service';
import { HrPipelineService } from './pipelines/hr.pipeline.service';
import { TechnicalPipelineService } from './pipelines/technical.pipeline.service';
import { MixedPipelineService } from './pipelines/mixed.pipeline.service';
import { PipelineStrategyFactory } from './pipelines/pipeline-strategy.factory';

@Module({
  providers: [
    OpenAIGateway,
    PromptBuilderService,
    ContextPackService,
    ZodValidatorService,
    HrPipelineService,
    TechnicalPipelineService,
    MixedPipelineService,
    PipelineStrategyFactory,
  ],
  exports: [PipelineStrategyFactory, ContextPackService],
})
export class AiModule {}
