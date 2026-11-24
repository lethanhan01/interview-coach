'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '@mantine/hooks'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/keys'
import { onetAdminQueries } from '@/queries/onet.queries'
import type {
  OnetMappingStatusFilter,
  OnetOccupationSummary,
  SocMajorGroup,
} from '@/types'

export const toSidebarError = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : err ? fallback : null

function matchesStatus(group: SocMajorGroup, status: OnetMappingStatusFilter) {
  if (status === 'mapped') return group.mappedCount > 0
  if (status === 'unmapped') return group.totalOccupations > group.mappedCount
  return true
}

export function useOnetSidebarData(
  selectedSoc: string,
  refreshTrigger: number
) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query.trim(), 300)
  const [mappingStatus, setMappingStatus] =
    useState<OnetMappingStatusFilter>('all')
  const hasSearch = Boolean(debouncedQuery)

  const selectedGroupCode = selectedSoc?.split('-')[0] || '15'
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    selectedGroupCode,
  ])
  const [searchExpanded, setSearchExpanded] = useState<string[]>([])
  const [prevSoc, setPrevSoc] = useState(selectedSoc)
  const [prevSearchKey, setPrevSearchKey] = useState('')

  if (prevSoc !== selectedSoc) {
    setPrevSoc(selectedSoc)
    if (!expandedGroups.includes(selectedGroupCode)) {
      setExpandedGroups((prev) => [...prev, selectedGroupCode])
    }
  }

  const majorGroupsQuery = useQuery(onetAdminQueries.majorGroups())
  const majorGroups = useMemo(
    () => majorGroupsQuery.data ?? [],
    [majorGroupsQuery.data]
  )

  const searchQuery = useQuery({
    ...onetAdminQueries.occupations({
      search: debouncedQuery,
      mappingStatus,
      limit: 60,
    }),
    enabled: hasSearch,
  })

  const groupQueries = useQueries({
    queries: expandedGroups.map((groupCode) => ({
      ...onetAdminQueries.occupations({ groupCode, mappingStatus, limit: 500 }),
      enabled: !hasSearch && Boolean(groupCode),
    })),
  })

  useEffect(() => {
    if (refreshTrigger <= 0) return
    void queryClient.invalidateQueries({
      queryKey: queryKeys.onetAdmin.majorGroups(),
    })
    void queryClient.invalidateQueries({
      queryKey: queryKeys.onetAdmin.all,
      predicate: (q) => q.queryKey[1] === 'occupations',
    })
  }, [refreshTrigger, queryClient])

  const searchGroupMap = useMemo(() => {
    const map = new Map<string, OnetOccupationSummary[]>()
    for (const occ of searchQuery.data ?? []) {
      const list = map.get(occ.majorGroupCode) ?? []
      list.push(occ)
      map.set(occ.majorGroupCode, list)
    }
    return map
  }, [searchQuery.data])

  const visibleGroups = useMemo(() => {
    if (hasSearch) {
      return majorGroups.filter((g) => searchGroupMap.has(g.code))
    }
    return majorGroups.filter((g) => matchesStatus(g, mappingStatus))
  }, [hasSearch, majorGroups, mappingStatus, searchGroupMap])

  const searchKey = hasSearch
    ? `${debouncedQuery}|${mappingStatus}|${visibleGroups.map((g) => g.code).join(',')}`
    : ''
  if (searchKey !== prevSearchKey) {
    setPrevSearchKey(searchKey)
    setSearchExpanded(visibleGroups.map((g) => g.code))
  }

  const totalOccupations = useMemo(
    () => majorGroups.reduce((acc, g) => acc + (g.totalOccupations || 0), 0),
    [majorGroups]
  )

  const resetFilters = () => {
    setQuery('')
    setMappingStatus('all')
  }

  return {
    query,
    setQuery,
    mappingStatus,
    setMappingStatus,
    hasSearch,
    expandedGroups,
    setExpandedGroups,
    searchExpanded,
    setSearchExpanded,
    majorGroupsQuery,
    majorGroups,
    searchQuery,
    groupQueries,
    searchGroupMap,
    visibleGroups,
    totalOccupations,
    resetFilters,
  }
}
