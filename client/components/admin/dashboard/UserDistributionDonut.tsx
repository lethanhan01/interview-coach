'use client'

import { DonutChart, type DonutChartCell } from '@mantine/charts'
import { Box } from '@mantine/core'

export interface UserDistributionDonutProps {
  data: DonutChartCell[]
  chartLabel: string
}

export default function UserDistributionDonut({
  data,
  chartLabel,
}: Readonly<UserDistributionDonutProps>) {
  return (
    <Box role="region" aria-label="Biểu đồ phân bổ trạng thái tài khoản">
      <DonutChart
        size={160}
        thickness={22}
        paddingAngle={2}
        data={data}
        chartLabel={chartLabel}
        tooltipDataSource="segment"
        withTooltip
      />
    </Box>
  )
}
