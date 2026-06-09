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

    const aggregatedScore =
      feedbacks.length > 0
        ? Math.round(
            feedbacks.reduce((sum, f) => sum + f.overallScore, 0) /
              feedbacks.length,
          )
        : 0;

    const executiveSummary = {
      overallScore: aggregatedScore,
      totalTurns: turnIds.length,
      summary: `Interview completed with ${feedbacks.length} evaluated answers. Overall score: ${aggregatedScore}/100.`,
    };

    const commAnalysis = {
      feedbackCount: feedbacks.length,
    };

    const competencyHeatmap = {
      scores: feedbacks.map((f) => ({
        answerId: f.userAnswerId,
        score: f.overallScore,
      })),
    };

    const reverseQEval = {};

    let actionPlan: { items: string[] } | null = null;

    try {
      const feedbackSummaries = feedbacks
        .map(
          (f, i) =>
            `Answer ${i + 1}: score=${f.overallScore}, takeaway="${f.keyTakeaway}"`,
        )
        .join('\n');

      const raw = await this.openai.chatCompletion({
        model: COMPREHENSIVE_REPORT_PROMPT_CONFIG.model,
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
      this.logger.error(
        `ComprehensiveReportProcessor: OpenAI call failed for session ${sessionId}`,
        openaiError instanceof Error ? openaiError.stack : String(openaiError),
      );
      // fallback: actionPlan remains null
    }

    try {
      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          executiveSummaryJson: executiveSummary,
          commAnalysisJson: commAnalysis,
          competencyHeatmapJson: competencyHeatmap,
          reverseQEvalJson: reverseQEval,
          actionPlanJson: actionPlan ?? {},
          overallScore: aggregatedScore,
          status: 'completed',
          completedAt: new Date(),
        },
      });
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
