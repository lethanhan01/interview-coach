'use client'

import { Button, Paper, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconAlertTriangle, IconPlus, IconSearch } from '@tabler/icons-react'

export interface SfiaQuestionEmptyStateProps {
  variant: 'blind-spot' | 'no-match'
  skillCode: string
  onOpenCreateModal: () => void
  onResetFilters: () => void
}

export function SfiaQuestionEmptyState({
  variant,
  skillCode,
  onOpenCreateModal,
  onResetFilters,
}: Readonly<SfiaQuestionEmptyStateProps>) {
  if (variant === 'blind-spot') {
    return (
      <Paper withBorder p="md" radius="md" ta="center">
        <Stack align="center" gap="xs">
          <ThemeIcon color="danger" variant="light" size="lg" radius="xl">
            <IconAlertTriangle size={20} stroke={1.5} />
          </ThemeIcon>
          <Text fw={700} size="md">
            Chưa có câu hỏi nào cho kỹ năng này
          </Text>
          <Text size="sm" c="dimmed" maw={440}>
            Kỹ năng {skillCode} hiện đang là điểm mù trong ngân hàng câu hỏi
            phỏng vấn. Tạo câu hỏi đầu tiên để lấp đầy độ phủ.
          </Text>
          <Button
            size="sm"
            color="brand"
            onClick={onOpenCreateModal}
            leftSection={<IconPlus size={15} stroke={1.5} />}
          >
            Tạo câu hỏi đầu tiên
          </Button>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper withBorder p="md" radius="md" ta="center">
      <Stack align="center" gap="xs">
        <IconSearch size={26} stroke={1.5} />
        <Text fw={700} size="md">
          Không tìm thấy câu hỏi phù hợp
        </Text>
        <Text size="sm" c="dimmed">
          Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh các bộ lọc.
        </Text>
        <Button
          variant="outline"
          size="sm"
          color="neutral"
          onClick={onResetFilters}
        >
          Đặt lại bộ lọc
        </Button>
      </Stack>
    </Paper>
  )
}
