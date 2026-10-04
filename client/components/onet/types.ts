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

/**
 * 1. Tóm tắt chỉ số KPI toàn hệ thống (Analytics Summary)
 */
export interface OnetAnalyticsSummary {
  totalOccupations: number // Tổng số nghề chuẩn (1.016)
  totalMajorGroups: number // 23 Major Groups
  totalMappedOccupations: number // Số nghề đã có ít nhất 1 SFIA mapping
  overallMappingCoveragePercent: number // Tỷ lệ % nghề đã mapped
  itGroupOccupations: number // Số nghề thuộc nhóm 15 (Máy tính & Toán học)
  itGroupMappedOccupations: number // Số nghề nhóm 15 đã mapped
  itGroupCoveragePercent: number // Tỷ lệ % nhóm IT đã mapped
  totalSoftwareSkills: number // Tổng số công nghệ/phần mềm (31.821)
  hotTechCount: number // Số lượng Hot Technologies
  inDemandTechCount: number // Số lượng In-Demand Technologies
  totalAlternateTitles: number // Tổng số chức danh thay thế (54.269)
  totalMockInterviews: number // Tổng lượt luyện phỏng vấn giả lập
  totalLinkedJobDescriptions: number // Tổng số JD liên kết
}

/**
 * 2. Phân bổ dữ liệu 23 Major Groups SOC
 */
export interface SocGroupDistributionItem {
  code: string // Mã 2 chữ số (e.g. "15", "11")
  name: string // Tên tiếng Việt
  englishName: string // Tên tiếng Anh chuẩn SOC
  totalOccupations: number // Số nghề thuộc nhóm
  mappedOccupations: number // Số nghề đã có SFIA mapping
  mappingCoveragePercent: number // Tỷ lệ % mapped trong nhóm
  isFocusGroup: boolean // true nếu là Nhóm 15 (Máy tính & Toán học)
}

/**
 * 3. Phân bổ độ phủ kỹ năng SFIA 9
 */
export interface SfiaSkillCoverageItem {
  code: string // Mã kỹ năng (e.g. "PROG", "TEST", "DBDS")
  name: string // Tên kỹ năng chuẩn SFIA 9
  category: string // Danh mục SFIA
  mappedOccupationsCount: number // Số lượng nghề được ánh xạ kỹ năng này
  coreCount: number // Số nghề coi đây là kỹ năng Cốt lõi (Core)
  secondaryCount: number // Số nghề coi đây là kỹ năng Bổ trợ (Secondary)
  minTargetLevel: number // Cấp độ mục tiêu thấp nhất
  maxTargetLevel: number // Cấp độ mục tiêu cao nhất
  avgTargetLevel: number // Cấp độ mục tiêu trung bình
}

/**
 * 4. Dữ liệu nghề nghiệp quan tâm & luyện tập nhiều nhất
 */
export interface OnetTopOccupationItem {
  socCode: string // Mã SOC (e.g. "15-1252.00")
  title: string // Tên nghề chuẩn
  majorGroupCode: string // Mã nhóm ngành lớn (e.g. "15")
  majorGroupName: string // Tên nhóm ngành lớn
  mockInterviewCount: number // Lượt luyện phỏng vấn giả lập
  jobDescriptionCount: number // Lượt JD liên kết
  mappingCount: number // Số lượng kỹ năng SFIA đã ánh xạ
  isMapped: boolean // true nếu mappingCount > 0
  coreSkillCodes: string[] // Danh sách mã kỹ năng cốt lõi xem trước (e.g. ["PROG", "SWDN"])
}

export interface PaginatedAlternateTitles {
  items: string[]
  total: number
  page: number
  limit: number
  totalPages: number
}

