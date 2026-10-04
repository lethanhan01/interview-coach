export interface SfiaSkillDto {
  code: string;
  name: string;
  categoryCode: string;
  subcategoryCode: string;
  overallDescription: string;
  minLevel: number;
  maxLevel: number;
}

export interface SfiaLevelDto {
  levelId: number;
  name: string;
  essence: string;
  description: string;
}
