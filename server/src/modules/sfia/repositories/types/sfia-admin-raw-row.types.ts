/**
 * Raw Row Types for SFIA Admin Repository SQL Queries
 * Represents data rows returned from PostgreSQL $queryRaw
 */

export interface SfiaCategoryRawRow {
  code: string;
  name: string;
  description: string;
  displayOrder: number;
  skillCount: number;
}

export interface SfiaSubcategoryRawRow {
  code: string;
  categoryCode: string;
  name: string;
  description: string;
  displayOrder: number;
  skillCount: number;
}

export interface SfiaSkillSummaryRawRow {
  code: string;
  name: string;
  categoryCode: string;
  subcategoryCode: string;
  minLevel: number;
  maxLevel: number;
  questionCount: number;
  onetCount: number;
}

export interface SfiaSkillDetailBaseRawRow {
  code: string;
  name: string;
  categoryCode: string;
  subcategoryCode: string;
  overallDescription: string;
  guidanceNotes: string | null;
  minLevel: number;
  maxLevel: number;
  questionCount: number;
  onetCount: number;
}

export interface SfiaSkillLevelStatementRawRow {
  skillCode: string;
  levelId: number;
  description: string;
  essence: string | null;
}

export interface SfiaOnetMappingRawRow {
  socCode: string;
  occupationTitle: string;
  targetLevel: number;
  weight: number;
  isCore: boolean;
}

export interface SfiaQuestionBankRawRow {
  id: string;
  questionText: string;
  type: string;
  difficulty: string;
  targetSfiaLevel: number;
}

export interface SfiaLevelRawRow {
  levelId: number;
  name: string;
  essence: string;
  description: string;
}

export interface SfiaGenericAttributeRawRow {
  code: string;
  name: string;
  description: string;
  displayOrder: number;
}

export interface SfiaGenericAttributeLevelRawRow {
  attributeCode: string;
  levelId: number;
  description: string;
}

export interface SfiaMatrixCellRawRow {
  skillCode: string;
  levelId: number;
  statementSnippet: string | null;
  questionCount: number;
  onetCount: number;
}

export interface SfiaCoverageMetricsRawRow {
  totalSkills: number;
  totalCategories: number;
  totalSubcategories: number;
  totalLevels: number;
  skillsWithQuestions: number;
  skillsWithOnet: number;
  blindSpotsCount: number;
  totalQuestions: number;
  totalActiveMatrixCells: number;
}

export interface SfiaCategoryMetricRawRow {
  code: string;
  name: string;
  skillCount: number;
  questionCount: number;
  mappedOnetCount: number;
}

export interface SfiaLevelMetricRawRow {
  level: number;
  name: string;
  activeCellCount: number;
  questionCount: number;
}

export interface SfiaTopOnetMappedSkillRawRow {
  skillCode: string;
  skillName: string;
  categoryCode: string;
  onetCount: number;
  coreCount: number;
  questionCount: number;
}
