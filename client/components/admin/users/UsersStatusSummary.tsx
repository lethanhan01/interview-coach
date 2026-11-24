'use client'

import { Badge, Group, Paper, Progress, Stack } from '@mantine/core'
import type { DashboardUserMetrics } from '@/components/admin/dashboard/dashboard-metrics'

interface UsersStatusSummaryProps {
  metrics: DashboardUserMetrics
}

export function UsersStatusSummary({
  metrics,
}: Readonly<UsersStatusSummaryProps>) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Progress.Root size="lg" radius="md">
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
          <Progress.Section
            value={metrics.lockedPercent}
            color="danger"
            aria-label={`Đã khóa ${metrics.lockedPercent}%`}
          >
            {metrics.lockedPercent >= 12 ? (
              <Progress.Label>Đã khóa {metrics.lockedPercent}%</Progress.Label>
            ) : null}
          </Progress.Section>
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
