export type JdLevelValue =
  | 'intern'
  | 'fresher'
  | 'junior'
  | 'middle'
  | 'senior'
  | 'lead';

export type InterviewDurationValue = 30 | 60 | 90;

export type SessionTypeValue = 'hr' | 'technical';

export type ContextPackValue = 'VN' | 'Western';

export interface JdLevelOptionDto {
  value: JdLevelValue;
  label: string;
  defaultSfiaLevel: number;
  aliases: string[];
}

export interface CatalogSfiaLevelOptionDto {
  levelId: number;
  name: string;
  nameVi: string;
  essence: string;
  description: string;
}

export interface DurationOptionDto {
  value: InterviewDurationValue;
  label: string;
  numQuestions: number;
}

export interface SessionTypeOptionDto {
  value: SessionTypeValue;
  label: string;
  shortLabel: string;
  description: string;
}

export interface ContextPackOptionDto {
  value: ContextPackValue;
  label: string;
  description: string;
}

export interface SelectOptionItemDto {
  value: string;
  label: string;
}

export interface InterviewOptionsCatalogResponse {
  jdLevels: JdLevelOptionDto[];
  sfiaLevels: CatalogSfiaLevelOptionDto[];
  durations: DurationOptionDto[];
  sessionTypes: SessionTypeOptionDto[];
  contextPacks: ContextPackOptionDto[];
  educationDegrees: SelectOptionItemDto[];
}
