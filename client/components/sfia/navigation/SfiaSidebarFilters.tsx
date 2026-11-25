'use client'

import type { RefObject } from 'react'
import {
  ActionIcon,
  Button,
  Group,
  Kbd,
  Select,
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
  selectedCategory,
  onCategoryChange,
  selectedLevel,
  onLevelChange,
  blindSpotsOnly,
  onBlindSpotsOnlyChange,
  categories,
  levels,
  isAllExpanded,
  onToggleExpandAll,
  searchInputRef,
}: Readonly<SfiaSidebarFiltersProps>) {
  const categoryData = categories.map((c) => ({
    value: c.code,
    label: c.nameVi || c.name,
  }))

  const hasLevels = Boolean(levels && levels.length > 0)
  const levelData = [
    { value: 'all', label: 'Tất cả cấp độ' },
    ...(levels ?? []).map((l) => ({
      value: String(l.levelId),
      label: `L${l.levelId} — ${l.nameVi || l.name}`,
    })),
  ]

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

      <Group grow gap={6}>
        <Select
          size="sm"
          placeholder="Tất cả danh mục"
          aria-label="Lọc theo danh mục SFIA 9"
          data={categoryData}
          value={selectedCategory}
          onChange={(val) => onCategoryChange(val)}
          clearable
          searchable
        />

        <Select
          size="sm"
          placeholder="Cấp độ"
          aria-label="Lọc theo cấp độ SFIA 9"
          data={levelData}
          value={String(selectedLevel)}
          disabled={!hasLevels}
          onChange={(val) =>
            onLevelChange(val === 'all' || !val ? 'all' : Number(val))
          }
        />
      </Group>

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
