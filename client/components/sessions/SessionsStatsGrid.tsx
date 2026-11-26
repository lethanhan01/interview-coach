'use client'

import {
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconChartBar,
  IconCircleCheck,
  IconMessages,
} from '@tabler/icons-react'
import type { Session, SessionStatus } from '@/types'
import { getScoreColor } from './SessionListCard'

export const IN_PROGRESS_STATUSES = new Set<SessionStatus>([
  'active',
  'paused',
  'ready',
  'generating',
  'completing',
])

export const OTHER_STATUSES = new Set<SessionStatus>(['canceled', 'error'])

export interface SessionsStats {
  total: number
  completedCount: number
  inProgress: number
  avgScore: number | null
  completionRate: number
}

export function computeSessionsStats(sessions: Session[]): SessionsStats {
  const total = sessions.length
  const completed = sessions.filter((s) => s.status === 'completed')
  const inProgress = sessions.filter((s) =>
    IN_PROGRESS_STATUSES.has(s.status)
  ).length
  const scored = completed.filter((s) => s.overallScore != null)
  const avgScore =
    scored.length > 0
      ? Math.round(
          (scored.reduce((sum, s) => sum + (s.overallScore ?? 0), 0) /
            scored.length) *
            10
        ) / 10
      : null
  const completionRate =
    total > 0 ? Math.round((completed.length / total) * 100) : 0
  return {
    total,
    completedCount: completed.length,
    inProgress,
    avgScore,
    completionRate,
  }
}

export interface SessionsStatsGridProps {
  stats: SessionsStats
}

export default function SessionsStatsGrid({
  stats,
}: Readonly<SessionsStatsGridProps>) {
  const avgColor =
    stats.avgScore != null ? getScoreColor(stats.avgScore) : 'neutral'

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" fw={500}>
              Tổng số phiên
            </Text>
            <Title order={2} size="h2">
              {stats.total}
            </Title>
            <Text size="xs" c="dimmed">
              {stats.inProgress} đang thực hiện
            </Text>
          </Stack>
          <ThemeIcon size={38} radius="md" variant="light" color="brand">
            <IconMessages size={20} stroke={1.5} aria-hidden="true" />
          </ThemeIcon>
        </Group>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" fw={500}>
              Đã hoàn thành
            </Text>
            <Title order={2} size="h2">
              {stats.completedCount}
            </Title>
            <Text size="xs" c="dimmed">
              {stats.completionRate}% tổng phiên
            </Text>
          </Stack>
          <ThemeIcon size={38} radius="md" variant="light" color="success">
            <IconCircleCheck size={20} stroke={1.5} aria-hidden="true" />
          </ThemeIcon>
        </Group>
      </Paper>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" fw={500}>
              Điểm trung bình
            </Text>
            <Title order={2} size="h2">
              {stats.avgScore != null ? `${stats.avgScore}/100` : '—'}
            </Title>
            <Text size="xs" c="dimmed">
              {stats.avgScore != null
                ? 'Trên các phiên đã chấm'
                : 'Chưa có phiên được chấm'}
            </Text>
          </Stack>
          <ThemeIcon size={38} radius="md" variant="light" color={avgColor}>
            <IconChartBar size={20} stroke={1.5} aria-hidden="true" />
          </ThemeIcon>
        </Group>
      </Paper>
    </SimpleGrid>
  )
}
