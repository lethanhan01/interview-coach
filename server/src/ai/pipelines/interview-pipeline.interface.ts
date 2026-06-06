import type { ContextPackConfig } from '../context-pack.service';

export type SessionType = 'HR' | 'Technical' | 'Mixed';

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

export interface FollowUpInput {
  sessionType: SessionType;
  questionText: string;
  answerText: string;
  contextPackConfig: ContextPackConfig;
}

export interface FollowUpResult {
  followUpText: string;
  triggerReason: string;
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
  generateFollowUp(input: FollowUpInput): Promise<FollowUpResult | null>;
  evaluateAnswer(input: FeedbackInput): Promise<SurgicalFeedback>;
}
