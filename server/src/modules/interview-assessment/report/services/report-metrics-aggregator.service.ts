import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { getFallbackReportSummary } from '@infra/ai/fallback-content';
import type {
  ActionPlanContent,
  CommAnalysisContent,
  ExecutiveSummaryContent,
  QuestionCriterionWrapper,
  ReportFeedbackInput,
  ReportUserAnswerRecord,
  SkippedDimensionScore,
  SkippedModelAnswersContent,
} from '../types/report-generation.types';

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

@Injectable()
export class ReportMetricsAggregator {
  fallbackSkippedModelAnswer(
    questionText: string,
    language: 'vi' | 'en',
  ): string {
    if (language === 'vi') {
      return `Một câu trả lời tốt nên trả lời trực tiếp câu hỏi "${questionText}", nêu bối cảnh ngắn gọn, đưa ra hành động cụ thể của bạn và kết thúc bằng kết quả hoặc bài học rõ ràng.`;
    }

    return `A strong answer should directly address "${questionText}", briefly set the context, describe your specific actions, and close with a clear result or lesson learned.`;
  }

  skippedKeyTakeaway(language: 'vi' | 'en'): string {
    return language === 'vi'
      ? 'Câu hỏi bị bỏ qua nên hệ thống tự chấm 0 điểm cho các tiêu chí áp dụng.'
      : 'This question was skipped, so the system assigned 0 points for each applied criterion.';
  }

  buildSkippedDimensionScores(
    criteria: QuestionCriterionWrapper[],
  ): SkippedDimensionScore[] {
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

  buildSyntheticSkippedFeedbacks(
    skippedAnswers: ReportUserAnswerRecord[],
    language: 'vi' | 'en',
  ): ReportFeedbackInput[] {
    return skippedAnswers.map((answer) => ({
      userAnswerId: answer.id,
      overallScore: 0,
      keyTakeaway: this.skippedKeyTakeaway(language),
      isFallback: false,
      dimensionScores: this.buildSkippedDimensionScores(
        answer.question.criteria,
      ),
    }));
  }

  calculateAggregatedScore(
    evaluatedFeedbacks: ReportFeedbackInput[],
  ): number | null {
    if (evaluatedFeedbacks.length === 0) return null;
    return Math.round(
      evaluatedFeedbacks.reduce((sum, f) => sum + f.overallScore, 0) /
        evaluatedFeedbacks.length,
    );
  }

  toDimensionScores(value: unknown): { id: string; score: number }[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const record = item as Record<string, unknown>;
      return typeof record.id === 'string' && typeof record.score === 'number'
        ? [{ id: record.id, score: record.score }]
        : [];
    });
  }

  buildCompetencyHeatmap(
    feedbacks: { isFallback: boolean; dimensionScores: unknown }[],
  ): Record<string, number> {
    const totals = new Map<string, { sum: number; count: number }>();

    for (const feedback of feedbacks) {
      if (feedback.isFallback) continue;
      for (const dimension of this.toDimensionScores(feedback.dimensionScores)) {
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

  buildExecutiveSummary(params: {
    totalTurns: number;
    evaluatedTurns: number;
    fallbackTurns: number;
    skippedTurns: number;
    aggregatedScore: number | null;
    language: 'vi' | 'en';
  }): ExecutiveSummaryContent {
    const {
      totalTurns,
      evaluatedTurns,
      fallbackTurns,
      skippedTurns,
      aggregatedScore,
      language,
    } = params;

    let summary: string;
    if (aggregatedScore === null) {
      summary = getFallbackReportSummary(language);
    } else if (language === 'vi') {
      summary = `Phiên phỏng vấn đã hoàn thành với ${evaluatedTurns} câu trả lời được đánh giá. Điểm tổng quan: ${aggregatedScore}/100.`;
    } else {
      summary = `Interview completed with ${evaluatedTurns} evaluated answers. Overall score: ${aggregatedScore}/100.`;
    }

    return {
      overallScore: aggregatedScore,
      totalTurns,
      evaluatedTurns,
      fallbackTurns,
      skippedTurns,
      summary,
    };
  }

  buildCommAnalysis(params: {
    feedbackCount: number;
    evaluatedFeedbackCount: number;
    fallbackFeedbackCount: number;
    skippedFeedbackCount: number;
  }): CommAnalysisContent {
    return {
      feedbackCount: params.feedbackCount,
      evaluatedFeedbackCount: params.evaluatedFeedbackCount,
      fallbackFeedbackCount: params.fallbackFeedbackCount,
      skippedFeedbackCount: params.skippedFeedbackCount,
    };
  }

  normalizeActionPlan(
    raw: unknown,
    fallback: ActionPlanContent,
  ): ActionPlanContent {
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

  normalizeSkippedAnswers(
    raw: unknown,
    fallback: SkippedModelAnswersContent,
  ): SkippedModelAnswersContent {
    const parsed = skippedAnswerCandidatesSchema.safeParse(raw);
    if (!parsed.success || !Array.isArray(parsed.data.answers)) return fallback;

    const allowedIds = new Set(
      fallback.answers.map((answer) => answer.answerId),
    );
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
}
