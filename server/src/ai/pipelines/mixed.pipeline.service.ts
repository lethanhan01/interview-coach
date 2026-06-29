import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIGateway } from '../openai.gateway';
import { PromptBuilderService } from '../prompt-builder.service';
import { ZodValidatorService } from '../zod-validator.service';
import { BasePipelineService } from './base-pipeline.service';

@Injectable()
export class MixedPipelineService extends BasePipelineService {
  protected readonly supportedSessionType = 'mixed' as const;
  protected readonly strategyInstructions =
    'Balance behavioral evidence with technical depth. Cover communication and collaboration alongside applied problem-solving, trade-offs, and role-specific engineering judgment.';

  constructor(
    openai: OpenAIGateway,
    promptBuilder: PromptBuilderService,
    zodValidator: ZodValidatorService,
    config: ConfigService,
  ) {
    super(openai, promptBuilder, zodValidator, config);
  }
}
