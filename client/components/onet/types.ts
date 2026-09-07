/**
 * Types & Data Contracts for O*NET Admin Browser
 */

export type OnetMainTab = 'explorer' | 'analytics'

export type OnetDetailSubTab = 'overview' | 'tech' | 'sfia' | 'tasks' | 'titles'

export interface SocMajorGroup {
  code: string // e.g. "15", "11", "17"
  name: string // Tiêu đề tiếng Việt
  englishName: string // Tiêu đề tiếng Anh chuẩn SOC
  totalOccupations: number // Tổng số nghề thuộc nhóm
  mappedCount: number // Số nghề đã được ánh xạ SFIA
}

export interface OnetOccupationSummary {
  socCode: string // e.g. "15-1252.00"
  title: string // e.g. "Software Developers"
  majorGroupCode: string // e.g. "15"
  isMapped: boolean // true nếu có ít nhất 1 SFIA mapping
  mappingCount: number // Số lượng mapping SFIA
}

export interface OnetJobZoneInfo {
  zone: number // 1 - 5
  name: string // "Considerable Preparation Needed"
  education: string // Trình độ học vấn
  experience: string // Kinh nghiệm yêu cầu
  jobTraining: string // Thời gian đào tạo
}

export interface OnetTaskStatement {
  id: string
  statement: string
  isCore: boolean // true: Nhiệm vụ cốt lõi, false: Nhiệm vụ bổ trợ
}

export interface OnetSoftwareSkill {
  name: string
  category: string
  isHotTechnology: boolean // 🔥 Hot Tech
  inDemand: boolean // ⚡ In Demand
}

export interface SfiaSkillDefinition {
  code: string // e.g. "PROG", "TEST", "DBDS"
  name: string // e.g. "Programming/software development"
  category: string // e.g. "Phát triển & Triển khai", "Dữ liệu & Phân tích"
  description: string // Mô tả tổng quan năng lực kỹ năng
  minLevel: number // Giới hạn dưới hợp lệ (1 - 7)
  maxLevel: number // Giới hạn trên hợp lệ (1 - 7)
  levelDescriptions: Record<number, string> // Mô tả tiêu chuẩn tại từng level
}

export interface OnetSfiaMapping {
  id: string
  skillCode: string // e.g. "PROG", "TEST", "DBDS"
  skillName: string // e.g. "Programming/software development"
  category?: string
  targetLevel: number // 1 - 7
  minLevel: number // Giới hạn dưới hợp lệ của skill
  maxLevel: number // Giới hạn trên hợp lệ của skill
  weight: number // 0.1 - 5.0 (mặc định 1.0)
  isCore: boolean // true: Kỹ năng cốt lõi
  source: 'ONET_CROSSWALK' | 'EXPERT_CURATED' | 'USER_DEFINED'
}

export interface OnetOccupationDetail extends OnetOccupationSummary {
  description: string
  jobZone: OnetJobZoneInfo
  stats: {
    toolCount: number
    taskCount: number
    mappingCount: number
    alternateTitleCount: number
  }
  tasks: OnetTaskStatement[]
  softwareSkills: OnetSoftwareSkill[]
  alternateTitles: string[]
  sfiaMappings: OnetSfiaMapping[]
}
