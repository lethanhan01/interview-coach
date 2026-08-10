import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { REPORT_QUEUE } from '../common/constants/queue.constants';
import {
  ComprehensiveReportJobDto,
  GenerateComprehensiveReport,
} from './generate-comprehensive-report.service';

@Processor(REPORT_QUEUE)
export class ComprehensiveReportProcessor extends WorkerHost {
  constructor(private readonly generateReport: GenerateComprehensiveReport) {
    super();
  }

  process(job: Job<ComprehensiveReportJobDto>): Promise<void> {
    return this.generateReport.execute(job.data);
  }
}
