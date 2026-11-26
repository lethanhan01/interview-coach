'use client'

import type { RefObject } from 'react'
import {
  ActionIcon,
  Button,
  Group,
  Kbd,
  Stack,
  Switch,
  TextInput,
} from '@mantine/core'
import { IconSearch, IconX } from '@tabler/icons-react'
import type { SfiaCategory, SfiaLevelResponsibility } from '@/types'

export interface SfiaSidebarFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  selectedCategory: string | null
  onCategoryChange: (val: string | null) => void
  selectedLevel: number | 'all'
  onLevelChange: (val: number | 'all') => void
  blindSpotsOnly: boolean
  onBlindSpotsOnlyChange: (val: boolean) => void
  categories: SfiaCategory[]
  levels?: SfiaLevelResponsibility[]
  isAllExpanded: boolean
  onToggleExpandAll: () => void
  searchInputRef: RefObject<HTMLInputElement | null>
}

export function SfiaSidebarFilters({
  searchQuery,
  onSearchChange,
  blindSpotsOnly,
  onBlindSpotsOnlyChange,
  isAllExpanded,
  onToggleExpandAll,
  searchInputRef,
}: Readonly<SfiaSidebarFiltersProps>) {
  return (
    <Stack gap={6} p="xs">
      <TextInput
        ref={searchInputRef}
        size="sm"
        placeholder="Tìm mã hoặc tên kỹ năng..."
        aria-label="Tìm kiếm kỹ năng SFIA 9"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        leftSection={<IconSearch size={15} stroke={1.5} />}
        rightSectionWidth={64}
        rightSection={
          searchQuery ? (
            <ActionIcon
              size="sm"
              variant="subtle"
              color="neutral"
              aria-label="Xóa tìm kiếm"
              onClick={() => onSearchChange('')}
            >
              <IconX size={14} stroke={1.5} />
            </ActionIcon>
          ) : (
            <Kbd size="xs">Ctrl+K</Kbd>
          )
        }
      />

      <Group grow gap={6}></Group>

      <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
        <Switch
          size="sm"
          color="danger"
          label="Chỉ điểm mù (0 câu)"
          checked={blindSpotsOnly}
          onChange={(e) => onBlindSpotsOnlyChange(e.currentTarget.checked)}
        />

        <Button
          variant="subtle"
          size="compact-sm"
          color="neutral"
          flex="0 0 auto"
          onClick={onToggleExpandAll}
        >
          {isAllExpanded ? 'Thu gọn' : 'Mở tất cả'}
        </Button>
      </Group>
    </Stack>
  )
}
