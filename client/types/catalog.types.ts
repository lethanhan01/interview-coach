import type { ContextPack, SessionType } from './common.types'
import type { InterviewDuration, JdLevel } from './prep.types'

export interface JdLevelOption {
  value: JdLevel
  label: string
  defaultSfiaLevel: number
  aliases: string[]
}

export interface CatalogSfiaLevelOption {
  levelId: number
  name: string
  nameVi: string
  essence: string
  description: string
}

export interface DurationOption {
  value: InterviewDuration
  label: string
  numQuestions: number
}

export interface SessionTypeOption {
  value: SessionType
  label: string
  shortLabel: string
  description: string
}

export interface ContextPackOption {
  value: ContextPack
  label: string
  description: string
}

export interface SelectOptionItem {
  value: string
  label: string
}

export interface InterviewOptionsCatalog {
  jdLevels: JdLevelOption[]
  sfiaLevels: CatalogSfiaLevelOption[]
  durations: DurationOption[]
  sessionTypes: SessionTypeOption[]
  contextPacks: ContextPackOption[]
  educationDegrees: SelectOptionItem[]
}
