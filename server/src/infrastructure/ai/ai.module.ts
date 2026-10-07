import { Module } from '@nestjs/common';
import { OpenAIGateway } from './openai.gateway';
import { AI_GATEWAY_TOKEN } from './ai-gateway.interface';
import { OpenAIChatClient } from './openai-chat.client';
import { OpenAITranscriptionClient } from './openai-transcription.client';
import { PythonAiClient } from './clients/python-ai.client';
import { AIGatewayDispatcher } from './ai-gateway-dispatcher.service';
import { PromptBuilderService } from './prompt-builder.service';
import { ZodValidatorService } from './zod-validator.service';
import { HrPipelineService } from './pipelines/hr.pipeline.service';
import { TechnicalPipelineService } from './pipelines/technical.pipeline.service';
import { PipelineStrategyFactory } from './pipelines/pipeline-strategy.factory';
import { EvaluateAnswer } from '@modules/interview-assessment/evaluation/evaluate-answer.service';

@Module({
  providers: [
    PythonAiClient,
    OpenAIGateway,
    AIGatewayDispatcher,
    {
      provide: AI_GATEWAY_TOKEN,
      useClass: AIGatewayDispatcher,
    },
    OpenAIChatClient,
    OpenAITranscriptionClient,
    PromptBuilderService,
    ZodValidatorService,
    EvaluateAnswer,
    HrPipelineService,
    TechnicalPipelineService,
    PipelineStrategyFactory,
  ],
  exports: [
    AI_GATEWAY_TOKEN,
    PipelineStrategyFactory,
    OpenAIGateway,
    PythonAiClient,
    AIGatewayDispatcher,
    PromptBuilderService,
    ZodValidatorService,
    EvaluateAnswer,
  ],
})
export class AiModule {}
