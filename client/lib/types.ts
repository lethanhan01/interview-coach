export type SessionStatus =
  | 'generating'
  | 'ready'
  | 'active'
  | 'paused'
  | 'completing'
  | 'completed'
  | 'canceled'
  | 'error'
export type SessionType = 'hr' | 'technical'
export type ContextPack = 'VN' | 'Western'
export type OutputLanguage = 'vi' | 'en'

export interface RubricDimension {
  code: string
  nameVi: string
  weightPct: number
}

export interface RubricCategory {
  label: string
  categoryWeightPct: number
  dimensions: RubricDimension[]
}

export interface RubricConfig {
  contextPackId: ContextPack
  sessionType: SessionType
  categories: RubricCategory[]
  hint: string
}

export interface Session {
  id: string
  userId: string
  jobTitle?: string | null
  sessionType: SessionType
  contextPackId: ContextPack
  language?: OutputLanguage
  savedJobDescriptionId?: string | null
  status: SessionStatus
  numQuestions: number
  durationMin?: number
  remainingSeconds?: number | null
  jobDescription: string
  createdAt: string
  completedAt?: string
  overallScore?: number
}

export interface CreateSessionPayload {
  jobDescription: string
  sessionType: SessionType
  contextPack: ContextPack
  language?: OutputLanguage
  numQuestions?: number
  targetRoles?: string[]
  savedJobDescriptionId?: string
  targetSfiaLevel?: number
  onetSocCode?: string
}

export interface SavedJobDescription {
  id: string
  userId: string
  companyName: string
  companyWebsite?: string | null
  jobTitle: string
  level?: string | null
  headcount?: string | null
  location?: string | null
  requirements: string
  jobContent: string
  techStack: string[]
  benefits?: string | null
  salary?: string | null
  bonus?: string | null
  onetSocCode?: string | null
  onetOccupationTitle?: string | null
  targetSfiaLevel?: number | null
  normalizedTechStack?: string[] | null
  lastUsedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface SaveJobDescriptionPayload {
  companyName: string
  companyWebsite?: string
  jobTitle: string
  level: string
  headcount?: string
  location?: string
  requirements: string
  jobContent: string
  techStack?: string[]
  benefits?: string
  salary?: string
  bonus?: string
  onetSocCode?: string
  onetOccupationTitle?: string
  targetSfiaLevel?: number
}

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
  | 'strongly_recommended'
  | 'recommended'
  | 'borderline'
  | 'not_recommended'

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
  appliedDimensions?: {
    id: string
    name: string
    score: number
    weight: number
  }[]
  criteriaEvaluations?: BinaryCriterionResult[]
  demonstratedLevel?: number | null
  criteriaPassRate?: number | null
  strengths?: string[]
  improvements?: string[]
}

export interface Report {
  sessionId: string
  reportQuality: 'full' | 'partial' | 'unavailable' | 'not_scorable'
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

export interface EducationEntry {
  degree: string
  school: string
  major: string
  gpa: string
  graduationYear: string
}

export interface WorkExperienceEntry {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
  techStack: string[]
}

export interface ProjectEntry {
  id: string
  name: string
  description: string
  techStack: string[]
  url: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

export interface TechnicalSkillEntry {
  id: string
  category:
    'language' | 'framework' | 'os' | 'database' | 'platform' | 'devtool'
  name: string
  usagePeriod: number
}

export interface CertificationEntry {
  id: string
  type: 'professional' | 'language'
  name: string
  issuer: string
  issueDate: string
  expiryDate?: string
  score?: string
}

export interface AwardEntry {
  id: string
  name: string
  organization: string
  date: string
  description: string
}

export interface GetProfileResponse {
  id: string
  email: string
  firstname?: string
  lastname?: string
  profile: {
    targetPosition?: string | null
    targetLevel?: string | null
    personality?: string
    education?: EducationEntry
    workExperience?: WorkExperienceEntry[]
    projects?: ProjectEntry[]
    technicalSkills?: TechnicalSkillEntry[]
    certifications?: CertificationEntry[]
    awards?: AwardEntry[]
  } | null
}

export interface ChangePasswordResponse {
  success: boolean
  data?: {
    id: string
    email: string
    role: string
    status: string
    firstname: string | null
    lastname: string | null
  }
}

export interface RegisterPayload {
  email: string
  password: string
  firstname: string
  lastname: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface PasswordResetRequestPayload {
  email: string
}

export interface PasswordResetConfirmPayload {
  email: string
  code: string
  newPassword: string
}

export interface AuthUser {
  id: string
  email: string
  role: 'candidate' | 'admin'
  status: string
  firstname: string | null
  lastname: string | null
}

export interface AdminUser {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
  firstname?: string | null
  lastname?: string | null
}

export interface Question {
  id: string
  content: string
  orderIndex: number
  answered?: boolean
  answerId?: string
  skipped?: boolean
  skillCode?: string
  skillName?: string
  techContext?: string[]
  targetLevel?: number
}

export interface QuestionsResponse {
  questions: Question[]
  currentIndex?: number
}

export type SessionStatusAction = 'active' | 'paused' | 'completed' | 'canceled'

export interface UpdateSessionStatusPayload {
  status: SessionStatusAction
  remainingSeconds?: number
  autoSkipUnanswered?: boolean
}

export interface SubmitAnswerPayload {
  questionId: string
  answerMode: 'text' | 'voice'
  answerText?: string
  skipQuestion?: boolean
  audioFileUrl?: string
  audioDurationSeconds?: number
  audioSizeBytes?: number
}

export interface TurnResponse {
  turnId?: string
  status?: string
  feedbackGenerated?: boolean
  questionId?: string
  answerText?: string
}

export interface AudioUploadResult {
  audioFileUrl: string
  audioSizeBytes: number
  mediaKey?: string
  transcript: string
  transcriptDurationSeconds?: number
}



