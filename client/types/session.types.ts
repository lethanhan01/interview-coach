import type { ContextPack, OutputLanguage, SessionType } from './common.types'
import type { VoiceMetrics } from './media.types'

export type SessionStatus =
  | 'generating'
  | 'ready'
  | 'active'
  | 'paused'
  | 'completing'
  | 'completed'
  | 'canceled'
  | 'error'

export type SessionStatusAction = 'active' | 'paused' | 'completed' | 'canceled'

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

export interface SessionsListResponse {
  sessions: Session[]
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

export interface CreateSessionResponse {
  id: string
}

export interface SessionStatusResponse {
  status: SessionStatus
  numQuestions: number
}

export interface UpdateSessionStatusPayload {
  status: SessionStatusAction
  remainingSeconds?: number
  autoSkipUnanswered?: boolean
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

export interface SubmitAnswerPayload {
  questionId: string
  answerMode: 'text' | 'voice'
  answerText?: string
  skipQuestion?: boolean
  audioDurationSeconds?: number
  voiceMetrics?: VoiceMetrics
}

export interface TurnResponse {
  turnId?: string
  status?: string
  feedbackGenerated?: boolean
  questionId?: string
  answerText?: string
}
