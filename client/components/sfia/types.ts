/**
 * Types & Data Contracts for SFIA 9 Knowledge Browser (/admin/sfia)
 * Strictly aligned with SFIA 9 Foundation standard and PostgreSQL schema
 */

export type SfiaMainTab = 'taxonomy' | 'matrix' | 'attributes' | 'analytics'

export interface SfiaCategory {
  code: string // e.g. "STRAT_ARCH", "DEV_IMPL"
  name: string // "Development and implementation"
  nameVi: string // "Phát triển & Triển khai"
  description: string
  displayOrder: number
  skillCount: number
}

export interface SfiaSubcategory {
  code: string // e.g. "SYS_DEV", "DATA_ANA"
  categoryCode: string // e.g. "DEV_IMPL"
  name: string // "Systems development"
  nameVi: string // "Phát triển hệ thống"
  description: string
  skillCount: number
}

export interface SfiaSkillSummary {
  code: string // e.g. "PROG", "SWDN", "DBDS"
  name: string // "Programming/software development"
  categoryCode: string // "DEV_IMPL"
  subcategoryCode: string // "SYS_DEV"
  minLevel: number // 1 - 7
  maxLevel: number // 1 - 7
  questionCount: number
  onetCount: number
}

export interface SfiaSkillLevelStatement {
  skillCode: string
  levelId: number // 1 - 7
  description: string
  essence?: string
}

export interface SfiaOnetMappingItem {
  socCode: string // e.g. "15-1252.00"
  occupationTitle: string // "Software Developers"
  targetLevel: number // 1 - 7
  weight: number // 0.1 - 5.0
  isCore: boolean
}

export interface SfiaQuestionBankItem {
  id: string
  questionText: string
  type: 'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' | 'HR'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
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
  levelId: number // 1 - 7
  name: string // "Apply"
  nameVi: string // "Áp dụng độc lập"
  essence: string // "Applies knowledge and skills to perform tasks..."
  description: string // Quyền hạn & phạm vi chung
}

export interface SfiaGenericAttribute {
  code: string // "AUTONOMY", "INFLUENCE", "COMPLEXITY", "BUSINESS_SKILLS", "KNOWLEDGE"
  name: string // "Autonomy"
  nameVi: string // "Mức độ tự chủ"
  description: string
  levels: Record<number, string> // Mô tả tiêu chuẩn tại từng level 1 - 7
}

export type SfiaMatrixDisplayMode = 'level' | 'questions' | 'onet'

export interface SfiaMatrixCellData {
  skillCode: string
  levelId: number // 1 - 7
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
  totalSkills: number // 147
  totalCategories: number // 6
  totalSubcategories: number // 22
  totalLevels: number // 7
  skillsWithQuestions: number
  skillsWithOnet: number
  blindSpotsCount: number
  totalQuestions: number
  totalActiveMatrixCells: number // Tổng số ô khả dụng (~672)
  categoryDistribution: SfiaCategoryMetric[]
  levelDistribution: SfiaLevelMetric[]
  topOnetMappedSkills: SfiaTopOnetMappedSkill[]
}
