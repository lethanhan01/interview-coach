import { Injectable } from '@nestjs/common';
import { OpenAIGateway } from '../openai.gateway';
import { PromptBuilderService } from '../prompt-builder.service';
import { ZodValidatorService } from '../zod-validator.service';
import { BasePipelineService } from './base-pipeline.service';

@Injectable()
export class TechnicalPipelineService extends BasePipelineService {
  constructor(
    openai: OpenAIGateway,
    promptBuilder: PromptBuilderService,
    zodValidator: ZodValidatorService,
  ) {
    super(openai, promptBuilder, zodValidator);
  }
}
