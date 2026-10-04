'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { OnetDetailSubTab, OnetMainTab } from './types'

export const DEFAULT_SOC_CODE = '15-1252.00'
export const DEFAULT_MAIN_TAB: OnetMainTab = 'explorer'
export const DEFAULT_DETAIL_TAB: OnetDetailSubTab = 'overview'

export function useOnetParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const rawTab = searchParams.get('tab')
  const activeTab: OnetMainTab =
    rawTab === 'analytics' ? 'analytics' : DEFAULT_MAIN_TAB

  const selectedSoc = searchParams.get('soc') || DEFAULT_SOC_CODE

  const rawDetail = searchParams.get('detail')
  const validDetailTabs: OnetDetailSubTab[] = [
    'overview',
    'tech',
    'sfia',
    'tasks',
    'titles',
  ]
  const activeDetailTab: OnetDetailSubTab = validDetailTabs.includes(
    rawDetail as OnetDetailSubTab
  )
    ? (rawDetail as OnetDetailSubTab)
    : DEFAULT_DETAIL_TAB

  // Update query params helper
  const updateParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const current = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          current.delete(key)
        } else {
          current.set(key, value)
        }
      })

      const query = current.toString()
      const newUrl = `${pathname}${query ? `?${query}` : ''}`
      router.replace(newUrl, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const setTab = useCallback(
    (tab: OnetMainTab) => {
      updateParams({ tab: tab === DEFAULT_MAIN_TAB ? null : tab })
    },
    [updateParams]
  )

  const setSoc = useCallback(
    (soc: string) => {
      updateParams({
        soc,
        tab: activeTab === 'analytics' ? null : undefined, // Trở về explorer nếu đang ở analytics
      })
    },
    [activeTab, updateParams]
  )

  const setDetailTab = useCallback(
    (detail: OnetDetailSubTab) => {
      updateParams({
        detail: detail === DEFAULT_DETAIL_TAB ? null : detail,
      })
    },
    [updateParams]
  )

  return {
    activeTab,
    selectedSoc,
    activeDetailTab,
    setTab,
    setSoc,
    setDetailTab,
    updateParams,
  }
}
