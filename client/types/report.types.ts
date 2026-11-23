import type { SessionStatus } from './session.types'

export interface AnnotatedSegment {
  id: string
  segmentText: string
  startIndex: number
  endIndex: number
  highlightLevel: string
  annotation: string
  suggestion?: string
}

export type RecommendationStatus =
  'strongly_recommended' | 'recommended' | 'borderline' | 'not_recommended'

export type ReportQuality = 'full' | 'partial' | 'unavailable' | 'not_scorable'

export interface SkillBreakdownItem {
  skillCode: string
  skillName: string
  techContext: string[]
  targetLevel: number
  demonstratedLevel: number
  score: number
  status: 'passed' | 'gap'
  strengths: string
  areasForImprovement: string
}

export interface BinaryCriterionResult {
  criteriaId: string
  passed: boolean
  evidence: string
  deductionReason?: string | null
  criteriaText?: string
  dimension?: 'core' | 'seniority'
}

export interface ActionPlanItem {
  priority: 'high' | 'medium' | 'low'
  skillCode: string
  title: string
  topics: string[]
  estimatedWeeks: number
}

export interface AppliedDimensionScore {
  id: string
  name: string
  score: number
  weight: number
}

export interface ExecutiveSummary {
  overallScore?: number | null
  targetSfiaLevel?: number
  demonstratedSfiaLevel?: number
  recommendationStatus?: RecommendationStatus
  summary?: string
  evaluatedTurns?: number
  fallbackTurns?: number
  [key: string]: unknown
}

export interface TranscriptItem {
  answerId?: string
  questionText: string
  orderIndex: number
  answerText: string
  skipped: boolean
  overallScore: number | null
  modelAnswer: string
  keyTakeaway: string
  isFallback: boolean
  segments: AnnotatedSegment[]
  appliedDimensions?: AppliedDimensionScore[]
  criteriaEvaluations?: BinaryCriterionResult[]
  demonstratedLevel?: number | null
  criteriaPassRate?: number | null
  strengths?: string[]
  improvements?: string[]
}

export interface Report {
  sessionId: string
  reportQuality: ReportQuality
  overallScore: number | null
  recommendationStatus?: RecommendationStatus
  skillsBreakdown?: SkillBreakdownItem[]
  actionPlan:
    | { items?: string[]; actionPlan?: ActionPlanItem[] }
    | Record<string, unknown>
  executiveSummary: ExecutiveSummary
  competencyHeatmap: Record<string, unknown>
  transcript: TranscriptItem[]
}

export interface FeedbackProgress {
  sessionId: string
  status: SessionStatus
  totalQuestions: number
  answeredQuestions: number
  skippedQuestions: number
  feedbackRequired: number
  feedbackCompleted: number
  feedbackPending: number
  reportReady: boolean
}
