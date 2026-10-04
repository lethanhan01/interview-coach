import type { SessionType } from '@infra/ai/pipelines/interview-pipeline.interface';

export interface ComprehensiveReportJobDto {
  sessionId: string;
  sessionType: SessionType;
  contextPack: 'VN' | 'Western';
  language?: 'vi' | 'en';
  turnIds: string[];
}

export interface SkillLevelDetail {
  code: string;
  name: string;
  weight?: any;
  displayOrder: number;
  skill?: {
    code: string;
    name: string;
    categoryCode?: string;
    categoryName?: string;
  };
  competency?: {
    code: string;
    name: string;
    categoryCode?: string;
    categoryName?: string;
  };
}

export type CriteriaDetail = SkillLevelDetail;

export interface QuestionSkillLevelWrapper {
  skillLevel?: SkillLevelDetail;
  criteria?: SkillLevelDetail;
}

export type QuestionCriterionWrapper = QuestionSkillLevelWrapper;

export interface ReportUserAnswerRecord {
  id: string;
  skipped: boolean;
  question: {
    questionText: string;
    orderIndex: number;
    sfiaSkillCode?: string | null;
    targetLevel?: number | null;
    rubricCriteria?: unknown;
    sessionQuestionSkillLevels?: QuestionSkillLevelWrapper[];
    criteria?: QuestionCriterionWrapper[];
  };
}

export interface ReportFeedbackInput {
  userAnswerId: string;
  overallScore: number;
  keyTakeaway: string;
  isFallback: boolean;
  dimensionScores?: unknown;
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
