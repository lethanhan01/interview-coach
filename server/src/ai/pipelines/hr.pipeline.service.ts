import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvaluateAnswer } from '../../assessment/evaluate-answer.service';
import { OpenAIGateway } from '../openai.gateway';
import { PromptBuilderService } from '../prompt-builder.service';
import { ZodValidatorService } from '../zod-validator.service';
import { BasePipelineService } from './base-pipeline.service';

@Injectable()
export class HrPipelineService extends BasePipelineService {
  readonly sessionType = 'hr' as const;
  protected readonly strategyInstructions =
    'Focus on behavioral evidence, motivation, communication, collaboration, self-awareness, and culture fit. Probe for concrete STAR examples. Avoid deep technical trivia unless the job description explicitly requires it.';

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
