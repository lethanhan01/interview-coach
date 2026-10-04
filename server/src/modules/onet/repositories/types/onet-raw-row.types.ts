export interface OnetOccupationRawRow {
  socCode: string;
  title: string;
  description: string;
  matchedTitle: string;
  similarityScore: number;
}

export interface OnetTechRawRow {
  example: string;
  isHotTechnology: boolean;
  inDemand: boolean;
}

export interface OnetAdminSummaryStatsRaw {
  totalOccupations: number;
  totalMajorGroups: number;
  totalMappedOccupations: number;
  itGroupOccupations: number;
  itGroupMappedOccupations: number;
  totalSoftwareSkills: number;
  hotTechCount: number;
  inDemandTechCount: number;
  totalAlternateTitles: number;
  totalMockInterviews: number;
  totalLinkedJobDescriptions: number;
}

export interface SocMajorGroupRawRow {
  code: string;
  totalOccupations: number;
  mappedOccupations: number;
}

export interface SidebarOccupationRawRow {
  socCode: string;
  title: string;
  majorGroupCode: string;
  isMapped: boolean;
  mappingCount: number;
}

export interface TopOccupationRawRow {
  socCode: string;
  title: string;
  majorGroupCode: string;
  mockInterviewCount: number;
  jobDescriptionCount: number;
  mappingCount: number;
  isMapped: boolean;
  coreSkillCodes: string[] | null;
}

export interface SfiaSkillCoverageRawRow {
  code: string;
  mappedOccupationsCount: number;
  coreCount: number;
  secondaryCount: number;
  minTargetLevel: number;
  maxTargetLevel: number;
  avgTargetLevel: number;
}

export interface OccupationDetailBaseRawRow {
  socCode: string;
  title: string;
  description: string;
}

export interface OccupationJobZoneRawRow {
  zone: number;
  name: string;
  education: string;
  experience: string;
  jobTraining: string;
}

export interface OccupationStatsCountsRawRow {
  toolCount: number;
  taskCount: number;
  mappingCount: number;
  alternateTitleCount: number;
}

export interface OccupationTechSkillRawRow {
  name: string;
  category: string;
  isHotTechnology: boolean;
  inDemand: boolean;
}

export interface OccupationTaskRawRow {
  id: number;
  statement: string;
  isCore: boolean;
}

export interface OccupationSfiaMappingRawRow {
  id: string;
  onetSocCode: string;
  sfiaSkillCode: string;
  targetSfiaLevel: number;
  defaultWeight: number;
  isCore: boolean;
  source: string;
  createdAt: Date;
}
