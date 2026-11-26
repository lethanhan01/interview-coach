'use client'

import {
  Button,
  CloseButton,
  Group,
  Paper,
  SegmentedControl,
  Text,
  TextInput,
} from '@mantine/core'
import {
  IconBriefcase,
  IconDownload,
  IconHelpCircle,
  IconSearch,
} from '@tabler/icons-react'
import type { SfiaMatrixDisplayMode } from '@/types'

export interface SfiaMatrixToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  displayMode: SfiaMatrixDisplayMode
  onDisplayModeChange: (mode: SfiaMatrixDisplayMode) => void
  onExportCsv: () => void
  isExporting?: boolean
  embedded?: boolean
  className?: string
}

const DISPLAY_MODE_OPTIONS = [
  {
    value: 'questions',
    label: (
      <Group gap={4} wrap="nowrap" justify="center">
        <IconHelpCircle size={13} stroke={1.5} />
        <Text component="span" size="xs">
          Câu hỏi
        </Text>
      </Group>
    ),
  },
  {
    value: 'onet',
    label: (
      <Group gap={4} wrap="nowrap" justify="center">
        <IconBriefcase size={13} stroke={1.5} />
        <Text component="span" size="xs">
          O*NET
        </Text>
      </Group>
    ),
  },
]

export function SfiaMatrixToolbar({
  searchQuery,
  onSearchChange,
  displayMode,
  onDisplayModeChange,
  onExportCsv,
  isExporting = false,
  embedded = false,
  className,
}: Readonly<SfiaMatrixToolbarProps>) {
  const content = (
    <Group
      justify="space-between"
      align="center"
      wrap="wrap"
      gap="xs"
      className={embedded ? className : undefined}
    >
      <Group gap="xs" align="center" wrap="wrap" flex={1}>
        <TextInput
          size="xs"
          w={{ base: '100%', sm: 240, lg: 280 }}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder="Tìm mã (PROG) hoặc tên kỹ năng..."
          aria-label="Tìm kiếm kỹ năng SFIA"
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

        <SegmentedControl
          size="xs"
          aria-label="Chế độ hiển thị ô ma trận"
          value={displayMode}
          onChange={(val) => onDisplayModeChange(val as SfiaMatrixDisplayMode)}
          data={DISPLAY_MODE_OPTIONS}
        />
      </Group>

      <Button
        variant="default"
        size="xs"
        leftSection={<IconDownload size={14} stroke={1.5} />}
        loading={isExporting}
        onClick={onExportCsv}
      >
        Xuất CSV
      </Button>
    </Group>
  )

  if (embedded) {
    return content
  }

  return (
    <Paper withBorder radius="md" px="xs" py={6} className={className}>
      {content}
    </Paper>
  )
}
