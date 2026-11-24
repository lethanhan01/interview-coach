'use client'

import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Select,
  TextInput,
} from '@mantine/core'
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react'

export interface SfiaQuestionFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  filterLevel: string
  onFilterLevelChange: (val: string) => void
  filterDifficulty: string
  onFilterDifficultyChange: (val: string) => void
  filterType: string
  onFilterTypeChange: (val: string) => void
  onOpenCreateModal: () => void
  minLevel: number
  maxLevel: number
  selectedLevel: number
}

export function SfiaQuestionFilters({
  searchQuery,
  onSearchChange,
  filterLevel,
  onFilterLevelChange,
  filterDifficulty,
  onFilterDifficultyChange,
  filterType,
  onFilterTypeChange,
  onOpenCreateModal,
  minLevel,
  maxLevel,
  selectedLevel,
}: Readonly<SfiaQuestionFiltersProps>) {
  const levelData = [
    { value: 'all', label: 'Tất cả cấp độ' },
    { value: 'current', label: `Cấp hiện tại (L${selectedLevel})` },
    ...Array.from({ length: maxLevel - minLevel + 1 }, (_, i) => {
      const lvl = minLevel + i
      return { value: String(lvl), label: `Cấp L${lvl}` }
    }),
  ]

  const difficultyData = [
    { value: 'ALL', label: 'Tất cả độ khó' },
    { value: 'EASY', label: 'Dễ' },
    { value: 'MEDIUM', label: 'Trung bình' },
    { value: 'HARD', label: 'Khó' },
  ]

  const typeData = [
    { value: 'ALL', label: 'Tất cả loại câu hỏi' },
    { value: 'TECHNICAL', label: 'Chuyên môn (Technical)' },
    { value: 'BEHAVIORAL', label: 'Hành vi (Behavioral)' },
    { value: 'SITUATIONAL', label: 'Tình huống (Situational)' },
    { value: 'HR', label: 'Nhân sự (HR)' },
  ]

  return (
    <Paper withBorder p="xs" radius="md">
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <TextInput
          size="xs"
          placeholder="Tìm kiếm câu hỏi hoặc mã ID..."
          aria-label="Tìm kiếm câu hỏi"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          leftSection={<IconSearch size={14} stroke={1.5} />}
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
            ) : null
          }
          flex={1}
          miw={200}
        />

        <Group gap="xs" wrap="wrap">
          <Select
            size="xs"
            placeholder="Cấp độ"
            aria-label="Lọc theo cấp độ"
            data={levelData}
            value={filterLevel}
            onChange={(val) => onFilterLevelChange(val ?? 'all')}
            w={150}
          />

          <Select
            size="xs"
            placeholder="Độ khó"
            aria-label="Lọc theo độ khó"
            data={difficultyData}
            value={filterDifficulty}
            onChange={(val) => onFilterDifficultyChange(val ?? 'ALL')}
            w={130}
          />

          <Select
            size="xs"
            placeholder="Phân loại"
            aria-label="Lọc theo phân loại"
            data={typeData}
            value={filterType}
            onChange={(val) => onFilterTypeChange(val ?? 'ALL')}
            w={160}
          />

          <Button
            size="xs"
            color="brand"
            onClick={onOpenCreateModal}
            leftSection={<IconPlus size={14} stroke={1.5} />}
          >
            Thêm câu hỏi
          </Button>
        </Group>
      </Group>
    </Paper>
  )
}
