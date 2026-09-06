import { Injectable, Logger } from '@nestjs/common';
import { resolveOutputLanguage } from '@infra/ai/output-language';
import { getFallbackActionPlan } from '@infra/ai/fallback-content';
import { ReportDataCollector } from './services/report-data-collector.service';
import { ReportMetricsAggregator } from './services/report-metrics-aggregator.service';
import { ReportPromptExecutor } from './services/report-prompt-executor.service';
import { ReportPersistenceService } from './services/report-persistence.service';
import type {
  ComprehensiveReportJobDto,
  ReportFinalPayload,
} from './types/report-generation.types';

import { Optional } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { UnifiedReportGeneratorService } from './services/unified-report-generator.service';

export { ComprehensiveReportJobDto };

@Injectable()
export class GenerateComprehensiveReport {
  private readonly logger = new Logger(GenerateComprehensiveReport.name);

  constructor(
    private readonly dataCollector: ReportDataCollector,
    private readonly metricsAggregator: ReportMetricsAggregator,
    private readonly promptExecutor: ReportPromptExecutor,
    private readonly persistenceService: ReportPersistenceService,
    @Optional()
    private readonly unifiedReportGenerator?: UnifiedReportGeneratorService,
    @Optional()
    private readonly prisma?: PrismaService,
  ) {}

  async execute(job: ComprehensiveReportJobDto): Promise<void> {
    const { sessionId, turnIds } = job;
    const language = resolveOutputLanguage(job.language);

    // Kiểm tra nếu phiên có session_skills (Hybrid Engine Phase 4 & 5)
    let hasSessionSkills = false;
    if (this.unifiedReportGenerator && this.prisma?.sessionSkill?.count) {
      try {
        const skillCount = await this.prisma.sessionSkill.count({
          where: { sessionId },
        });
        hasSessionSkills = skillCount > 0;
      } catch (err: unknown) {
        this.logger.warn(
          `Unable to check session_skills count for session ${sessionId}`,
          err,
        );
      }
    }

    if (hasSessionSkills && this.unifiedReportGenerator) {
      this.logger.log(
        `Generating unified competency report for session ${sessionId}`,
      );
      await this.unifiedReportGenerator.generateReport(sessionId, language);
      await this.persistenceService.notifyReportReady(sessionId);
      return;
    }

    // 1. Collect & validate data from database (Legacy flow)
    const collected = await this.dataCollector.collectReportData(
      sessionId,
      turnIds,
    );

    // 2. Compute pure domain metrics & aggregations
    const syntheticSkippedFeedbacks =
      this.metricsAggregator.buildSyntheticSkippedFeedbacks(
        collected.skippedAnswers,
        language,
      );
    const allFeedbacks = [...collected.feedbacks, ...syntheticSkippedFeedbacks];
    const evaluatedFeedbacks = allFeedbacks.filter(
      (feedback) => !feedback.isFallback,
    );
    const aggregatedScore =
      this.metricsAggregator.calculateAggregatedScore(evaluatedFeedbacks);

    const executiveSummary = this.metricsAggregator.buildExecutiveSummary({
      totalTurns: turnIds.length,
      evaluatedTurns: evaluatedFeedbacks.length,
      fallbackTurns: allFeedbacks.length - evaluatedFeedbacks.length,
      skippedTurns: collected.skippedAnswers.length,
      aggregatedScore,
      language,
    });

    const commAnalysis = this.metricsAggregator.buildCommAnalysis({
      feedbackCount: allFeedbacks.length,
      evaluatedFeedbackCount: evaluatedFeedbacks.length,
      fallbackFeedbackCount: allFeedbacks.length - evaluatedFeedbacks.length,
      skippedFeedbackCount: collected.skippedAnswers.length,
    });

    const competencyHeatmap =
      this.metricsAggregator.buildCompetencyHeatmap(allFeedbacks);

    const defaultSkippedModelAnswers = {
      answers: collected.skippedAnswers.map((answer) => ({
        answerId: answer.id,
        modelAnswer: this.metricsAggregator.fallbackSkippedModelAnswer(
          answer.question.questionText,
          language,
        ),
      })),
    };

    const defaultActionPlan = getFallbackActionPlan(language);

    // 3. Execute AI Prompts with automatic fallback recovery
    const skippedModelAnswers =
      await this.promptExecutor.executeSkippedModelAnswers({
        sessionId,
        skippedAnswers: collected.skippedAnswers,
        defaultAnswers: defaultSkippedModelAnswers,
        language,
      });

    const actionPlan = await this.promptExecutor.executeActionPlan({
      sessionId,
      evaluatedFeedbacks,
      defaultActionPlan,
      language,
    });

    const reportMetadata = this.promptExecutor.getReportMetadata();

    // 4. Persist transaction & Emit realtime SSE
    const finalPayload: ReportFinalPayload = {
      aggregatedScore,
      syntheticSkippedFeedbacks,
      executiveSummary,
      commAnalysis,
      competencyHeatmap,
      actionPlan,
      skippedModelAnswers,
      reportMetadata,
    };

    await this.persistenceService.saveReportTransaction(
      sessionId,
      finalPayload,
    );
    await this.persistenceService.notifyReportReady(sessionId);
  }

  process(job: { data: ComprehensiveReportJobDto }): Promise<void> {
    return this.execute(job.data);
  }
}
