export type JdLevel =
  'intern' | 'fresher' | 'junior' | 'middle' | 'senior' | 'lead'

export type InterviewDuration = 30 | 60 | 90

export interface JdFormData {
  company: string
  website: string
  position: string
  level: string
  headcount: string
  location: string
  requirements: string
  jobContent: string
  techStack: string[]
  benefits: string
  salary: string
  bonus: string
  onetSocCode?: string
  onetOccupationTitle?: string
  targetSfiaLevel?: number
}

export interface SavedJobDescription {
  id: string
  userId: string
  companyName: string
  companyWebsite?: string | null
  jobTitle: string
  level?: string | null
  headcount?: string | null
  location?: string | null
  requirements: string
  jobContent: string
  techStack: string[]
  benefits?: string | null
  salary?: string | null
  bonus?: string | null
  onetSocCode?: string | null
  onetOccupationTitle?: string | null
  targetSfiaLevel?: number | null
  normalizedTechStack?: string[] | null
  lastUsedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface SaveJobDescriptionPayload {
  companyName: string
  companyWebsite?: string
  jobTitle: string
  level: string
  headcount?: string
  location?: string
  requirements: string
  jobContent: string
  techStack?: string[]
  benefits?: string
  salary?: string
  bonus?: string
  onetSocCode?: string
  onetOccupationTitle?: string
  targetSfiaLevel?: number
}

export interface SavedJobDescriptionsResponse {
  items: SavedJobDescription[]
}
