'use client'

import { AreaChart } from '@mantine/charts'
import type { RegistrationPoint } from './dashboard-metrics'

export interface UserRegistrationAreaChartProps {
  data: RegistrationPoint[]
}

export default function UserRegistrationAreaChart({
  data,
}: Readonly<UserRegistrationAreaChartProps>) {
  return (
    <AreaChart
      h={220}
      data={data}
      dataKey="label"
      series={[{ name: 'count', label: 'Tài khoản mới', color: 'brand' }]}
      curveType="monotone"
      fillOpacity={0.2}
      gridAxis="y"
      withDots
      withTooltip
      aria-label="Biểu đồ xu hướng đăng ký tài khoản"
    />
  )
}
