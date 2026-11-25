'use client'

import {
  Badge,
  Button,
  CloseButton,
  Divider,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import {
  IconBriefcase,
  IconDownload,
  IconHelpCircle,
  IconSearch,
  IconStack2,
} from '@tabler/icons-react'
import type { SfiaCategory, SfiaMatrixDisplayMode } from '@/types'

export interface SfiaMatrixToolbarProps {
  categories: SfiaCategory[]
  selectedCategory: string
  onCategoryChange: (categoryCode: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  displayMode: SfiaMatrixDisplayMode
  onDisplayModeChange: (mode: SfiaMatrixDisplayMode) => void
  blindSpotsOnly: boolean
  onBlindSpotsOnlyChange: (enabled: boolean) => void
  onExportCsv: () => void
  totalSkillsCount: number
  displayedSkillsCount: number
  blindSpotsCount?: number
  isExporting?: boolean
  className?: string
}

const DISPLAY_MODE_OPTIONS = [
  {
    value: 'level',
    label: (
      <Group gap={4} wrap="nowrap" justify="center">
        <IconStack2 size={14} stroke={1.5} />
        <Text component="span" size="sm">
          Cấp độ
        </Text>
      </Group>
    ),
  },
  {
    value: 'questions',
    label: (
      <Group gap={4} wrap="nowrap" justify="center">
        <IconHelpCircle size={14} stroke={1.5} />
        <Text component="span" size="sm">
          Câu hỏi
        </Text>
      </Group>
    ),
  },
  {
    value: 'onet',
    label: (
      <Group gap={4} wrap="nowrap" justify="center">
        <IconBriefcase size={14} stroke={1.5} />
        <Text component="span" size="sm">
          O*NET
        </Text>
      </Group>
    ),
  },
]

export function SfiaMatrixToolbar({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  displayMode,
  onDisplayModeChange,
  blindSpotsOnly,
  onBlindSpotsOnlyChange,
  onExportCsv,
  totalSkillsCount,
  displayedSkillsCount,
  blindSpotsCount,
  isExporting = false,
  className,
}: Readonly<SfiaMatrixToolbarProps>) {
  const categoryOptions = categories.map((cat) => ({
    value: cat.code,
    label: `${cat.nameVi || cat.name} (${cat.skillCount})`,
  }))

  return (
    <Paper withBorder radius="md" p="xs" className={className}>
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap="xs" align="center" wrap="wrap" flex={1}>
            <TextInput
              size="sm"
              w={{ base: '100%', sm: 260, lg: 300 }}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              placeholder="Tìm mã (PROG) hoặc tên kỹ năng..."
              aria-label="Tìm kiếm kỹ năng SFIA"
              leftSection={<IconSearch size={15} stroke={1.5} />}
              rightSection={
                searchQuery ? (
                  <CloseButton
                    size="sm"
                    aria-label="Xóa từ khóa tìm kiếm"
                    onClick={() => onSearchChange('')}
                  />
                ) : null
              }
            />
            <Select
              size="sm"
              w={{ base: '100%', sm: 250 }}
              aria-label="Lọc theo danh mục"
              placeholder="Tất cả danh mục"
              clearable
              clearButtonProps={{ 'aria-label': 'Xóa bộ lọc danh mục' }}
              data={categoryOptions}
              value={selectedCategory || null}
              onChange={(val) => onCategoryChange(val ?? '')}
            />
          </Group>

          <Button
            variant="default"
            size="sm"
            leftSection={<IconDownload size={15} stroke={1.5} />}
            loading={isExporting}
            onClick={onExportCsv}
          >
            Xuất Ma trận CSV
          </Button>
        </Group>

        <Divider />

        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap="sm" align="center" wrap="wrap">
            <Group gap="xs" align="center" wrap="nowrap">
              <Text size="sm" c="dimmed" fw={500}>
                Hiển thị ô:
              </Text>
              <SegmentedControl
                size="sm"
                aria-label="Chế độ hiển thị ô ma trận"
                value={displayMode}
                onChange={(val) =>
                  onDisplayModeChange(val as SfiaMatrixDisplayMode)
                }
                data={DISPLAY_MODE_OPTIONS}
              />
            </Group>

            <Group gap={6} align="center" wrap="nowrap">
              <Switch
                size="sm"
                color="danger"
                checked={blindSpotsOnly}
                onChange={(e) =>
                  onBlindSpotsOnlyChange(e.currentTarget.checked)
                }
                label="Chỉ hiện điểm mù (0 câu hỏi)"
              />
              {blindSpotsCount !== undefined && (
                <Badge color="danger" variant="light" size="sm">
                  {blindSpotsCount}
                </Badge>
              )}
            </Group>
          </Group>

          <Text size="sm" c="dimmed">
            Đang hiển thị:{' '}
            <Text component="span" fw={700} c="inherit">
              {displayedSkillsCount}
            </Text>{' '}
            / {totalSkillsCount} kỹ năng
          </Text>
        </Group>
      </Stack>
    </Paper>
  )
}
