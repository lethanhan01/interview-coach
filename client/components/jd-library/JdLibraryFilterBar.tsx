'use client'

import { useMemo } from 'react'
import {
  Alert,
  Button,
  CloseButton,
  Paper,
  ScrollArea,
  SegmentedControl,
  Skeleton,
  Stack,
  TextInput,
} from '@mantine/core'
import { IconAlertCircle, IconSearch } from '@tabler/icons-react'
import type { JdLevelOption } from '@/types'

export interface JdLibraryFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  levelFilter: string
  onLevelFilterChange: (value: string) => void
  jdLevels: readonly JdLevelOption[]
  isCatalogPending: boolean
  isCatalogError: boolean
  onRetryCatalog: () => void
}

export default function JdLibraryFilterBar({
  search,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
  jdLevels,
  isCatalogPending,
  isCatalogError,
  onRetryCatalog,
}: Readonly<JdLibraryFilterBarProps>) {
  const levelFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Tất cả' },
      ...jdLevels.map((opt) => ({
        value: opt.value,
        label: opt.value === 'intern' ? 'Intern' : opt.label,
      })),
    ],
    [jdLevels]
  )

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <TextInput
          aria-label="Tìm kiếm Job Description"
          placeholder="Tìm theo công ty, vị trí, địa điểm hoặc tech stack..."
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          leftSection={<IconSearch size={16} stroke={1.5} aria-hidden="true" />}
          rightSection={
            search ? (
              <CloseButton
                size="sm"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={() => onSearchChange('')}
              />
            ) : null
          }
        />

        {isCatalogPending ? (
          <Skeleton height={30} radius="sm" aria-busy="true" />
        ) : isCatalogError ? (
          <Alert
            color="danger"
            variant="light"
            role="alert"
            title="Không thể tải danh mục cấu hình"
            icon={<IconAlertCircle size={16} stroke={1.5} aria-hidden="true" />}
          >
            <Button
              type="button"
              variant="light"
              color="danger"
              size="xs"
              mt="xs"
              onClick={onRetryCatalog}
            >
              Thử lại
            </Button>
          </Alert>
        ) : (
          <ScrollArea type="auto" offsetScrollbars>
            <SegmentedControl
              aria-label="Lọc theo cấp bậc"
              size="xs"
              value={levelFilter}
              onChange={onLevelFilterChange}
              data={levelFilterOptions}
            />
          </ScrollArea>
        )}
      </Stack>
    </Paper>
  )
}
