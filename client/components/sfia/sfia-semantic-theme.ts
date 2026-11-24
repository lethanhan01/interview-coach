import type { ComponentType } from 'react'
import type { MantineColor } from '@mantine/core'
import {
  IconBook,
  IconBriefcase,
  IconCategory,
  IconCode,
  IconCompass,
  IconCpu,
  IconHeartHandshake,
  IconRefresh,
  IconServer,
  IconUsers,
  type TablerIcon,
} from '@tabler/icons-react'

export interface SfiaCategorySemanticTheme {
  code: string
  color: MantineColor
  badgeVariant: 'light' | 'outline' | 'dot' | 'filled'
  icon:
    | TablerIcon
    | ComponentType<{ size?: number | string; stroke?: number | string }>
}

export interface SfiaLevelSemanticTheme {
  levelId: number
  label: string
  color: MantineColor
  badgeVariant: 'light' | 'outline' | 'dot' | 'filled'
}

export interface SfiaAttributeSemanticTheme {
  code: string
  color: MantineColor
  badgeVariant: 'light' | 'outline' | 'dot' | 'filled'
  icon:
    | TablerIcon
    | ComponentType<{ size?: number | string; stroke?: number | string }>
}

export interface SfiaHeatmapSemanticTheme {
  tier: 'blind' | 'low' | 'good' | 'rich'
  color: MantineColor
  badgeVariant: 'light' | 'outline' | 'dot' | 'filled'
  dataHeat: string
}

export const SFIA_CATEGORY_SEMANTIC_THEMES: Record<
  string,
  SfiaCategorySemanticTheme
> = {
  STRAT_ARCH: {
    code: 'STRAT_ARCH',
    color: 'brand',
    badgeVariant: 'light',
    icon: IconCompass,
  },
  CHG_TRANS: {
    code: 'CHG_TRANS',
    color: 'success',
    badgeVariant: 'light',
    icon: IconRefresh,
  },
  DEV_IMPL: {
    code: 'DEV_IMPL',
    color: 'brand',
    badgeVariant: 'outline',
    icon: IconCode,
  },
  DELIV_OP: {
    code: 'DELIV_OP',
    color: 'success',
    badgeVariant: 'outline',
    icon: IconServer,
  },
  PPL_SKILL: {
    code: 'PPL_SKILL',
    color: 'warning',
    badgeVariant: 'light',
    icon: IconUsers,
  },
  REL_ENG: {
    code: 'REL_ENG',
    color: 'neutral',
    badgeVariant: 'dot',
    icon: IconHeartHandshake,
  },
}

export const SFIA_DEFAULT_CATEGORY_THEME: SfiaCategorySemanticTheme = {
  code: 'UNKNOWN',
  color: 'neutral',
  badgeVariant: 'light',
  icon: IconCategory,
}

export const SFIA_LEVEL_SEMANTIC_THEMES: Record<
  number,
  SfiaLevelSemanticTheme
> = {
  1: { levelId: 1, label: 'L1', color: 'neutral', badgeVariant: 'outline' },
  2: { levelId: 2, label: 'L2', color: 'neutral', badgeVariant: 'light' },
  3: { levelId: 3, label: 'L3', color: 'brand', badgeVariant: 'outline' },
  4: { levelId: 4, label: 'L4', color: 'brand', badgeVariant: 'light' },
  5: { levelId: 5, label: 'L5', color: 'success', badgeVariant: 'light' },
  6: { levelId: 6, label: 'L6', color: 'warning', badgeVariant: 'light' },
  7: { levelId: 7, label: 'L7', color: 'danger', badgeVariant: 'light' },
}

export const SFIA_ATTRIBUTE_SEMANTIC_THEMES: Record<
  string,
  SfiaAttributeSemanticTheme
> = {
  AUTONOMY: {
    code: 'AUTONOMY',
    color: 'brand',
    badgeVariant: 'light',
    icon: IconCompass,
  },
  INFLUENCE: {
    code: 'INFLUENCE',
    color: 'brand',
    badgeVariant: 'outline',
    icon: IconUsers,
  },
  COMPLEXITY: {
    code: 'COMPLEXITY',
    color: 'warning',
    badgeVariant: 'light',
    icon: IconCpu,
  },
  BUSINESS_SKILLS: {
    code: 'BUSINESS_SKILLS',
    color: 'success',
    badgeVariant: 'light',
    icon: IconBriefcase,
  },
  KNOWLEDGE: {
    code: 'KNOWLEDGE',
    color: 'neutral',
    badgeVariant: 'light',
    icon: IconBook,
  },
}

export function getSfiaCategorySemanticTheme(
  code?: string | null
): SfiaCategorySemanticTheme {
  if (!code) return SFIA_DEFAULT_CATEGORY_THEME
  return SFIA_CATEGORY_SEMANTIC_THEMES[code] ?? SFIA_DEFAULT_CATEGORY_THEME
}

export function getSfiaLevelSemanticTheme(
  levelId?: number | null
): SfiaLevelSemanticTheme {
  const normalized = Number(levelId) || 1
  return (
    SFIA_LEVEL_SEMANTIC_THEMES[normalized] ?? {
      levelId: normalized,
      label: `L${normalized}`,
      color: 'neutral',
      badgeVariant: 'light',
    }
  )
}

export function getSfiaAttributeSemanticTheme(
  code?: string | null
): SfiaAttributeSemanticTheme {
  if (!code) {
    return {
      code: 'UNKNOWN',
      color: 'neutral',
      badgeVariant: 'light',
      icon: IconBook,
    }
  }
  return (
    SFIA_ATTRIBUTE_SEMANTIC_THEMES[code] ?? {
      code,
      color: 'neutral',
      badgeVariant: 'light',
      icon: IconBook,
    }
  )
}

export function getSfiaHeatmapSemanticTheme(
  questionCount: number
): SfiaHeatmapSemanticTheme {
  if (questionCount <= 0) {
    return {
      tier: 'blind',
      color: 'danger',
      badgeVariant: 'outline',
      dataHeat: 'blind',
    }
  }
  if (questionCount <= 2) {
    return {
      tier: 'low',
      color: 'warning',
      badgeVariant: 'light',
      dataHeat: 'low',
    }
  }
  if (questionCount <= 5) {
    return {
      tier: 'good',
      color: 'brand',
      badgeVariant: 'light',
      dataHeat: 'good',
    }
  }
  return {
    tier: 'rich',
    color: 'success',
    badgeVariant: 'filled',
    dataHeat: 'rich',
  }
}
