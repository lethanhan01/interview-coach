'use client'

import {
  ActionIcon,
  Badge,
  CopyButton,
  Group,
  Highlight,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconCheck, IconCopy, IconStar } from '@tabler/icons-react'
import type { OnetTaskStatement } from '@/types'

export interface OnetTaskItemProps {
  task: OnetTaskStatement
  searchQuery?: string
  index: number
}

export function OnetTaskItem({
  task,
  searchQuery = '',
  index,
}: Readonly<OnetTaskItemProps>) {
  return (
    <Paper withBorder p="xs" radius="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
        <Stack gap={4} flex={1} miw={0}>
          <Group gap={6} align="center">
            <Text size="xs" c="dimmed" ff="monospace">
              #{index + 1}
            </Text>
            {task.isCore ? (
              <Badge
                color="brand"
                variant="light"
                size="sm"
                leftSection={<IconStar size={11} stroke={1.5} />}
              >
                Cốt lõi
              </Badge>
            ) : (
              <Badge color="neutral" variant="outline" size="sm">
                Bổ trợ
              </Badge>
            )}
          </Group>

          <Highlight highlight={searchQuery} size="sm" lh="relaxed">
            {task.statement}
          </Highlight>
        </Stack>

        <CopyButton value={task.statement} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip
              label={copied ? 'Đã sao chép' : 'Sao chép nhiệm vụ'}
              withArrow
            >
              <ActionIcon
                color={copied ? 'success' : 'neutral'}
                variant="subtle"
                size="sm"
                onClick={copy}
                aria-label="Sao chép nội dung nhiệm vụ"
              >
                {copied ? (
                  <IconCheck size={15} stroke={1.5} />
                ) : (
                  <IconCopy size={15} stroke={1.5} />
                )}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </Paper>
  )
}
