export type SfiaMainTab = 'taxonomy' | 'matrix' | 'attributes' | 'analytics'

export interface SfiaCategory {
  code: string
  name: string
  nameVi: string
  description: string
  displayOrder: number
  skillCount: number
}

export interface SfiaSubcategory {
  code: string
  categoryCode: string
  name: string
  nameVi: string
  description: string
  skillCount: number
}

export interface SfiaSkillSummary {
  code: string
  name: string
  categoryCode: string
  subcategoryCode: string
  minLevel: number
  maxLevel: number
  questionCount: number
  onetCount: number
}

export interface SfiaSkillLevelStatement {
  skillCode: string
  levelId: number
  description: string
  essence?: string
}

export interface SfiaOnetMappingItem {
  id?: string
  socCode: string
  occupationTitle: string
  targetLevel: number
  weight: number
  isCore: boolean
}

export type SfiaQuestionType = 'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' | 'HR'

export type SfiaQuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface SfiaQuestionBankItem {
  id: string
  questionText: string
  type: SfiaQuestionType
  difficulty: SfiaQuestionDifficulty
  targetSfiaLevel: number
}

export interface SfiaSkillDetail extends SfiaSkillSummary {
  overallDescription: string
  guidanceNotes?: string
  skillLevels: SfiaSkillLevelStatement[]
  onetMappings: SfiaOnetMappingItem[]
  questionBankItems: SfiaQuestionBankItem[]
}

export interface SfiaLevelResponsibility {
  levelId: number
  name: string
  nameVi: string
  essence: string
  description: string
}

export type SfiaLevelDto = SfiaLevelResponsibility

export interface SfiaGenericAttribute {
  code: string
  name: string
  nameVi: string
  description: string
  levels: Record<number, string>
}

export type SfiaMatrixDisplayMode = 'questions' | 'onet'

export interface SfiaMatrixCellData {
  skillCode: string
  levelId: number
  isAvailable: boolean
  questionCount: number
  onetCount: number
  statementSnippet?: string
}

export interface SfiaCategoryMetric {
  code: string
  name: string
  nameVi: string
  skillCount: number
  questionCount: number
  mappedOnetCount: number
}

export interface SfiaLevelMetric {
  level: number
  name: string
  shortName: string
  activeCellCount: number
  questionCount: number
}

export interface SfiaTopOnetMappedSkill {
  skillCode: string
  skillName: string
  categoryCode: string
  onetCount: number
  coreCount: number
  questionCount: number
}

export interface SfiaCoverageStats {
  totalSkills: number
  totalCategories: number
  totalSubcategories: number
  totalLevels: number
  skillsWithQuestions: number
  skillsWithOnet: number
  blindSpotsCount: number
  totalQuestions: number
  totalActiveMatrixCells: number
  categoryDistribution: SfiaCategoryMetric[]
  levelDistribution: SfiaLevelMetric[]
  topOnetMappedSkills: SfiaTopOnetMappedSkill[]
}

export interface SfiaSkillFilters {
  categoryCode?: string
  subcategoryCode?: string
  level?: number
  query?: string
}

export interface SfiaMatrixDataResponse {
  skills: SfiaSkillSummary[]
  categories: SfiaCategory[]
  cells: Record<string, SfiaMatrixCellData>
}

export interface CreateSfiaQuestionPayload {
  questionText: string
  type: SfiaQuestionType
  difficulty: SfiaQuestionDifficulty
  targetSfiaLevel: number
}
