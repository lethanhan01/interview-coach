import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '@modules/auth/auth.module';
import { AiModule } from '@infra/ai/ai.module';
import {
  QUEUE_DEFAULT_JOB_OPTIONS,
  REPORT_QUEUE,
} from '@core/common/constants/queue.constants';
import { WorkflowModule } from '@infra/workflow/workflow.module';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ComprehensiveReportProcessor } from './comprehensive-report.processor';
import { GenerateComprehensiveReport } from './generate-comprehensive-report.service';
import { workersEnabled } from '@core/runtime/runtime-role';

const workerProviders = workersEnabled() ? [ComprehensiveReportProcessor] : [];

@Module({
  imports: [
    AuthModule,
    AiModule,
    WorkflowModule,
    BullModule.registerQueue({
      name: REPORT_QUEUE,
      defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[REPORT_QUEUE],
    }),
  ],
  providers: [ReportService, GenerateComprehensiveReport, ...workerProviders],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportModule {}
