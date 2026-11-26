'use client'

import { BarChart } from '@mantine/charts'

export interface SfiaCoverageDatum {
  code: string
  name: string
  coreCount: number
  secondaryCount: number
}

export interface SfiaCoverageBarChartProps {
  data: SfiaCoverageDatum[]
}

export default function SfiaCoverageBarChart({
  data,
}: Readonly<SfiaCoverageBarChartProps>) {
  const height = Math.max(170, data.length * 30 + 24)

  return (
    <BarChart
      h={height}
      data={data}
      dataKey="code"
      orientation="vertical"
      type="stacked"
      series={[
        { name: 'coreCount', label: 'Cốt lõi (Core)', color: 'brand' },
        { name: 'secondaryCount', label: 'Bổ trợ', color: 'neutral' },
      ]}
      gridAxis="x"
      withTooltip
      minBarSize={4}
      aria-label="Biểu đồ độ phủ kỹ năng SFIA 9 theo nhóm cốt lõi và bổ trợ"
    />
  )
}
