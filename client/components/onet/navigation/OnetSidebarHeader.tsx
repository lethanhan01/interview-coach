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
import layout from '@/styles/layout.module.css'
import type { OnetMappingStatusFilter } from '@/types'

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
    <Stack gap={6} className={layout.panelHeader}>
      <Group justify="space-between" wrap="nowrap">
        <Group gap={6} wrap="nowrap">
          <Text size="md" fw={700}>
            Phân loại nghề nghiệp
          </Text>
          <Badge color="neutral" variant="outline" size="sm">
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
        size="sm"
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        placeholder="Tìm mã SOC hoặc tên nghề..."
        aria-label="Tìm kiếm nghề nghiệp O*NET"
        leftSection={<IconSearch size={15} stroke={1.5} />}
        rightSection={
          query ? (
            <ActionIcon
              size="sm"
              variant="subtle"
              color="neutral"
              aria-label="Xóa từ khóa tìm kiếm"
              onClick={() => onQueryChange('')}
            >
              <IconX size={14} stroke={1.5} />
            </ActionIcon>
          ) : null
        }
      />

      <SegmentedControl
        size="sm"
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
