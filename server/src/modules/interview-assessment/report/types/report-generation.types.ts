import { Prisma } from '@prisma/client';
import type { SessionType } from '@infra/ai/pipelines/interview-pipeline.interface';

export interface ComprehensiveReportJobDto {
  sessionId: string;
  sessionType: SessionType;
  contextPack: 'VN' | 'Western';
  language?: 'vi' | 'en';
  turnIds: string[];
}

export interface RubricCriterionDetail {
  code: string;
  name: string;
  weight: number;
  displayOrder: number;
  rubricCategory: {
    categoryKey: string;
  };
}

export interface QuestionCriterionWrapper {
  rubricCriterion: RubricCriterionDetail;
}

export interface ReportUserAnswerRecord {
  id: string;
  skipped: boolean;
  question: {
    questionText: string;
    orderIndex: number;
    criteria: QuestionCriterionWrapper[];
  };
}

export interface ReportFeedbackInput {
  userAnswerId: string;
  overallScore: number;
  keyTakeaway: string;
  isFallback: boolean;
  dimensionScores: unknown;
}

export interface ReportCollectedData {
  sessionId: string;
  answers: ReportUserAnswerRecord[];
  skippedAnswers: ReportUserAnswerRecord[];
  answeredTurnIds: string[];
  feedbacks: ReportFeedbackInput[];
}

export interface SkippedDimensionScore {
  id: string;
  name: string;
  score: number;
  weight: number;
}

export interface ExecutiveSummaryContent {
  overallScore: number | null;
  totalTurns: number;
  evaluatedTurns: number;
  fallbackTurns: number;
  skippedTurns: number;
  summary: string;
}

export interface CommAnalysisContent {
  feedbackCount: number;
  evaluatedFeedbackCount: number;
  fallbackFeedbackCount: number;
  skippedFeedbackCount: number;
}

export interface SkippedModelAnswersContent {
  answers: { answerId: string; modelAnswer: string }[];
}

export interface ActionPlanContent {
  items: string[];
}

export interface ReportCalculatedMetrics {
  syntheticSkippedFeedbacks: ReportFeedbackInput[];
  allFeedbacks: ReportFeedbackInput[];
  evaluatedFeedbacks: ReportFeedbackInput[];
  aggregatedScore: number | null;
  executiveSummary: ExecutiveSummaryContent;
  commAnalysis: CommAnalysisContent;
  competencyHeatmap: Record<string, number>;
  defaultSkippedModelAnswers: SkippedModelAnswersContent;
  defaultActionPlan: ActionPlanContent;
}

export interface ReportMetadata {
  generatedByModel: string;
  promptVersion: string;
}

export interface ReportAiOutputs {
  skippedModelAnswers: SkippedModelAnswersContent;
  actionPlan: ActionPlanContent;
  reportMetadata: ReportMetadata;
}

export interface ReportFinalPayload {
  aggregatedScore: number | null;
  syntheticSkippedFeedbacks: ReportFeedbackInput[];
  executiveSummary: ExecutiveSummaryContent;
  commAnalysis: CommAnalysisContent;
  competencyHeatmap: Record<string, number>;
  actionPlan: ActionPlanContent;
  skippedModelAnswers: SkippedModelAnswersContent;
  reportMetadata: ReportMetadata;
}
