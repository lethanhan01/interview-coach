'use client'

import {
  CloseButton,
  Group,
  Paper,
  ScrollArea,
  SegmentedControl,
  TextInput,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

export type SessionStatusFilter = 'all' | 'in_progress' | 'completed' | 'other'

const STATUS_FILTER_OPTIONS: { value: SessionStatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'in_progress', label: 'Đang thực hiện' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'other', label: 'Khác' },
]

export interface SessionsFilterBarProps {
  statusFilter: SessionStatusFilter
  onStatusFilterChange: (value: SessionStatusFilter) => void
  search: string
  onSearchChange: (value: string) => void
}

export default function SessionsFilterBar({
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
}: Readonly<SessionsFilterBarProps>) {
  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <ScrollArea type="auto" offsetScrollbars>
          <SegmentedControl
            aria-label="Lọc theo trạng thái phiên"
            size="xs"
            value={statusFilter}
            onChange={(val) => onStatusFilterChange(val as SessionStatusFilter)}
            data={STATUS_FILTER_OPTIONS}
          />
        </ScrollArea>

        <TextInput
          aria-label="Tìm kiếm phiên phỏng vấn"
          placeholder="Tìm theo vị trí hoặc công ty..."
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          miw={240}
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
      </Group>
    </Paper>
  )
}
