'use client'

import { AreaChart } from '@mantine/charts'
import { Box } from '@mantine/core'
import type { RegistrationPoint } from '@/components/admin/user-metrics'

export interface UserRegistrationAreaChartProps {
  data: RegistrationPoint[]
}

export default function UserRegistrationAreaChart({
  data,
}: Readonly<UserRegistrationAreaChartProps>) {
  return (
    <Box role="region" aria-label="Biểu đồ xu hướng đăng ký tài khoản">
      <AreaChart
        h={220}
        data={data}
        dataKey="label"
        series={[{ name: 'count', label: 'Tài khoản mới', color: 'brand' }]}
        curveType="monotone"
        withGradient
        fillOpacity={0.2}
        gridAxis="y"
        yAxisProps={{ allowDecimals: false }}
        unit=" tài khoản"
        withDots
        withTooltip
      />
    </Box>
  )
}
