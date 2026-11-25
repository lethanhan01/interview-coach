export type TechCategory =
  'language' | 'framework' | 'os' | 'database' | 'platform' | 'devtool'

export interface EducationEntry {
  degree: string
  school: string
  major: string
  gpa: string
  graduationYear: string
}

export interface WorkExperienceEntry {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
  techStack: string[]
}

export interface ProjectEntry {
  id: string
  name: string
  description: string
  techStack: string[]
  url: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

export interface TechnicalSkillEntry {
  id: string
  category?: TechCategory
  name: string
  usagePeriod: number
}

export interface CertificationEntry {
  id: string
  type: 'professional' | 'language'
  name: string
  issuer: string
  issueDate: string
  expiryDate?: string
  score?: string
}

export interface AwardEntry {
  id: string
  name: string
  organization: string
  date: string
  description: string
}

export interface CareerInfoData {
  targetPosition?: string
  targetRoleCategory?: string
  targetLevel?: string
  onetSocCode?: string
  onetOccupationTitle?: string
  targetSfiaLevel?: number
}

export interface CandidateProfileData {
  targetPosition?: string | null
  targetLevel?: string | null
  onetSocCode?: string | null
  onetOccupationTitle?: string | null
  targetSfiaLevel?: number | null
  personality?: string
  education?: EducationEntry
  workExperience?: WorkExperienceEntry[]
  projects?: ProjectEntry[]
  technicalSkills?: TechnicalSkillEntry[]
  certifications?: CertificationEntry[]
  awards?: AwardEntry[]
}

export interface GetProfileResponse {
  id: string
  email: string
  firstname?: string
  lastname?: string
  profile: CandidateProfileData | null
}
