export interface OnetOccupation {
  socCode: string
  title: string
  description: string
  matchedTitle?: string
  similarityScore?: number
}

export interface OnetTech {
  example: string
  isHotTechnology: boolean
  inDemand: boolean
}

export type OnetMainTab = 'explorer' | 'analytics'

export type OnetDetailSubTab = 'overview' | 'tech' | 'sfia' | 'tasks' | 'titles'

export interface SocMajorGroup {
  code: string
  name: string
  englishName: string
  totalOccupations: number
  mappedCount: number
}

export interface OnetOccupationSummary {
  socCode: string
  title: string
  majorGroupCode: string
  isMapped: boolean
  mappingCount: number
}

export interface OnetJobZoneInfo {
  zone: number
  name: string
  education: string
  experience: string
  jobTraining: string
}

export interface OnetTaskStatement {
  id: string
  statement: string
  isCore: boolean
}

export interface OnetSoftwareSkill {
  name: string
  category: string
  isHotTechnology: boolean
  inDemand: boolean
}

export interface SfiaSkillDefinition {
  code: string
  name: string
  category: string
  description: string
  minLevel: number
  maxLevel: number
  levelDescriptions: Record<number, string>
}

export type OnetSfiaMappingSource =
  'ONET_CROSSWALK' | 'EXPERT_CURATED' | 'USER_DEFINED'

export interface OnetSfiaMapping {
  id: string
  skillCode: string
  skillName: string
  category?: string
  targetLevel: number
  minLevel: number
  maxLevel: number
  weight: number
  isCore: boolean
  source: OnetSfiaMappingSource
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

export interface OnetAnalyticsSummary {
  totalOccupations: number
  totalMajorGroups: number
  totalMappedOccupations: number
  overallMappingCoveragePercent: number
  itGroupOccupations: number
  itGroupMappedOccupations: number
  itGroupCoveragePercent: number
  totalSoftwareSkills: number
  hotTechCount: number
  inDemandTechCount: number
  totalAlternateTitles: number
  totalMockInterviews: number
  totalLinkedJobDescriptions: number
}

export interface SocGroupDistributionItem {
  code: string
  name: string
  englishName: string
  totalOccupations: number
  mappedOccupations: number
  mappingCoveragePercent: number
  isFocusGroup: boolean
}

export interface SfiaSkillCoverageItem {
  code: string
  name: string
  category: string
  mappedOccupationsCount: number
  coreCount: number
  secondaryCount: number
  minTargetLevel: number
  maxTargetLevel: number
  avgTargetLevel: number
}

export interface OnetTopOccupationItem {
  socCode: string
  title: string
  majorGroupCode: string
  majorGroupName: string
  mockInterviewCount: number
  jobDescriptionCount: number
  mappingCount: number
  isMapped: boolean
  coreSkillCodes: string[]
}

export interface PaginatedAlternateTitles {
  items: string[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface OnetOccupationSearchFilters {
  groupCode?: string
  mappedOnly?: boolean
  search?: string
  limit?: number
}

export interface OnetTopOccupationsQuery {
  limit?: number
  sortBy?: 'interviews' | 'jds' | 'mappings'
  search?: string
}

export interface OnetAlternateTitlesQuery {
  page?: number
  limit?: number
  search?: string
}

export interface CreateOnetSfiaMappingPayload {
  skillCode: string
  targetLevel: number
  weight?: number
  isCore?: boolean
  source?: string
}

export interface UpdateOnetSfiaMappingPayload {
  targetLevel?: number
  weight?: number
  isCore?: boolean
  source?: string
}

export interface DeleteOnetSfiaMappingResponse {
  success: boolean
  message: string
}

export interface RawSfiaMappingItem {
  id: string
  onetSocCode: string
  sfiaSkillCode: string
  skillName: string
  skillCategory?: string
  targetSfiaLevel: number
  defaultWeight: number | string
  isCore: boolean
  source: string
  minLevel: number
  maxLevel: number
  responsibility?: string
  createdAt?: string
}

export interface RawSfiaLibrarySkill {
  code: string
  name: string
  category: string
  categoryCode?: string
  minLevel: number
  maxLevel: number
  description: string
  levels: Array<{ level: number; description: string }>
}

export interface RawOccupationDetail extends Omit<
  OnetOccupationDetail,
  'sfiaMappings'
> {
  sfiaMappings: RawSfiaMappingItem[]
}
