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
import { ReportMetricsAggregator } from './services/report-metrics-aggregator.service';
import { ReportDataCollector } from './services/report-data-collector.service';
import { ReportPromptExecutor } from './services/report-prompt-executor.service';
import { ReportPersistenceService } from './services/report-persistence.service';
import { SfiaModule } from '@modules/sfia/sfia.module';
import { UnifiedReportGeneratorService } from './services/unified-report-generator.service';
import { ScoringEngineService } from '../evaluation/scoring-engine.service';
import { workersEnabled } from '@core/runtime/runtime-role';

const workerProviders = workersEnabled() ? [ComprehensiveReportProcessor] : [];

@Module({
  imports: [
    AuthModule,
    AiModule,
    SfiaModule,
    WorkflowModule,
    BullModule.registerQueue({
      name: REPORT_QUEUE,
      defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[REPORT_QUEUE],
    }),
  ],
  providers: [
    ReportService,
    GenerateComprehensiveReport,
    ReportMetricsAggregator,
    ReportDataCollector,
    ReportPromptExecutor,
    ReportPersistenceService,
    UnifiedReportGeneratorService,
    ScoringEngineService,
    ...workerProviders,
  ],
  controllers: [ReportController],
  exports: [ReportService, UnifiedReportGeneratorService],
})
export class ReportModule {}
