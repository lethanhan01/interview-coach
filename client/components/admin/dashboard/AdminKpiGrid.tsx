'use client'

import {
  Badge,
  Group,
  NumberFormatter,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import {
  IconShield,
  IconUserCheck,
  IconUserOff,
  IconUsers,
} from '@tabler/icons-react'
import type { SemanticColor } from '@/theme'
import typography from '@/styles/typography.module.css'
import type { DashboardUserMetrics } from './dashboard-metrics'

interface AdminKpiGridProps {
  metrics: DashboardUserMetrics
}

interface KpiItem {
  id: string
  label: string
  value: number
  color: SemanticColor
  icon: typeof IconUsers
  badgeText?: string
  suffix?: string
}

export function AdminKpiGrid({ metrics }: Readonly<AdminKpiGridProps>) {
  const items: KpiItem[] = [
    {
      id: 'total',
      label: 'Tổng người dùng',
      value: metrics.totalUsers,
      color: 'brand',
      icon: IconUsers,
      suffix: 'tài khoản',
    },
    {
      id: 'active',
      label: 'Đang hoạt động',
      value: metrics.activeUsers,
      color: 'success',
      icon: IconUserCheck,
      badgeText: `${metrics.activePercent}%`,
    },
    {
      id: 'locked',
      label: 'Đã bị khóa',
      value: metrics.lockedUsers,
      color: 'danger',
      icon: IconUserOff,
      badgeText: `${metrics.lockedPercent}%`,
    },
    {
      id: 'admin',
      label: 'Quản trị viên',
      value: metrics.adminCount,
      color: 'brand',
      icon: IconShield,
      badgeText: `${metrics.adminPercent}%`,
    },
  ]

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Paper key={item.id} withBorder p="md" radius="md">
            <Stack gap="xs">
              <Group justify="space-between" align="center" wrap="nowrap">
                <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                  {item.label}
                </Text>
                <ThemeIcon
                  color={item.color}
                  variant="light"
                  size="lg"
                  radius="md"
                >
                  <Icon size={18} stroke={1.5} aria-hidden="true" />
                </ThemeIcon>
              </Group>

              <Group align="baseline" gap="xs">
                <Text size="xl" fw={700} className={typography.tabularNums}>
                  <NumberFormatter
                    value={item.value}
                    thousandSeparator="."
                    decimalSeparator=","
                  />
                </Text>

                {item.badgeText ? (
                  <Badge color={item.color} variant="light" size="sm">
                    {item.badgeText}
                  </Badge>
                ) : item.suffix ? (
                  <Text size="xs" c="dimmed">
                    {item.suffix}
                  </Text>
                ) : null}
              </Group>
            </Stack>
          </Paper>
        )
      })}
    </SimpleGrid>
  )
}
