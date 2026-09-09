'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { SfiaMainTab } from './types'

export const DEFAULT_SFIA_MAIN_TAB: SfiaMainTab = 'taxonomy'
export const DEFAULT_SFIA_SKILL_CODE = 'PROG'
export const DEFAULT_SFIA_LEVEL = 3

export function useSfiaParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const rawTab = searchParams.get('tab')
  const validTabs: SfiaMainTab[] = ['taxonomy', 'matrix', 'attributes', 'analytics']
  const activeTab: SfiaMainTab = validTabs.includes(rawTab as SfiaMainTab)
    ? (rawTab as SfiaMainTab)
    : DEFAULT_SFIA_MAIN_TAB

  const selectedSkill = searchParams.get('skill') || DEFAULT_SFIA_SKILL_CODE
  
  const rawLevel = searchParams.get('level')
  const parsedLevel = rawLevel ? parseInt(rawLevel, 10) : DEFAULT_SFIA_LEVEL
  const selectedLevel = isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 7 ? DEFAULT_SFIA_LEVEL : parsedLevel

  const selectedCategory = searchParams.get('category') || null

  // URL search params updater helper
  const updateParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const current = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          current.delete(key)
        } else {
          current.set(key, String(value))
        }
      })

      const query = current.toString()
      const newUrl = `${pathname}${query ? `?${query}` : ''}`
      router.replace(newUrl, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const setTab = useCallback(
    (tab: SfiaMainTab) => {
      updateParams({ tab: tab === DEFAULT_SFIA_MAIN_TAB ? null : tab })
    },
    [updateParams]
  )

  const setSkill = useCallback(
    (skillCode: string, levelId?: number) => {
      updateParams({
        skill: skillCode,
        level: levelId !== undefined ? levelId : undefined,
        tab: activeTab !== 'taxonomy' ? 'taxonomy' : undefined,
      })
    },
    [activeTab, updateParams]
  )

  const setLevel = useCallback(
    (levelId: number) => {
      updateParams({
        level: levelId,
      })
    },
    [updateParams]
  )

  const setCategory = useCallback(
    (categoryCode: string | null) => {
      updateParams({
        category: categoryCode,
      })
    },
    [updateParams]
  )

  return {
    activeTab,
    selectedSkill,
    selectedLevel,
    selectedCategory,
    setTab,
    setSkill,
    setLevel,
    setCategory,
    updateParams,
  }
}
