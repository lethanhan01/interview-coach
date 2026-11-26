import { HttpStatus, Injectable } from '@nestjs/common';
import { HrPipelineService } from './hr.pipeline.service';
import { TechnicalPipelineService } from './technical.pipeline.service';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import type {
  InterviewPipeline,
  SessionType,
} from './interview-pipeline.interface';

@Injectable()
export class PipelineStrategyFactory {
  private readonly strategies: ReadonlyMap<SessionType, InterviewPipeline>;

  constructor(
    private readonly hr: HrPipelineService,
    private readonly technical: TechnicalPipelineService,
  ) {
    this.strategies = new Map(
      [hr, technical].map((pipeline) => [pipeline.sessionType, pipeline]),
    );
  }

  getStrategy(sessionType: SessionType): InterviewPipeline {
    const strategy = this.strategies.get(sessionType);
    if (!strategy) {
      throw new InterviewAIException(
        ErrorCode.INVALID_SESSION_TYPE,
        HttpStatus.BAD_REQUEST,
        `Unsupported session type: ${String(sessionType)}`,
      );
    }
    return strategy;
  }
}
