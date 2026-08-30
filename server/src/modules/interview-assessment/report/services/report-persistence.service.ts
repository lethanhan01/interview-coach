import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { SseService } from '@infra/realtime/redis/sse.service';
import type { ReportFinalPayload } from '../types/report-generation.types';

@Injectable()
export class ReportPersistenceService {
  private readonly logger = new Logger(ReportPersistenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
  ) {}

  async saveReportTransaction(
    sessionId: string,
    payload: ReportFinalPayload,
  ): Promise<void> {
    const {
      aggregatedScore,
      syntheticSkippedFeedbacks,
      executiveSummary,
      commAnalysis,
      competencyHeatmap,
      actionPlan,
      skippedModelAnswers,
      reportMetadata,
    } = payload;

    try {
      await this.prisma.$transaction([
        ...syntheticSkippedFeedbacks.map((feedback) =>
          this.prisma.aiFeedback.upsert({
            where: { userAnswerId: feedback.userAnswerId },
            create: {
              userAnswerId: feedback.userAnswerId,
              overallScore: feedback.overallScore,
              modelAnswer: '',
              keyTakeaway: feedback.keyTakeaway,
              promptVersion: reportMetadata.promptVersion,
              isFallback: feedback.isFallback,
              dimensionScores:
                feedback.dimensionScores as Prisma.InputJsonValue,
            },
            update: {
              overallScore: feedback.overallScore,
              modelAnswer: '',
              keyTakeaway: feedback.keyTakeaway,
              promptVersion: reportMetadata.promptVersion,
              isFallback: feedback.isFallback,
              dimensionScores:
                feedback.dimensionScores as Prisma.InputJsonValue,
            },
          }),
        ),
        this.prisma.sessionReport.upsert({
          where: {
            sessionId_reportType_version: {
              sessionId,
              reportType: 'executive_summary',
              version: 1,
            },
          },
          create: {
            sessionId,
            reportType: 'executive_summary',
            version: 1,
            contentJson:
              executiveSummary as unknown as Prisma.InputJsonValue,
            ...reportMetadata,
          },
          update: {
            contentJson:
              executiveSummary as unknown as Prisma.InputJsonValue,
            ...reportMetadata,
          },
        }),
        this.prisma.sessionReport.upsert({
          where: {
            sessionId_reportType_version: {
              sessionId,
              reportType: 'comm_analysis',
              version: 1,
            },
          },
          create: {
            sessionId,
            reportType: 'comm_analysis',
            version: 1,
            contentJson: commAnalysis as unknown as Prisma.InputJsonValue,
            ...reportMetadata,
          },
          update: {
            contentJson: commAnalysis as unknown as Prisma.InputJsonValue,
            ...reportMetadata,
          },
        }),
        this.prisma.sessionReport.upsert({
          where: {
            sessionId_reportType_version: {
              sessionId,
              reportType: 'competency_heatmap',
              version: 1,
            },
          },
          create: {
            sessionId,
            reportType: 'competency_heatmap',
            version: 1,
            contentJson: competencyHeatmap,
            ...reportMetadata,
          },
          update: { contentJson: competencyHeatmap, ...reportMetadata },
        }),
        this.prisma.sessionReport.upsert({
          where: {
            sessionId_reportType_version: {
              sessionId,
              reportType: 'action_plan',
              version: 1,
            },
          },
          create: {
            sessionId,
            reportType: 'action_plan',
            version: 1,
            contentJson: actionPlan as unknown as Prisma.InputJsonValue,
            ...reportMetadata,
          },
          update: {
            contentJson: actionPlan as unknown as Prisma.InputJsonValue,
            ...reportMetadata,
          },
        }),
        this.prisma.sessionReport.upsert({
          where: {
            sessionId_reportType_version: {
              sessionId,
              reportType: 'skipped_answers',
              version: 1,
            },
          },
          create: {
            sessionId,
            reportType: 'skipped_answers',
            version: 1,
            contentJson:
              skippedModelAnswers as unknown as Prisma.InputJsonValue,
            ...reportMetadata,
          },
          update: {
            contentJson:
              skippedModelAnswers as unknown as Prisma.InputJsonValue,
            ...reportMetadata,
          },
        }),
        this.prisma.interviewSession.update({
          where: { id: sessionId },
          data: {
            overallScore: aggregatedScore,
            status: 'completed',
            completedAt: new Date(),
          },
        }),
      ]);
    } catch (error: unknown) {
      this.logger.error(
        `ComprehensiveReportProcessor: DB update failed for session ${sessionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async notifyReportReady(sessionId: string): Promise<void> {
    await this.sseService
      .emit(`sse:session:${sessionId}`, 'report.ready', { sessionId })
      .catch((error: unknown) => {
        this.logger.warn(
          `ComprehensiveReportProcessor: unable to emit report.ready for session ${sessionId}`,
          error instanceof Error ? error.message : String(error),
        );
      });
  }
}
