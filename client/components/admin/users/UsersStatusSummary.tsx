'use client'

import {
  Badge,
  Group,
  Paper,
  Progress,
  Skeleton,
  Stack,
  Tooltip,
} from '@mantine/core'
import type { DashboardUserMetrics } from '@/components/admin/user-metrics'

interface UsersStatusSummaryProps {
  metrics: DashboardUserMetrics
  isLoading?: boolean
}

export function UsersStatusSummary({
  metrics,
  isLoading = false,
}: Readonly<UsersStatusSummaryProps>) {
  if (isLoading) {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Skeleton height={16} radius="md" />
          <Group gap="md" wrap="wrap">
            <Skeleton height={20} width={110} radius="xl" />
            <Skeleton height={20} width={100} radius="xl" />
            <Skeleton height={20} width={120} radius="xl" />
            <Skeleton height={20} width={100} radius="xl" />
          </Group>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Progress.Root size="lg" radius="md">
          <Tooltip
            label={`Hoạt động: ${metrics.activeUsers} tài khoản (${metrics.activePercent}%)`}
            withArrow
          >
            <Progress.Section
              value={metrics.activePercent}
              color="success"
              aria-label={`Hoạt động ${metrics.activePercent}%`}
            >
              {metrics.activePercent >= 12 ? (
                <Progress.Label>
                  Hoạt động {metrics.activePercent}%
                </Progress.Label>
              ) : null}
            </Progress.Section>
          </Tooltip>
          <Tooltip
            label={`Đã khóa: ${metrics.lockedUsers} tài khoản (${metrics.lockedPercent}%)`}
            withArrow
          >
            <Progress.Section
              value={metrics.lockedPercent}
              color="danger"
              aria-label={`Đã khóa ${metrics.lockedPercent}%`}
            >
              {metrics.lockedPercent >= 12 ? (
                <Progress.Label>
                  Đã khóa {metrics.lockedPercent}%
                </Progress.Label>
              ) : null}
            </Progress.Section>
          </Tooltip>
        </Progress.Root>
        <Group gap="md" wrap="wrap">
          <Badge color="success" variant="dot" size="sm">
            Hoạt động: {metrics.activeUsers}
          </Badge>
          <Badge color="danger" variant="dot" size="sm">
            Đã khóa: {metrics.lockedUsers}
          </Badge>
          <Badge color="brand" variant="dot" size="sm">
            Quản trị viên: {metrics.adminCount}
          </Badge>
          <Badge color="neutral" variant="dot" size="sm">
            Ứng viên: {metrics.candidateCount}
          </Badge>
        </Group>
      </Stack>
    </Paper>
  )
}
