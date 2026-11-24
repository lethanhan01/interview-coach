'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '@mantine/hooks'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Accordion,
  Alert,
  Box,
  Button,
  Group,
  Loader,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import { onetAdminQueries } from '@/queries/onet.queries'
import { queryKeys } from '@/queries/keys'
import type {
  OnetMappingStatusFilter,
  OnetOccupationSummary,
  SocMajorGroup,
} from '@/types'
import { OnetSidebarGroupItem } from './OnetSidebarGroupItem'
import { OnetSidebarHeader } from './OnetSidebarHeader'
import classes from './OnetSidebar.module.css'

export interface OnetSidebarProps {
  selectedSoc: string
  onSelectSoc: (socCode: string) => void
  refreshTrigger?: number
}

const toMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : err ? fallback : null

function matchesStatus(group: SocMajorGroup, status: OnetMappingStatusFilter) {
  if (status === 'mapped') return group.mappedCount > 0
  if (status === 'unmapped') return group.totalOccupations > group.mappedCount
  return true
}

export function OnetSidebar({
  selectedSoc,
  onSelectSoc,
  refreshTrigger = 0,
}: Readonly<OnetSidebarProps>) {
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
      queryKey: ['onet-admin', 'occupations'],
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

  // Auto-expand all matched groups once per new search result set (still collapsible)
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

  const majorGroupsError = toMessage(
    majorGroupsQuery.error,
    'Không thể tải danh mục nhóm nghề O*NET'
  )
  const searchError = toMessage(
    searchQuery.error,
    'Không thể tìm kiếm nghề nghiệp O*NET'
  )

  return (
    <Box className={classes.root}>
      <OnetSidebarHeader
        totalOccupations={totalOccupations}
        hasSearch={hasSearch}
        searchResultCount={searchQuery.data?.length ?? 0}
        visibleGroupsCount={visibleGroups.length}
        majorGroupsCount={majorGroups.length}
        query={query}
        onQueryChange={setQuery}
        mappingStatus={mappingStatus}
        onMappingStatusChange={setMappingStatus}
      />

      <ScrollArea className={classes.scroll} type="auto" offsetScrollbars>
        <Box p="xs">
          {majorGroupsQuery.isLoading ? (
            <Stack gap="xs">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} height={40} radius="sm" />
              ))}
            </Stack>
          ) : majorGroupsError || (hasSearch && searchError) ? (
            <Alert color="danger" variant="light" title="Lỗi tải dữ liệu">
              <Stack gap="xs">
                <Text size="xs">{majorGroupsError ?? searchError}</Text>
                <Group>
                  <Button
                    size="xs"
                    variant="light"
                    color="danger"
                    leftSection={<IconRefresh size={14} stroke={1.5} />}
                    onClick={() => {
                      void majorGroupsQuery.refetch()
                      if (hasSearch) void searchQuery.refetch()
                    }}
                  >
                    Thử lại
                  </Button>
                </Group>
              </Stack>
            </Alert>
          ) : hasSearch && searchQuery.isFetching ? (
            <Group justify="center" gap="xs" py="lg">
              <Loader size="xs" />
              <Text size="xs" c="dimmed">
                Đang tìm kiếm trong cơ sở dữ liệu...
              </Text>
            </Group>
          ) : visibleGroups.length === 0 ? (
            <Stack align="center" gap="xs" py="lg">
              <Text size="sm" fw={600}>
                Không tìm thấy nghề nghiệp phù hợp
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                Không có nhóm SOC nào khớp với bộ lọc hiện tại.
              </Text>
              <Button size="xs" variant="light" onClick={resetFilters}>
                Đặt lại bộ lọc
              </Button>
            </Stack>
          ) : (
            <Accordion
              multiple
              variant="contained"
              radius="sm"
              chevronPosition="left"
              value={hasSearch ? searchExpanded : expandedGroups}
              onChange={hasSearch ? setSearchExpanded : setExpandedGroups}
            >
              {visibleGroups.map((group) => {
                const idx = expandedGroups.indexOf(group.code)
                const groupQuery = idx >= 0 ? groupQueries[idx] : undefined
                const occupations = hasSearch
                  ? (searchGroupMap.get(group.code) ?? [])
                  : (groupQuery?.data ?? [])
                const countLabel = hasSearch
                  ? occupations.length
                  : mappingStatus === 'mapped'
                    ? group.mappedCount
                    : mappingStatus === 'unmapped'
                      ? group.totalOccupations - group.mappedCount
                      : group.totalOccupations

                return (
                  <OnetSidebarGroupItem
                    key={group.code}
                    group={group}
                    occupations={occupations}
                    countLabel={countLabel}
                    showProgress={!hasSearch}
                    isLoading={!hasSearch && Boolean(groupQuery?.isLoading)}
                    errorMessage={
                      hasSearch
                        ? null
                        : toMessage(
                            groupQuery?.error,
                            'Không thể tải danh sách nghề của nhóm này'
                          )
                    }
                    onRetry={() => void groupQuery?.refetch()}
                    selectedSoc={selectedSoc}
                    onSelectSoc={onSelectSoc}
                  />
                )
              })}
            </Accordion>
          )}
        </Box>
      </ScrollArea>
    </Box>
  )
}
