export type SessionStatus =
  | "generating"
  | "ready"
  | "active"
  | "paused"
  | "completing"
  | "completed"
  | "canceled"
  | "error";
export type SessionType = "hr" | "technical" | "mixed";
export type ContextPack = "VN" | "Western";
export type OutputLanguage = "vi" | "en";

export interface Session {
  id: string;
  userId: string;
  jobTitle?: string | null;
  sessionType: SessionType;
  contextPackId: ContextPack;
  language?: OutputLanguage;
  savedJobDescriptionId?: string | null;
  status: SessionStatus;
  numQuestions: number;
  durationMin?: number;
  jobDescription: string;
  createdAt: string;
  completedAt?: string;
  overallScore?: number;
}

export interface CreateSessionPayload {
  jobDescription: string;
  sessionType: SessionType;
  contextPack: ContextPack;
  language?: OutputLanguage;
  numQuestions?: number;
  targetRoles?: string[];
  savedJobDescriptionId?: string;
}

export interface SavedJobDescription {
  id: string;
  userId: string;
  companyName: string;
  companyWebsite?: string | null;
  jobTitle: string;
  headcount?: string | null;
  location?: string | null;
  requirements: string;
  jobContent: string;
  techStack: string[];
  benefits?: string | null;
  salary?: string | null;
  bonus?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveJobDescriptionPayload {
  companyName: string;
  companyWebsite?: string;
  jobTitle: string;
  headcount?: string;
  location?: string;
  requirements: string;
  jobContent: string;
  techStack?: string[];
  benefits?: string;
  salary?: string;
  bonus?: string;
}

export interface AnnotatedSegment {
  id: string;
  segmentText: string;
  startIndex: number;
  endIndex: number;
  highlightLevel: string;
  annotation: string;
  suggestion?: string;
}

export interface TranscriptItem {
  answerId?: string;
  questionText: string;
  orderIndex: number;
  answerText: string;
  skipped: boolean;
  overallScore: number | null;
  modelAnswer: string;
  keyTakeaway: string;
  isFallback: boolean;
  segments: AnnotatedSegment[];
}

export interface Report {
  sessionId: string;
  reportQuality: 'full' | 'partial' | 'unavailable' | 'not_scorable';
  overallScore: number | null;
  executiveSummary: Record<string, unknown>;
  competencyHeatmap: Record<string, unknown>;
  actionPlan: Record<string, unknown>;
  transcript: TranscriptItem[];
}

export interface EducationEntry {
  degree: string;
  school: string;
  major: string;
  gpa: string;
  graduationYear: string;
}

export interface WorkExperienceEntry {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  techStack: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  url: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface TechnicalSkillEntry {
  id: string;
  category:
    | "language"
    | "framework"
    | "os"
    | "database"
    | "platform"
    | "devtool";
  name: string;
  usagePeriod: number;
}

export interface CertificationEntry {
  id: string;
  type: "professional" | "language";
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  score?: string;
}

export interface AwardEntry {
  id: string;
  name: string;
  organization: string;
  date: string;
  description: string;
}

export interface GetProfileResponse {
  id: string;
  email: string;
  profile: {
    fullName?: string;
    personality?: string;
    targetPosition?: string;
    targetRoleCategory?: string;
    targetLevel?: string;
    preferredTechStack?: string;
    yearsExperience?: number;
    education?: EducationEntry;
    workExperience?: WorkExperienceEntry[];
    projects?: ProjectEntry[];
    technicalSkills?: TechnicalSkillEntry[];
    certifications?: CertificationEntry[];
    awards?: AwardEntry[];
  } | null;
}
