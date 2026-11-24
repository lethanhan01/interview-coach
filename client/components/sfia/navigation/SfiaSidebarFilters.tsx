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
  onExpandAll: () => void
  onCollapseAll: () => void
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
  onExpandAll,
  onCollapseAll,
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
    <Stack gap="xs" p="xs">
      <TextInput
        ref={searchInputRef}
        size="xs"
        placeholder="Tìm mã hoặc tên kỹ năng... (Ctrl+K)"
        aria-label="Tìm kiếm kỹ năng SFIA 9"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        leftSection={<IconSearch size={14} stroke={1.5} />}
        rightSectionWidth={64}
        rightSection={
          searchQuery ? (
            <ActionIcon
              size="xs"
              variant="subtle"
              color="neutral"
              aria-label="Xóa tìm kiếm"
              onClick={() => onSearchChange('')}
            >
              <IconX size={12} stroke={1.5} />
            </ActionIcon>
          ) : (
            <Kbd size="xs">Ctrl+K</Kbd>
          )
        }
      />

      <Group grow gap="xs">
        <Select
          size="xs"
          placeholder="Tất cả danh mục"
          aria-label="Lọc theo danh mục SFIA 9"
          data={categoryData}
          value={selectedCategory}
          onChange={(val) => onCategoryChange(val)}
          clearable
          searchable
        />

        <Select
          size="xs"
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

      <Group justify="space-between" align="center">
        <Switch
          size="xs"
          color="danger"
          label="Chỉ điểm mù (0 câu)"
          checked={blindSpotsOnly}
          onChange={(e) => onBlindSpotsOnlyChange(e.currentTarget.checked)}
        />

        <Group gap={4}>
          <Button
            variant="subtle"
            size="xs"
            color="neutral"
            onClick={onExpandAll}
          >
            Mở rộng
          </Button>
          <Button
            variant="subtle"
            size="xs"
            color="neutral"
            onClick={onCollapseAll}
          >
            Thu gọn
          </Button>
        </Group>
      </Group>
    </Stack>
  )
}
