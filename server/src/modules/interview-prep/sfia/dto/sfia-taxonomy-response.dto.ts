export interface BehavioralIndicatorItem {
  id: string;
  statement: string;
  keywords: string[];
  rubric: string;
}

export interface GenericAttributesSnapshot {
  autonomy?: string;
  influence?: string;
  complexity?: string;
  knowledge?: string;
  businessSkills?: string;
}

export class SfiaCriterionDto {
  id!: string;
  code!: string;
  name!: string;
  levelRank!: number;
  levelCode!: string;
  levelName!: string;
  levelDescription!: string;
  behavioralIndicators?: BehavioralIndicatorItem[];
  genericAttributes?: GenericAttributesSnapshot | null;
  weight?: number;
}

export class SfiaCompetencyDto {
  id!: string;
  code!: string;
  name!: string;
  overallDescription?: string | null;
  guidanceNotes?: string | null;
  categoryName?: string;
  subcategoryName?: string;
  criteria!: SfiaCriterionDto[];
}

export class InferredSessionCompetencyDto {
  competencyId!: string;
  competencyCode!: string;
  competencyName!: string;
  targetLevelRank!: number;
  targetLevelName!: string;
  levelDescription!: string;
  weight!: number;
  priority!: number;
  source!: 'role_matrix' | 'jd_tech_stack' | 'fallback_general';
  matchedKeywords?: string[];
}
