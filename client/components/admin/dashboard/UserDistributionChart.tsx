'use client'

import dynamic from 'next/dynamic'
import type { DonutChartCell } from '@mantine/charts'
import {
  Badge,
  Center,
  Divider,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import typography from '@/styles/typography.module.css'
import type { DashboardUserMetrics } from './dashboard-metrics'

const UserDistributionDonut = dynamic(() => import('./UserDistributionDonut'), {
  ssr: false,
  loading: () => <Skeleton height={160} width={160} circle />,
})

interface UserDistributionChartProps {
  metrics: DashboardUserMetrics
}

export function UserDistributionChart({
  metrics,
}: Readonly<UserDistributionChartProps>) {
  const donutData: DonutChartCell[] = [
    { name: 'Hoạt động', value: metrics.activeUsers, color: 'success' },
    { name: 'Đã khóa', value: metrics.lockedUsers, color: 'danger' },
  ].filter((segment) => segment.value > 0)

  return (
    <Paper withBorder p="lg" radius="md" h="100%">
      <Stack gap="md" h="100%">
        <Stack gap={2}>
          <Title order={2} size="h4">
            Phân bổ tài khoản
          </Title>
          <Text size="xs" c="dimmed">
            Tỷ trọng trạng thái hoạt động và vai trò hệ thống
          </Text>
        </Stack>

        <Center py="xs">
          {metrics.totalUsers > 0 ? (
            <UserDistributionDonut
              data={donutData}
              chartLabel={String(metrics.totalUsers)}
            />
          ) : (
            <Text size="sm" c="dimmed" py="xl">
              Chưa có tài khoản nào
            </Text>
          )}
        </Center>

        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Badge color="success" variant="dot" size="sm">
              Hoạt động
            </Badge>
            <Text size="sm" fw={600} className={typography.tabularNums}>
              {metrics.activeUsers} ({metrics.activePercent}%)
            </Text>
          </Group>

          <Group justify="space-between" align="center">
            <Badge color="danger" variant="dot" size="sm">
              Đã khóa
            </Badge>
            <Text size="sm" fw={600} className={typography.tabularNums}>
              {metrics.lockedUsers} ({metrics.lockedPercent}%)
            </Text>
          </Group>
        </Stack>

        <Divider />

        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed" fw={500}>
            Phân quyền
          </Text>
          <Group gap="xs">
            <Badge color="brand" variant="light" size="sm">
              Quản trị viên: {metrics.adminCount}
            </Badge>
            <Badge color="neutral" variant="light" size="sm">
              Ứng viên: {metrics.candidateCount}
            </Badge>
          </Group>
        </Group>
      </Stack>
    </Paper>
  )
}
