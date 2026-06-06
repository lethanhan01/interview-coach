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
  constructor(
    private readonly hr: HrPipelineService,
    private readonly technical: TechnicalPipelineService,
    private readonly mixed: MixedPipelineService,
  ) {}

  getStrategy(sessionType: SessionType): InterviewPipeline {
    switch (sessionType) {
      case 'HR':
        return this.hr;
      case 'Technical':
        return this.technical;
      case 'Mixed':
        return this.mixed;
    }
  }
}
