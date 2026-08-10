import type { ContextPackConfig } from '../../assessment/context-pack.service';
import type { OutputLanguage } from '../output-language';
export {
  SESSION_TYPES,
  type SessionType,
  isSessionType,
} from '../../common/constants/session.constants';
import type { SessionType } from '../../common/constants/session.constants';

export type QuestionBankSessionType = 'hr' | 'technical';

export interface QuestionGenInput {
  sessionType: SessionType;
  jobDescriptionText: string;
  targetRoles: string[];
  contextPackConfig: ContextPackConfig;
  language?: OutputLanguage;
  totalQuestions: number;
}

export interface GeneratedQuestion {
  text: string;
  category: string;
  competencyDomains: string[];
  difficulty: number;
}

export interface FeedbackInput {
  sessionType: SessionType;
  questionId?: string;
  questionText: string;
  questionCategory?: 'behavioral' | 'technical';
  competencyDomains: string[];
  answerText: string;
  contextPackConfig: ContextPackConfig;
  language?: OutputLanguage;
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

export interface AppliedDimension {
  id: string;
  name: string;
  score: number; // 0-100
  weight: number; // base weight đã chuẩn hóa, tổng ≈ 1.0
}

export interface SurgicalFeedback {
  overallScore: number; // 0-100
  modelAnswer: string;
  keyTakeaway: string;
  promptVersion: string;
  appliedDimensions: AppliedDimension[];
  annotatedSegments: AnnotatedSegmentResult[];
}

export interface InterviewPipeline {
  readonly sessionType: SessionType;
  generateQuestions(input: QuestionGenInput): Promise<GeneratedQuestion[]>;
  evaluateAnswer(input: FeedbackInput): Promise<SurgicalFeedback>;
}
