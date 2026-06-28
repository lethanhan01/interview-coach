import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { OpenAIGateway } from '../openai.gateway';
import { REPORT_QUEUE } from '../../common/constants/queue.constants';
import { COMPREHENSIVE_REPORT_PROMPT_CONFIG } from '../prompts/comprehensive-report-v1.0';
import type { SessionType } from '../pipelines/interview-pipeline.interface';
import { isAIQuotaExceeded } from '../ai-error.utils';
import { FALLBACK_ACTION_PLAN } from '../fallback-content';

interface ComprehensiveReportJobDto {
  sessionId: string;
  sessionType: SessionType;
  contextPack: 'VN' | 'Western';
  turnIds: string[];
}

const actionPlanSchema = z.object({
  items: z.array(z.string()),
});

@Processor(REPORT_QUEUE)
export class ComprehensiveReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ComprehensiveReportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
    private readonly openai: OpenAIGateway,
  ) {
    super();
  }

  async process(job: Job<ComprehensiveReportJobDto>): Promise<void> {
    const { sessionId, turnIds } = job.data;

    const feedbacks = await this.prisma.aiFeedback.findMany({
      where: { userAnswerId: { in: turnIds } },
    });
    const expectedFeedbackCount = new Set(turnIds).size;
    if (
      expectedFeedbackCount === 0 ||
      feedbacks.length !== expectedFeedbackCount
    ) {
      throw new Error(
        `Report input is not ready for session ${sessionId}: ${feedbacks.length}/${expectedFeedbackCount} feedbacks`,
      );
    }

    const evaluatedFeedbacks = feedbacks.filter(
      (feedback) => !feedback.isFallback,
    );
    const aggregatedScore =
      evaluatedFeedbacks.length > 0
        ? Math.round(
            evaluatedFeedbacks.reduce((sum, f) => sum + f.overallScore, 0) /
              evaluatedFeedbacks.length,
          )
        : null;

    const executiveSummary = {
      overallScore: aggregatedScore,
      totalTurns: turnIds.length,
      evaluatedTurns: evaluatedFeedbacks.length,
      fallbackTurns: feedbacks.length - evaluatedFeedbacks.length,
      summary:
        aggregatedScore === null
          ? 'AI scoring was unavailable. Your answers were saved and can be evaluated again after the AI service is restored.'
          : `Interview completed with ${evaluatedFeedbacks.length} evaluated answers. Overall score: ${aggregatedScore}/100.`,
    };

    const commAnalysis = {
      feedbackCount: feedbacks.length,
      evaluatedFeedbackCount: evaluatedFeedbacks.length,
      fallbackFeedbackCount: feedbacks.length - evaluatedFeedbacks.length,
    };

    const competencyHeatmap = {
      scores: feedbacks.map((f) => ({
        answerId: f.userAnswerId,
        score: f.isFallback ? null : f.overallScore,
      })),
    };

    let actionPlan: { items: string[] } = FALLBACK_ACTION_PLAN;

    if (evaluatedFeedbacks.length > 0) {
      try {
        const feedbackSummaries = evaluatedFeedbacks
          .map(
            (f, i) =>
              `Answer ${i + 1}: score=${f.overallScore}, takeaway="${f.keyTakeaway}"`,
          )
          .join('\n');

        const raw = await this.openai.chatCompletion({
          temperature: COMPREHENSIVE_REPORT_PROMPT_CONFIG.temperature,
          maxTokens: COMPREHENSIVE_REPORT_PROMPT_CONFIG.maxTokens,
          responseFormat: 'json_object',
          messages: [
            {
              role: 'system',
              content:
                'You are an interview coach. Based on the feedback summaries, generate a concise action plan with 3-5 specific improvement items. Respond with JSON: { "items": ["item1", "item2", ...] }',
            },
            {
              role: 'user',
              content: `Feedback summaries:\n${feedbackSummaries}`,
            },
          ],
        });

        const parsed = JSON.parse(raw) as unknown;
        actionPlan = actionPlanSchema.parse(parsed);
      } catch (openaiError: unknown) {
        if (isAIQuotaExceeded(openaiError)) {
          this.logger.warn(
            `Comprehensive report for session ${sessionId} is using a fallback action plan: AI provider quota exhausted`,
          );
        } else {
          this.logger.error(
            `ComprehensiveReportProcessor: AI provider call failed for session ${sessionId}`,
            openaiError instanceof Error
              ? openaiError.stack
              : String(openaiError),
          );
        }
      }
    } else {
      this.logger.warn(
        `Comprehensive report for session ${sessionId} has no AI-evaluated feedback; skipping the action-plan API call`,
      );
    }

    const reportMetadata = {
      generatedByModel: this.openai.getChatModel(),
      promptVersion: COMPREHENSIVE_REPORT_PROMPT_CONFIG.version,
    };

    try {
      await this.prisma.$transaction([
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
            contentJson: executiveSummary,
            ...reportMetadata,
          },
          update: { contentJson: executiveSummary, ...reportMetadata },
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
            contentJson: commAnalysis,
            ...reportMetadata,
          },
          update: { contentJson: commAnalysis, ...reportMetadata },
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
            contentJson: actionPlan,
            ...reportMetadata,
          },
          update: { contentJson: actionPlan, ...reportMetadata },
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
