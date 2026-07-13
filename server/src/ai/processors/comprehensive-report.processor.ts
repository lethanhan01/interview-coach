import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Prisma } from '@prisma/client';
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

interface ReportFeedbackInput {
  userAnswerId: string;
  overallScore: number;
  keyTakeaway: string;
  isFallback: boolean;
  dimensionScores: unknown;
}

const actionPlanCandidatesSchema = z
  .object({
    items: z.unknown().optional(),
    actionPlan: z.unknown().optional(),
    actions: z.unknown().optional(),
  })
  .passthrough();

const skippedAnswerCandidatesSchema = z
  .object({
    answers: z.array(z.unknown()).optional(),
  })
  .passthrough();

function fallbackSkippedModelAnswer(
  questionText: string,
  language: 'vi' | 'en',
) {
  if (language === 'vi') {
    return `Một câu trả lời tốt nên trả lời trực tiếp câu hỏi "${questionText}", nêu bối cảnh ngắn gọn, đưa ra hành động cụ thể của bạn và kết thúc bằng kết quả hoặc bài học rõ ràng.`;
  }

  return `A strong answer should directly address "${questionText}", briefly set the context, describe your specific actions, and close with a clear result or lesson learned.`;
}

function skippedKeyTakeaway(language: 'vi' | 'en'): string {
  return language === 'vi'
    ? 'Câu hỏi bị bỏ qua nên hệ thống tự chấm 0 điểm cho các tiêu chí áp dụng.'
    : 'This question was skipped, so the system assigned 0 points for each applied criterion.';
}

function normalizeActionPlan(
  raw: unknown,
  fallback: { items: string[] },
): { items: string[] } {
  const rawCandidate = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && !Array.isArray(raw)
      ? raw
      : null;
  if (!rawCandidate) return fallback;

  let candidateItems: unknown[] = [];
  if (Array.isArray(rawCandidate)) {
    candidateItems = rawCandidate;
  } else {
    const parsed = actionPlanCandidatesSchema.safeParse(rawCandidate);
    if (!parsed.success) return fallback;
    const actionPlan = parsed.data.actionPlan;
    if (Array.isArray(parsed.data.items)) {
      candidateItems = parsed.data.items;
    } else if (Array.isArray(actionPlan)) {
      candidateItems = actionPlan;
    } else if (
      actionPlan &&
      typeof actionPlan === 'object' &&
      !Array.isArray(actionPlan)
    ) {
      const nested = actionPlan as Record<string, unknown>;
      candidateItems = Array.isArray(nested.items)
        ? nested.items
        : Array.isArray(nested.actions)
          ? nested.actions
          : [];
    } else if (Array.isArray(parsed.data.actions)) {
      candidateItems = parsed.data.actions;
    }
  }
  const items = candidateItems
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  const merged: string[] = [];
  for (const item of [...items, ...fallback.items]) {
    if (!merged.includes(item)) merged.push(item);
    if (merged.length === 5) break;
  }

  return merged.length >= 3 ? { items: merged } : fallback;
}

function readStringAlias(
  record: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function normalizeSkippedAnswers(
  raw: unknown,
  fallback: { answers: { answerId: string; modelAnswer: string }[] },
): { answers: { answerId: string; modelAnswer: string }[] } {
  const parsed = skippedAnswerCandidatesSchema.safeParse(raw);
  if (!parsed.success || !Array.isArray(parsed.data.answers)) return fallback;

  const allowedIds = new Set(fallback.answers.map((answer) => answer.answerId));
  const byId = new Map<string, string>();
  for (const item of parsed.data.answers) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const answerId = readStringAlias(record, 'answerId', 'answer_id', 'id');
    const modelAnswer = readStringAlias(
      record,
      'modelAnswer',
      'model_answer',
      'answer',
    );
    if (answerId && modelAnswer && allowedIds.has(answerId)) {
      byId.set(answerId, modelAnswer);
    }
  }

  return {
    answers: fallback.answers.map((answer) => ({
      answerId: answer.answerId,
      modelAnswer: byId.get(answer.answerId) ?? answer.modelAnswer,
    })),
  };
}

function toDimensionScores(value: unknown): { id: string; score: number }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    return typeof record.id === 'string' && typeof record.score === 'number'
      ? [{ id: record.id, score: record.score }]
      : [];
  });
}

function buildCompetencyHeatmap(
  feedbacks: { isFallback: boolean; dimensionScores: unknown }[],
): Record<string, number> {
  const totals = new Map<string, { sum: number; count: number }>();

  for (const feedback of feedbacks) {
    if (feedback.isFallback) continue;
    for (const dimension of toDimensionScores(feedback.dimensionScores)) {
      const current = totals.get(dimension.id) ?? { sum: 0, count: 0 };
      totals.set(dimension.id, {
        sum: current.sum + dimension.score,
        count: current.count + 1,
      });
    }
  }

  return Object.fromEntries(
    Array.from(totals.entries()).map(([id, total]) => [
      id,
      Math.round((total.sum / total.count) * 10) / 10,
    ]),
  );
}

