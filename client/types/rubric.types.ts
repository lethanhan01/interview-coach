import type { ContextPack, SessionType } from './common.types'

export interface RubricDimension {
  code: string
  nameVi: string
  weightPct: number
}

export interface RubricCategory {
  label: string
  categoryWeightPct: number
  dimensions: RubricDimension[]
}

export interface RubricConfig {
  contextPackId: ContextPack
  sessionType: SessionType
  categories: RubricCategory[]
  hint: string
}
