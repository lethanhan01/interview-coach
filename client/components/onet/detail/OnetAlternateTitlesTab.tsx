'use client'

import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconSearch, IconX } from '@tabler/icons-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { onetAdminQueries } from '@/queries/onet.queries'
import surfaces from '@/styles/surfaces.module.css'
import { AlternateTitlesTable } from './AlternateTitlesTable'

export interface OnetAlternateTitlesTabProps {
  socCode?: string
  initialTitles?: string[]
  totalCount?: number
}

export function OnetAlternateTitlesTab({
  socCode,
  initialTitles = [],
  totalCount = 0,
}: Readonly<OnetAlternateTitlesTabProps>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(searchQuery.trim(), 300)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  const isServerMode = Boolean(socCode)

  const [prevSoc, setPrevSoc] = useState(socCode)
  const [prevQuery, setPrevQuery] = useState(debouncedQuery)

  if (prevSoc !== socCode || prevQuery !== debouncedQuery) {
    setPrevSoc(socCode)
    setPrevQuery(debouncedQuery)
    setCurrentPage(1)
  }

  const { data: serverData, isLoading: isServerLoading } = useQuery({
    ...onetAdminQueries.alternateTitles(socCode ?? '', {
      page: currentPage,
      limit: pageSize,
      search: debouncedQuery,
    }),
    placeholderData: keepPreviousData,
    enabled: isServerMode,
  })

  const loading = isServerMode && isServerLoading

  const clientFiltered = useMemo(() => {
    if (isServerMode) return []
    const q = debouncedQuery.toLowerCase()
    return initialTitles.filter((t) => t.toLowerCase().includes(q))
  }, [isServerMode, initialTitles, debouncedQuery])

  const items = isServerMode
    ? (serverData?.items ?? initialTitles)
    : clientFiltered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const total = isServerMode
    ? (serverData?.total ?? (totalCount || initialTitles.length))
    : clientFiltered.length

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <Stack gap="sm">
      {/* Control Header */}
      <Paper withBorder p="sm" radius="md">
        <Stack gap="xs">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <Title order={2} size="h6">
                Chức danh Thị trường Tương đương (Alternate Titles)
              </Title>
              <Badge color="neutral" variant="outline" size="xs">
                {total} chức danh
              </Badge>
            </Group>

            {loading ? (
              <Group gap={6} align="center">
                <Loader size="xs" />
                <Text size="xs" c="dimmed">
                  Đang tải...
                </Text>
              </Group>
            ) : null}
          </Group>

          <TextInput
            size="xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            placeholder="Tìm kiếm tên chức danh tương đương..."
            aria-label="Tìm kiếm chức danh tương đương"
            leftSection={<IconSearch size={14} stroke={1.5} />}
            rightSection={
              searchQuery ? (
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="neutral"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => setSearchQuery('')}
                >
                  <IconX size={12} stroke={1.5} />
                </ActionIcon>
              ) : null
            }
          />
        </Stack>
      </Paper>

      {/* Table Content */}
      {items.length === 0 ? (
        <Paper p="xl" radius="md" className={surfaces.subtleSurface}>
          <Stack align="center" gap="xs">
            <Text size="sm" fw={600}>
              Không tìm thấy chức danh nào
            </Text>
            <Text size="xs" c="dimmed">
              Thử thay đổi từ khóa tìm kiếm.
            </Text>
            {searchQuery ? (
              <Button
                size="xs"
                variant="light"
                onClick={() => setSearchQuery('')}
              >
                Xóa từ khóa tìm kiếm
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : (
        <AlternateTitlesTable
          items={items}
          searchQuery={debouncedQuery}
          currentPage={currentPage}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </Stack>
  )
}