function buildSkippedDimensionScores(
  criteria: {
    rubricCriterion: {
      code: string;
      name: string;
      weight: number;
      displayOrder: number;
      rubricCategory: {
        categoryKey: string;
      };
    };
  }[],
) {
  return criteria
    .slice()
    .sort((a, b) => {
      const categoryOrder =
        a.rubricCriterion.rubricCategory.categoryKey.localeCompare(
          b.rubricCriterion.rubricCategory.categoryKey,
        );
      if (categoryOrder !== 0) return categoryOrder;

      const displayOrder =
        a.rubricCriterion.displayOrder - b.rubricCriterion.displayOrder;
      if (displayOrder !== 0) return displayOrder;

      return a.rubricCriterion.code.localeCompare(b.rubricCriterion.code);
    })
    .map((criterion) => ({
      id: criterion.rubricCriterion.code,
      name: criterion.rubricCriterion.name,
      score: 0,
      weight: criterion.rubricCriterion.weight,
    }));
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
        question: {
          select: {
            questionText: true,
            orderIndex: true,
            criteria: {
              select: {
                rubricCriterion: {
                  select: {
                    code: true,
                    name: true,
                    weight: true,
                    displayOrder: true,
                    rubricCategory: {
                      select: { categoryKey: true },
                    },
                  },
                },
              },
            },
          },
        },
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

    const syntheticSkippedFeedbacks: ReportFeedbackInput[] = skippedAnswers.map(
      (answer) => ({
        userAnswerId: answer.id,
        overallScore: 0,
        keyTakeaway: skippedKeyTakeaway(language),
        isFallback: false,
        dimensionScores: buildSkippedDimensionScores(answer.question.criteria),
      }),
    );
    const allFeedbacks: ReportFeedbackInput[] = [
      ...feedbacks,
      ...syntheticSkippedFeedbacks,
    ];
    const evaluatedFeedbacks = allFeedbacks.filter(
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
      fallbackTurns: allFeedbacks.length - evaluatedFeedbacks.length,
      skippedTurns: skippedAnswers.length,
      summary:
        aggregatedScore === null
          ? getFallbackReportSummary(language)
          : language === 'vi'
            ? `Phiên phỏng vấn đã hoàn thành với ${evaluatedFeedbacks.length} câu trả lời được đánh giá. Điểm tổng quan: ${aggregatedScore}/100.`
            : `Interview completed with ${evaluatedFeedbacks.length} evaluated answers. Overall score: ${aggregatedScore}/100.`,
    };

    const commAnalysis = {
      feedbackCount: allFeedbacks.length,
      evaluatedFeedbackCount: evaluatedFeedbacks.length,
      fallbackFeedbackCount: allFeedbacks.length - evaluatedFeedbacks.length,
      skippedFeedbackCount: skippedAnswers.length,
    };

    const competencyHeatmap = buildCompetencyHeatmap(allFeedbacks);

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
          task: 'report',
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

        skippedModelAnswers = normalizeSkippedAnswers(
          JSON.parse(raw) as unknown,
          skippedModelAnswers,
        );
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
        const feedbackSummaries = evaluatedFeedbacks.map((f, i) => ({
          answerIndex: i + 1,
          answerId: f.userAnswerId,
          score: f.overallScore,
          keyTakeaway: f.keyTakeaway,
          isFallback: f.isFallback,
        }));

        const raw = await this.openai.chatCompletion({
          temperature: COMPREHENSIVE_REPORT_PROMPT_CONFIG.temperature,
          maxTokens: COMPREHENSIVE_REPORT_PROMPT_CONFIG.maxTokens,
          responseFormat: 'json_object',
          task: 'report',
          messages: [
            {
              role: 'system',
              content: [
                'You are an interview coach. Based on the feedback summaries, generate a concise action plan with 3-5 specific improvement items. Prioritize non-fallback feedback; fallback rows are only context.',
                getLanguageInstruction(language),
                'Respond with JSON only: { "items": ["item1", "item2", ...] }. Do not use markdown.',
              ].join(' '),
            },
            {
              role: 'user',
              content: `Feedback summaries JSON:\n${JSON.stringify(feedbackSummaries)}`,
            },
          ],
        });

        const parsed = JSON.parse(raw) as unknown;
        actionPlan = normalizeActionPlan(parsed, actionPlan);
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
      generatedByModel: this.openai.getChatModel('report'),
      promptVersion: COMPREHENSIVE_REPORT_PROMPT_CONFIG.version,
    };

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
              promptVersion: COMPREHENSIVE_REPORT_PROMPT_CONFIG.version,
              isFallback: feedback.isFallback,
              dimensionScores:
                feedback.dimensionScores as Prisma.InputJsonValue,
            },
            update: {
              overallScore: feedback.overallScore,
              modelAnswer: '',
              keyTakeaway: feedback.keyTakeaway,
              promptVersion: COMPREHENSIVE_REPORT_PROMPT_CONFIG.version,
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
