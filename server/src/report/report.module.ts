import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { REPORT_QUEUE } from '../common/constants/queue.constants';
import { WorkflowModule } from '../workflow/workflow.module';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ComprehensiveReportProcessor } from './comprehensive-report.processor';
import { GenerateComprehensiveReport } from './generate-comprehensive-report.service';

const workerProviders =
  process.env.WORKERS_ENABLED === 'false' ? [] : [ComprehensiveReportProcessor];

@Module({
  imports: [
    AuthModule,
    AiModule,
    WorkflowModule,
    BullModule.registerQueue({ name: REPORT_QUEUE }),
  ],
  providers: [ReportService, GenerateComprehensiveReport, ...workerProviders],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportModule {}
