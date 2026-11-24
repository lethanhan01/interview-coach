'use client'

import { useMemo } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  CloseButton,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconDownload,
  IconFilter,
  IconSearch,
  IconX,
} from '@tabler/icons-react'
import type { SfiaCategory, SfiaLevelResponsibility } from '@/types'

export interface SfiaBlindSpotsToolbarProps {
  totalBlindSpots: number
  categories: SfiaCategory[]
  levels?: SfiaLevelResponsibility[]
  searchQuery: string
  selectedCategoryFilter: string | null
  selectedLevelFilter: number | null
  hasActiveFilters: boolean
  isExportingCsv?: boolean
  onSearchChange: (value: string) => void
  onSelectCategoryFilter?: (categoryCode: string | null) => void
  onSelectLevelFilter?: (level: number | null) => void
  onClearAllFilters: () => void
  onExportCsv?: () => void
}

const FALLBACK_LEVELS = [1, 2, 3, 4, 5, 6, 7]

function FilterChip({
  label,
  clearAriaLabel,
  onClear,
}: Readonly<{ label: string; clearAriaLabel: string; onClear: () => void }>) {
  return (
    <Badge
      size="sm"
      variant="light"
      color="brand"
      rightSection={
        <ActionIcon
          size="xs"
          variant="transparent"
          color="brand"
          aria-label={clearAriaLabel}
          onClick={onClear}
        >
          <IconX size={12} stroke={1.5} />
        </ActionIcon>
      }
    >
      {label}
    </Badge>
  )
}

export function SfiaBlindSpotsToolbar({
  totalBlindSpots,
  categories,
  levels,
  searchQuery,
  selectedCategoryFilter,
  selectedLevelFilter,
  hasActiveFilters,
  isExportingCsv = false,
  onSearchChange,
  onSelectCategoryFilter,
  onSelectLevelFilter,
  onClearAllFilters,
  onExportCsv,
}: Readonly<SfiaBlindSpotsToolbarProps>) {
  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat.code,
        label: cat.nameVi || cat.name,
      })),
    [categories]
  )

  const levelOptions = useMemo(() => {
    if (levels && levels.length > 0) {
      return levels.map((lvl) => ({
        value: String(lvl.levelId),
        label: `L${lvl.levelId} — ${lvl.nameVi || lvl.name}`,
      }))
    }
    return FALLBACK_LEVELS.map((lvl) => ({
      value: String(lvl),
      label: `Cấp L${lvl}`,
    }))
  }, [levels])

  const activeCategoryName = useMemo(() => {
    if (!selectedCategoryFilter) return null
    const found = categories.find((c) => c.code === selectedCategoryFilter)
    return found?.nameVi || found?.name || selectedCategoryFilter
  }, [categories, selectedCategoryFilter])

  return (
    <Stack gap="sm" p="md">
      <Group justify="space-between" align="flex-start" gap="xs" wrap="wrap">
        <Group gap="xs" align="flex-start" wrap="nowrap">
          <ThemeIcon size="md" radius="md" variant="light" color="danger">
            <IconAlertTriangle size={16} stroke={1.5} />
          </ThemeIcon>
          <Stack gap={2}>
            <Group gap="xs" wrap="wrap">
              <Title order={3} size="h5">
                Bảng Cảnh Báo Điểm Mù Kỹ Năng
              </Title>
              <Badge size="sm" variant="light" color="danger">
                {totalBlindSpots} điểm mù
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Danh sách kỹ năng SFIA 9 chưa có câu hỏi trong Ngân hàng câu hỏi
            </Text>
          </Stack>
        </Group>

        {onExportCsv ? (
          <Button
            variant="light"
            color="neutral"
            size="xs"
            loading={isExportingCsv}
            leftSection={<IconDownload size={14} stroke={1.5} />}
            onClick={onExportCsv}
          >
            Xuất CSV Điểm mù
          </Button>
        ) : null}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
        <TextInput
          size="xs"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          placeholder="Tìm mã (PROG) hoặc tên kỹ năng..."
          aria-label="Tìm kiếm điểm mù kỹ năng"
          leftSection={<IconSearch size={14} stroke={1.5} />}
          rightSection={
            searchQuery ? (
              <CloseButton
                size="xs"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={() => onSearchChange('')}
              />
            ) : null
          }
        />

        <Select
          size="xs"
          searchable
          clearable
          aria-label="Lọc theo danh mục SFIA"
          placeholder="Tất cả danh mục"
          value={selectedCategoryFilter}
          onChange={(val) => onSelectCategoryFilter?.(val)}
          data={categoryOptions}
        />

        <Select
          size="xs"
          clearable
          aria-label="Lọc theo cấp độ SFIA"
          placeholder="Tất cả cấp độ"
          value={
            selectedLevelFilter != null ? String(selectedLevelFilter) : null
          }
          onChange={(val) => onSelectLevelFilter?.(val ? Number(val) : null)}
          data={levelOptions}
        />
      </SimpleGrid>

      {hasActiveFilters ? (
        <Group gap="xs" align="center" wrap="wrap">
          <Group gap={4} wrap="nowrap">
            <IconFilter size={13} stroke={1.5} />
            <Text size="xs" c="dimmed">
              Đang lọc:
            </Text>
          </Group>

          {searchQuery.trim() ? (
            <FilterChip
              label={`Từ khóa: "${searchQuery.trim()}"`}
              clearAriaLabel="Xóa lọc từ khóa"
              onClear={() => onSearchChange('')}
            />
          ) : null}

          {activeCategoryName ? (
            <FilterChip
              label={`Danh mục: ${activeCategoryName}`}
              clearAriaLabel="Xóa lọc danh mục"
              onClear={() => onSelectCategoryFilter?.(null)}
            />
          ) : null}

          {selectedLevelFilter != null ? (
            <FilterChip
              label={`Cấp L${selectedLevelFilter}`}
              clearAriaLabel="Xóa lọc cấp độ"
              onClear={() => onSelectLevelFilter?.(null)}
            />
          ) : null}

          <Button
            variant="subtle"
            color="neutral"
            size="compact-xs"
            onClick={onClearAllFilters}
          >
            Xóa tất cả bộ lọc
          </Button>
        </Group>
      ) : null}
    </Stack>
  )
}
