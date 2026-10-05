import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { REPORT_QUEUE } from '@core/common/constants/queue.constants';
import { BullMqJobErrorHandler } from '@infra/workflow/bullmq-error-handler';
import {
  ComprehensiveReportJobDto,
  GenerateComprehensiveReport,
} from './generate-comprehensive-report.service';

@Processor(REPORT_QUEUE, {
  concurrency: 1,
  lockDuration: 600_000,
  stalledInterval: 60_000,
})
export class ComprehensiveReportProcessor extends WorkerHost {
  constructor(private readonly generateReport: GenerateComprehensiveReport) {
    super();
  }

  process(job: Job<ComprehensiveReportJobDto>): Promise<void> {
    return BullMqJobErrorHandler.handleJobExecution(
      ComprehensiveReportProcessor.name,
      job,
      () => this.generateReport.execute(job.data),
    );
  }
}
