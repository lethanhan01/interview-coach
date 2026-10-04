import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { REPORT_QUEUE } from '@core/common/constants/queue.constants';
import {
  ComprehensiveReportJobDto,
  GenerateComprehensiveReport,
} from './generate-comprehensive-report.service';

@Processor(REPORT_QUEUE, { concurrency: 1 })
export class ComprehensiveReportProcessor extends WorkerHost {
  constructor(private readonly generateReport: GenerateComprehensiveReport) {
    super();
  }

  process(job: Job<ComprehensiveReportJobDto>): Promise<void> {
    return this.generateReport.execute(job.data);
  }
}
