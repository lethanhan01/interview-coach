'use client'

import { useMemo, useState } from 'react'
import {
  Button,
  Group,
  Loader,
  Pagination,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
import surfaces from '@/styles/surfaces.module.css'
import type { OnetDetailSubTab, OnetTopOccupationItem } from '@/types'
import {
  OnetTopOccupationsFilters,
  type TopOccupationsSort,
} from './OnetTopOccupationsFilters'
import { OnetTopOccupationsTable } from './OnetTopOccupationsTable'

export interface OnetTopOccupationsProps {
  data: OnetTopOccupationItem[]
  isFetching?: boolean
  activeGroupFilter?: string | null
  activeGroupName?: string
  onClearGroupFilter?: () => void
  onNavigateToExplorer: (socCode: string, subTab?: OnetDetailSubTab) => void
}

export function OnetTopOccupations({
  data,
  isFetching = false,
  activeGroupFilter = null,
  activeGroupName,
  onClearGroupFilter,
  onNavigateToExplorer,
}: Readonly<OnetTopOccupationsProps>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<TopOccupationsSort>('mock_desc')
  const [pageSize, setPageSize] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const filtered = data.filter((item) => {
      if (activeGroupFilter && item.majorGroupCode !== activeGroupFilter) {
        return false
      }
      if (q) {
        return (
          item.socCode.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.majorGroupName.toLowerCase().includes(q)
        )
      }
      return true
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'jd_desc') {
        return (
          b.jobDescriptionCount - a.jobDescriptionCount ||
          b.mockInterviewCount - a.mockInterviewCount
        )
      }
      if (sortBy === 'mapping_desc') {
        return (
          b.mappingCount - a.mappingCount ||
          b.mockInterviewCount - a.mockInterviewCount
        )
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title)
      }
      return (
        b.mockInterviewCount - a.mockInterviewCount ||
        b.mappingCount - a.mappingCount
      )
    })
  }, [data, activeGroupFilter, searchQuery, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const paginatedItems = filteredAndSorted.slice(
    startIndex,
    startIndex + pageSize
  )

  return (
    <Paper withBorder p="xs" radius="md">
      <Stack gap="xs">
        <OnetTopOccupationsFilters
          totalCount={filteredAndSorted.length}
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val)
            setCurrentPage(1)
          }}
          sortBy={sortBy}
          onSortChange={(val) => {
            setSortBy(val)
            setCurrentPage(1)
          }}
          pageSize={pageSize}
          onPageSizeChange={(val) => {
            setPageSize(val)
            setCurrentPage(1)
          }}
          activeGroupFilter={activeGroupFilter}
          activeGroupName={activeGroupName}
          onClearGroupFilter={onClearGroupFilter}
        />

        {isFetching ? (
          <Group gap="xs">
            <Loader size="xs" />
            <Text size="sm" c="dimmed">
              Đang cập nhật dữ liệu nhóm ngành...
            </Text>
          </Group>
        ) : null}

        {paginatedItems.length === 0 ? (
          <Paper p="md" radius="md" className={surfaces.subtleSurface}>
            <Stack align="center" gap="xs">
              <Text size="md" fw={600}>
                Không tìm thấy nghề nghiệp phù hợp
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc nhóm ngành SOC hiện
                tại.
              </Text>
              {searchQuery || activeGroupFilter ? (
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => {
                    setSearchQuery('')
                    setCurrentPage(1)
                    onClearGroupFilter?.()
                  }}
                >
                  Đặt lại bộ lọc
                </Button>
              ) : null}
            </Stack>
          </Paper>
        ) : (
          <>
            <OnetTopOccupationsTable
              items={paginatedItems}
              startIndex={startIndex}
              onNavigateToExplorer={onNavigateToExplorer}
            />

            {totalPages > 1 ? (
              <Group justify="space-between" align="center" wrap="wrap">
                <Text size="sm" c="dimmed">
                  Hiển thị {startIndex + 1}–
                  {Math.min(startIndex + pageSize, filteredAndSorted.length)}{' '}
                  trên {filteredAndSorted.length} nghề
                </Text>
                <Pagination
                  size="sm"
                  total={totalPages}
                  value={safePage}
                  onChange={setCurrentPage}
                />
              </Group>
            ) : null}
          </>
        )}
      </Stack>
    </Paper>
  )
}
