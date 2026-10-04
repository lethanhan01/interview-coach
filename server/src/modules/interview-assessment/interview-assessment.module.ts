import { Module } from '@nestjs/common';
import { EvaluationModule } from './evaluation/evaluation.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [EvaluationModule, ReportModule],
  exports: [EvaluationModule, ReportModule],
})
export class InterviewAssessmentModule {}
