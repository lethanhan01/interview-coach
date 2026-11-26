'use client'

import {
  CloseButton,
  Group,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

export type StatusFilter = 'all' | 'active' | 'locked'
export type RoleFilter = 'all' | 'admin' | 'candidate'

interface UsersFilterToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
  roleFilter: RoleFilter
  onRoleFilterChange: (value: RoleFilter) => void
  filteredCount: number
  totalCount: number
  hasActiveFilter: boolean
}

export function UsersFilterToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
  filteredCount,
  totalCount,
  hasActiveFilter,
}: Readonly<UsersFilterToolbarProps>) {
  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center" gap="sm" wrap="wrap">
        <TextInput
          placeholder="Tìm theo email hoặc họ tên..."
          aria-label="Tìm theo email hoặc họ tên"
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          leftSection={<IconSearch size={16} stroke={1.5} />}
          rightSection={
            search ? (
              <CloseButton
                size="sm"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={() => onSearchChange('')}
              />
            ) : null
          }
          w={{ base: '100%', sm: 320 }}
        />

        <Group gap="sm" wrap="wrap">
          <SegmentedControl
            size="xs"
            value={statusFilter}
            onChange={(value) => onStatusFilterChange(value as StatusFilter)}
            aria-label="Lọc theo trạng thái tài khoản"
            data={[
              { value: 'all', label: 'Tất cả' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'locked', label: 'Đã khóa' },
            ]}
          />

          <Select
            size="xs"
            w={180}
            aria-label="Lọc theo vai trò"
            value={roleFilter}
            onChange={(value) =>
              onRoleFilterChange((value as RoleFilter | null) ?? 'all')
            }
            allowDeselect={false}
            data={[
              { value: 'all', label: 'Tất cả vai trò' },
              { value: 'admin', label: 'Quản trị viên' },
              { value: 'candidate', label: 'Ứng viên' },
            ]}
          />
        </Group>
      </Group>

      {hasActiveFilter ? (
        <Text size="xs" c="dimmed">
          Hiển thị {filteredCount} / {totalCount} tài khoản
        </Text>
      ) : null}
    </Stack>
  )
}
