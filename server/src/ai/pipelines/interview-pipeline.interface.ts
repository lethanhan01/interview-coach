import type { ContextPackConfig } from '../context-pack.service';

export const SESSION_TYPES = ['hr', 'technical', 'mixed'] as const;

export type SessionType = (typeof SESSION_TYPES)[number];

export function isSessionType(value: string): value is SessionType {
  return (SESSION_TYPES as readonly string[]).includes(value);
}

export type QuestionBankSessionType = 'hr' | 'technical';

export interface QuestionGenInput {
  sessionType: SessionType;
  jobDescriptionText: string;
  targetRoles: string[];
  contextPackConfig: ContextPackConfig;
  totalQuestions: number;
}

export interface GeneratedQuestion {
  text: string;
  category: string;
  competencyDomain: string;
  difficulty: number;
}

export interface FeedbackInput {
  sessionType: SessionType;
  questionText: string;
  answerText: string;
  contextPackConfig: ContextPackConfig;
}

export interface AnnotatedSegmentResult {
  segmentText: string;
  startIndex: number;
  endIndex: number;
  highlightLevel: 'strength' | 'improvement';
  annotation: string;
  suggestion?: string;
  improvedVersion?: string;
}

export interface SurgicalFeedback {
  overallScore: number; // 1-100
  modelAnswer: string;
  keyTakeaway: string;
  promptVersion: string;
  annotatedSegments: AnnotatedSegmentResult[];
}

export interface InterviewPipeline {
  generateQuestions(input: QuestionGenInput): Promise<GeneratedQuestion[]>;
  evaluateAnswer(input: FeedbackInput): Promise<SurgicalFeedback>;
}
