export type SessionStatus = 'generating' | 'ready' | 'active' | 'completed' | 'error'
export type SessionType = 'hr' | 'technical' | 'mixed'
export type ContextPack = 'VN' | 'Western'

export interface Session {
  id: string
  userId: string
  sessionType: SessionType
  contextPackId: ContextPack
  status: SessionStatus
  numQuestions: number
  durationMin?: number
  jobDescription: string
  createdAt: string
  completedAt?: string
  overallScore?: number
}

export interface CreateSessionPayload {
  jobDescription: string
  sessionType: SessionType
  contextPack: ContextPack
  numQuestions?: number
  targetRoles?: string[]
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

export interface TranscriptItem {
  questionText: string
  orderIndex: number
  answerText: string
  overallScore: number
  modelAnswer: string
  keyTakeaway: string
  segments: AnnotatedSegment[]
}

export interface Report {
  sessionId: string
  overallScore: number
  executiveSummary: Record<string, unknown>
  competencyHeatmap: Record<string, unknown>
  actionPlan: Record<string, unknown>
  transcript: TranscriptItem[]
}
