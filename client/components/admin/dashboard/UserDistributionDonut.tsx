'use client'

import { DonutChart, type DonutChartCell } from '@mantine/charts'

export interface UserDistributionDonutProps {
  data: DonutChartCell[]
  chartLabel: string
}

export default function UserDistributionDonut({
  data,
  chartLabel,
}: Readonly<UserDistributionDonutProps>) {
  return (
    <DonutChart
      size={160}
      thickness={22}
      data={data}
      chartLabel={chartLabel}
      tooltipDataSource="segment"
      withTooltip
      aria-label="Biểu đồ phân bổ trạng thái tài khoản"
    />
  )
}
