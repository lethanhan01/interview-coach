'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Badge,
  Group,
  NumberFormatter,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import surfaces from '@/styles/surfaces.module.css'
import typography from '@/styles/typography.module.css'
import type { AdminUser } from '@/types'
import {
  buildRegistrationSeries,
  type RegistrationRange,
} from './dashboard-metrics'

const UserRegistrationAreaChart = dynamic(
  () => import('./UserRegistrationAreaChart'),
  {
    ssr: false,
    loading: () => <Skeleton height={220} radius="md" />,
  }
)

interface UserRegistrationChartProps {
  users: AdminUser[]
}

export function UserRegistrationChart({
  users,
}: Readonly<UserRegistrationChartProps>) {
  const [range, setRange] = useState<RegistrationRange>('monthly')

  const series = useMemo(
    () => buildRegistrationSeries(users, range),
    [users, range]
  )

  return (
    <Paper withBorder p="lg" radius="md" h="100%">
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
          <Stack gap={2}>
            <Title order={2} size="h4">
              Xu hướng đăng ký tài khoản
            </Title>
            <Text size="xs" c="dimmed">
              Thống kê số tài khoản tạo mới theo thời gian
            </Text>
          </Stack>

          <SegmentedControl
            size="xs"
            value={range}
            onChange={(value) => setRange(value as RegistrationRange)}
            aria-label="Chọn khoảng thời gian thống kê đăng ký"
            data={[
              { value: 'monthly', label: 'Theo tháng' },
              { value: 'last30d', label: '30 ngày' },
            ]}
          />
        </Group>

        {users.length === 0 || series.length === 0 ? (
          <Paper
            p="lg"
            radius="md"
            className={surfaces.subtleSurface}
            mih={180}
          >
            <Stack align="center" justify="center" gap="xs" mih={140}>
              <Text size="sm" fw={500}>
                Chưa có dữ liệu đăng ký trong khoảng thời gian này
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                Biểu đồ sẽ hiển thị tự động khi có tài khoản mới được tạo.
              </Text>
            </Stack>
          </Paper>
        ) : series.length === 1 ? (
          <Paper
            p="lg"
            radius="md"
            className={surfaces.subtleSurface}
            mih={180}
          >
            <Stack align="center" justify="center" gap="xs" mih={140}>
              <Badge color="brand" variant="light" size="md">
                Mốc {series[0].label}
              </Badge>
              <Text size="xl" fw={700} className={typography.tabularNums}>
                <NumberFormatter
                  value={series[0].count}
                  thousandSeparator="."
                  decimalSeparator=","
                />{' '}
                tài khoản mới
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                Cần tối thiểu 2 mốc thời gian để hiển thị đường xu hướng tăng
                trưởng.
              </Text>
            </Stack>
          </Paper>
        ) : (
          <UserRegistrationAreaChart data={series} />
        )}
      </Stack>
    </Paper>
  )
}
