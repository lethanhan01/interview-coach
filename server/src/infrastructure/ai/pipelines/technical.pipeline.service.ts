import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvaluateAnswer } from '@modules/interview-assessment/evaluation/evaluate-answer.service';
import { AI_GATEWAY_TOKEN, type IAIGateway } from '../ai-gateway.interface';
import { PromptBuilderService } from '../prompt-builder.service';
import { ZodValidatorService } from '../zod-validator.service';
import { BasePipelineService } from './base-pipeline.service';

@Injectable()
export class TechnicalPipelineService extends BasePipelineService {
  readonly sessionType = 'technical' as const;
  protected readonly strategyInstructions =
    'Focus on technical depth, applied problem-solving, trade-offs, debugging, system design, and engineering quality. Ask for reasoning and concrete implementation decisions.';

  constructor(
    @Inject(AI_GATEWAY_TOKEN)
    openai: IAIGateway,
    promptBuilder: PromptBuilderService,
    zodValidator: ZodValidatorService,
    config: ConfigService,
    evaluator: EvaluateAnswer,
  ) {
    super(openai, promptBuilder, zodValidator, config, evaluator);
  }
}
