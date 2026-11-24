export interface SfiaSkillDto {
  code: string;
  name: string;
  categoryCode: string;
  categoryName?: string;
  subcategoryCode: string;
  overallDescription: string;
  minLevel: number;
  maxLevel: number;
  levelDescriptions?: Record<number, string>;
}

export interface SfiaLevelDto {
  levelId: number;
  name: string;
  nameVi?: string;
  essence: string;
  description: string;
}
