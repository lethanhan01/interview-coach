import { Injectable } from '@nestjs/common';
import { HrPipelineService } from './hr.pipeline.service';
import { TechnicalPipelineService } from './technical.pipeline.service';
import { MixedPipelineService } from './mixed.pipeline.service';
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
    private readonly mixed: MixedPipelineService,
  ) {
    this.strategies = new Map(
      [hr, technical, mixed].map((pipeline) => [
        pipeline.sessionType,
        pipeline,
      ]),
    );
  }

  getStrategy(sessionType: SessionType): InterviewPipeline {
    const strategy = this.strategies.get(sessionType);
    if (!strategy)
      throw new Error(`Unsupported session type: ${String(sessionType)}`);
    return strategy;
  }
}
