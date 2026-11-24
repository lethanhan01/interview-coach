'use client'

import {
  ActionIcon,
  Badge,
  Group,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconSearch, IconX } from '@tabler/icons-react'
import type { OnetMappingStatusFilter } from '@/types'
import classes from './OnetSidebar.module.css'

export interface OnetSidebarHeaderProps {
  totalOccupations: number
  hasSearch: boolean
  searchResultCount: number
  visibleGroupsCount: number
  majorGroupsCount: number
  query: string
  onQueryChange: (query: string) => void
  mappingStatus: OnetMappingStatusFilter
  onMappingStatusChange: (status: OnetMappingStatusFilter) => void
}

export function OnetSidebarHeader({
  totalOccupations,
  hasSearch,
  searchResultCount,
  visibleGroupsCount,
  majorGroupsCount,
  query,
  onQueryChange,
  mappingStatus,
  onMappingStatusChange,
}: Readonly<OnetSidebarHeaderProps>) {
  return (
    <Stack gap="xs" className={classes.header}>
      <Group justify="space-between" wrap="nowrap">
        <Group gap={6} wrap="nowrap">
          <Text size="sm" fw={700}>
            Phân loại nghề nghiệp
          </Text>
          <Badge color="neutral" variant="outline" size="xs">
            {totalOccupations > 0 ? `${totalOccupations} SOC` : 'O*NET SOC'}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed">
          {hasSearch
            ? `${searchResultCount} kết quả`
            : `${visibleGroupsCount}/${majorGroupsCount} nhóm`}
        </Text>
      </Group>

      <TextInput
        size="xs"
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        placeholder="Tìm mã SOC hoặc tên nghề..."
        aria-label="Tìm kiếm nghề nghiệp O*NET"
        leftSection={<IconSearch size={14} stroke={1.5} />}
        rightSection={
          query ? (
            <ActionIcon
              size="xs"
              variant="subtle"
              color="neutral"
              aria-label="Xóa từ khóa tìm kiếm"
              onClick={() => onQueryChange('')}
            >
              <IconX size={12} stroke={1.5} />
            </ActionIcon>
          ) : null
        }
      />

      <SegmentedControl
        size="xs"
        fullWidth
        value={mappingStatus}
        onChange={(val) =>
          onMappingStatusChange(val as OnetMappingStatusFilter)
        }
        aria-label="Lọc theo trạng thái ánh xạ SFIA"
        data={[
          { value: 'all', label: 'Tất cả' },
          { value: 'mapped', label: 'Đã ánh xạ' },
          { value: 'unmapped', label: 'Chưa ánh xạ' },
        ]}
      />
    </Stack>
  )
}
