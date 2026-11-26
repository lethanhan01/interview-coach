'use client'

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
import layout from '@/styles/layout.module.css'
import { OnetSidebarGroupItem } from './OnetSidebarGroupItem'
import { OnetSidebarHeader } from './OnetSidebarHeader'
import { toSidebarError, useOnetSidebarData } from './useOnetSidebarData'

export interface OnetSidebarProps {
  selectedSoc: string
  onSelectSoc: (socCode: string) => void
  refreshTrigger?: number
}

export function OnetSidebar({
  selectedSoc,
  onSelectSoc,
  refreshTrigger = 0,
}: Readonly<OnetSidebarProps>) {
  const {
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
  } = useOnetSidebarData(selectedSoc, refreshTrigger)

  const majorGroupsError = toSidebarError(
    majorGroupsQuery.error,
    'Không thể tải danh mục nhóm nghề O*NET'
  )
  const searchError = toSidebarError(
    searchQuery.error,
    'Không thể tìm kiếm nghề nghiệp O*NET'
  )

  return (
    <Box className={layout.panelColumn}>
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

      <ScrollArea className={layout.scrollFlex} type="auto" offsetScrollbars>
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
                <Text size="sm">{majorGroupsError ?? searchError}</Text>
                <Group>
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    leftSection={<IconRefresh size={15} stroke={1.5} />}
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
            <Group justify="center" gap="xs" py="md">
              <Loader size="xs" />
              <Text size="sm" c="dimmed">
                Đang tìm kiếm trong cơ sở dữ liệu...
              </Text>
            </Group>
          ) : visibleGroups.length === 0 ? (
            <Stack align="center" gap="xs" py="md">
              <Text size="md" fw={600}>
                Không tìm thấy nghề nghiệp phù hợp
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Không có nhóm SOC nào khớp với bộ lọc hiện tại.
              </Text>
              <Button size="sm" variant="light" onClick={resetFilters}>
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
                        : toSidebarError(
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
