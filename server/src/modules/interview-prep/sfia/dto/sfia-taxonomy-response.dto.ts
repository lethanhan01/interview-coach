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

export class SfiaSkillLevelDto {
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

export class SfiaSkillDto {
  id!: string;
  code!: string;
  name!: string;
  overallDescription?: string | null;
  guidanceNotes?: string | null;
  categoryName?: string;
  subcategoryName?: string;
  skillLevels!: SfiaSkillLevelDto[];
}

export class InferredSessionSkillDto {
  skillId!: string;
  skillCode!: string;
  skillName!: string;
  targetLevelRank!: number;
  targetLevelName!: string;
  levelDescription!: string;
  weight!: number;
  priority!: number;
  source!: 'role_matrix' | 'jd_tech_stack' | 'fallback_general';
  matchedKeywords?: string[];

  // Compatibility fields
  competencyId?: string;
  competencyCode?: string;
  competencyName?: string;
}

// Backwards compatibility types
export type SfiaCriterionDto = SfiaSkillLevelDto;
export type SfiaCompetencyDto = SfiaSkillDto;
export type InferredSessionCompetencyDto = InferredSessionSkillDto;
