import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvaluateAnswer } from '../../assessment/evaluate-answer.service';
import { OpenAIGateway } from '../openai.gateway';
import { PromptBuilderService } from '../prompt-builder.service';
import { ZodValidatorService } from '../zod-validator.service';
import { BasePipelineService } from './base-pipeline.service';

@Injectable()
export class TechnicalPipelineService extends BasePipelineService {
  readonly sessionType = 'technical' as const;
  protected readonly strategyInstructions =
    'Focus on technical depth, applied problem-solving, trade-offs, debugging, system design, and engineering quality. Ask for reasoning and concrete implementation decisions.';

  constructor(
    openai: OpenAIGateway,
    promptBuilder: PromptBuilderService,
    zodValidator: ZodValidatorService,
    config: ConfigService,
    evaluator: EvaluateAnswer,
  ) {
    super(openai, promptBuilder, zodValidator, config, evaluator);
  }
}
