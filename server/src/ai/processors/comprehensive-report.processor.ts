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
import {
  describeAIError,
  isAIFallbackEligible,
  isAIQuotaExceeded,
} from '../ai-error.utils';
import {
  getFallbackActionPlan,
  getFallbackReportSummary,
} from '../fallback-content';
import {
  getLanguageInstruction,
  resolveOutputLanguage,
} from '../output-language';

interface ComprehensiveReportJobDto {
  sessionId: string;
  sessionType: SessionType;
  contextPack: 'VN' | 'Western';
  language?: 'vi' | 'en';
  turnIds: string[];
}

const actionPlanSchema = z.object({
  items: z.array(z.string()),
});

const skippedAnswerSchema = z.object({
  answers: z.array(
    z.object({
      answerId: z.string(),
      modelAnswer: z.string(),
    }),
  ),
});

function fallbackSkippedModelAnswer(
  questionText: string,
  language: 'vi' | 'en',
) {
  if (language === 'vi') {
    return `Một câu trả lời tốt nên trả lời trực tiếp câu hỏi "${questionText}", nêu bối cảnh ngắn gọn, đưa ra hành động cụ thể của bạn và kết thúc bằng kết quả hoặc bài học rõ ràng.`;
  }

  return `A strong answer should directly address "${questionText}", briefly set the context, describe your specific actions, and close with a clear result or lesson learned.`;
}

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
    const language = resolveOutputLanguage(job.data.language);

    const answers = await this.prisma.userAnswer.findMany({
      where: { id: { in: turnIds } },
      select: {
        id: true,
        skipped: true,
        question: { select: { questionText: true, orderIndex: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const skippedAnswers = answers.filter((answer) => answer.skipped);
    const skippedAnswerIds = new Set(skippedAnswers.map((answer) => answer.id));
    const answeredTurnIds = turnIds.filter(
      (turnId) => !skippedAnswerIds.has(turnId),
    );

    const feedbacks = await this.prisma.aiFeedback.findMany({
      where: { userAnswerId: { in: answeredTurnIds } },
    });
    const expectedFeedbackCount = new Set(answeredTurnIds).size;
    if (feedbacks.length !== expectedFeedbackCount) {
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
      skippedTurns: skippedAnswers.length,
      summary:
        aggregatedScore === null
          ? skippedAnswers.length > 0 && feedbacks.length === 0
            ? language === 'vi'
              ? `Phiên phỏng vấn đã hoàn thành với ${skippedAnswers.length} câu hỏi được bỏ qua. Chưa có câu trả lời nào đủ dữ liệu để chấm điểm.`
              : `Interview completed with ${skippedAnswers.length} skipped questions. There are no answer submissions available for scoring.`
            : getFallbackReportSummary(language)
          : language === 'vi'
            ? `Phiên phỏng vấn đã hoàn thành với ${evaluatedFeedbacks.length} câu trả lời được đánh giá. Điểm tổng quan: ${aggregatedScore}/100.`
            : `Interview completed with ${evaluatedFeedbacks.length} evaluated answers. Overall score: ${aggregatedScore}/100.`,
    };

    const commAnalysis = {
      feedbackCount: feedbacks.length,
      evaluatedFeedbackCount: evaluatedFeedbacks.length,
      fallbackFeedbackCount: feedbacks.length - evaluatedFeedbacks.length,
      skippedFeedbackCount: skippedAnswers.length,
    };

    const competencyHeatmap = {
      scores: feedbacks.map((f) => ({
        answerId: f.userAnswerId,
        score: f.isFallback ? null : f.overallScore,
      })),
    };

    let skippedModelAnswers: {
      answers: { answerId: string; modelAnswer: string }[];
    } = {
      answers: skippedAnswers.map((answer) => ({
        answerId: answer.id,
        modelAnswer: fallbackSkippedModelAnswer(
          answer.question.questionText,
          language,
        ),
      })),
    };

    if (skippedAnswers.length > 0) {
      try {
        const questionList = skippedAnswers
          .map(
            (answer, index) =>
              `${index + 1}. answerId=${answer.id}\nQuestion: ${answer.question.questionText}`,
          )
          .join('\n\n');

        const raw = await this.openai.chatCompletion({
          temperature: COMPREHENSIVE_REPORT_PROMPT_CONFIG.temperature,
          maxTokens: COMPREHENSIVE_REPORT_PROMPT_CONFIG.maxTokens,
          responseFormat: 'json_object',
          messages: [
            {
              role: 'system',
              content: [
                'You are an interview coach. Generate one concise but concrete suggested candidate answer for each skipped interview question.',
                getLanguageInstruction(language),
                'Respond with JSON only: { "answers": [{ "answerId": "...", "modelAnswer": "..." }] }',
              ].join(' '),
            },
            {
              role: 'user',
              content: `Skipped questions:\n${questionList}`,
            },
          ],
        });

        const parsed = skippedAnswerSchema.parse(JSON.parse(raw) as unknown);
        const parsedById = new Map(
          parsed.answers.map((answer) => [answer.answerId, answer.modelAnswer]),
        );
        skippedModelAnswers = {
          answers: skippedModelAnswers.answers.map((answer) => ({
            answerId: answer.answerId,
            modelAnswer: parsedById.get(answer.answerId) ?? answer.modelAnswer,
          })),
        };
      } catch (openaiError: unknown) {
        if (isAIQuotaExceeded(openaiError)) {
          this.logger.warn(
            `Comprehensive report for session ${sessionId} is using fallback skipped-answer suggestions: AI provider quota exhausted`,
          );
        } else if (isAIFallbackEligible(openaiError)) {
          this.logger.warn(
            `Comprehensive report for session ${sessionId} is using fallback skipped-answer suggestions: ${describeAIError(openaiError)}`,
          );
        } else {
          this.logger.error(
            `ComprehensiveReportProcessor: skipped-answer generation failed for session ${sessionId}`,
            openaiError instanceof Error
              ? openaiError.stack
              : String(openaiError),
          );
        }
      }
    }

    let actionPlan: { items: string[] } = getFallbackActionPlan(language);

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
              content: [
                'You are an interview coach. Based on the feedback summaries, generate a concise action plan with 3-5 specific improvement items.',
                getLanguageInstruction(language),
                'Respond with JSON only: { "items": ["item1", "item2", ...] }',
              ].join(' '),
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
        } else if (isAIFallbackEligible(openaiError)) {
          this.logger.warn(
            `Comprehensive report for session ${sessionId} is using a fallback action plan: ${describeAIError(openaiError)}`,
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
            contentJson: skippedModelAnswers,
            ...reportMetadata,
          },
          update: { contentJson: skippedModelAnswers, ...reportMetadata },
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
