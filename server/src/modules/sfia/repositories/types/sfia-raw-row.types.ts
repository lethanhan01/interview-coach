export interface SfiaSkillRawRow {
  code: string;
  name: string;
  categoryCode: string;
  subcategoryCode: string;
  overallDescription: string;
  minLevel: number | string;
  maxLevel: number | string;
}

export interface SfiaLevelRawRow {
  levelId: number | string;
  name: string;
  essence: string;
  description: string;
}

export interface SfiaSkillLevelRawRow {
  skillCode: string;
  levelId: number | string;
  description: string;
}
