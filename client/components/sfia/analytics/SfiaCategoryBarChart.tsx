'use client'

import { BarChart, type BarChartSeries } from '@mantine/charts'
import { Box } from '@mantine/core'
import type { SfiaCategoryMetric } from '@/types'

export interface SfiaCategoryBarChartProps {
  data: SfiaCategoryMetric[]
  selectedCategory?: string | null
  onSelectCategory?: (categoryCode: string | null) => void
}

const SERIES: BarChartSeries[] = [
  { name: 'questionCount', label: 'Câu hỏi', color: 'brand' },
  { name: 'skillCount', label: 'Kỹ năng', color: 'neutral' },
]

export default function SfiaCategoryBarChart({
  data,
  selectedCategory,
  onSelectCategory,
}: Readonly<SfiaCategoryBarChartProps>) {
  return (
    <Box role="region" aria-label="Biểu đồ phân bổ theo 6 danh mục SFIA">
      <BarChart
        h={220}
        data={data}
        dataKey="code"
        series={SERIES}
        gridAxis="y"
        withTooltip
        withLegend
        minBarSize={4}
        barProps={{
          onClick: (entry: {
            code?: unknown
            payload?: { code?: unknown }
          }) => {
            const rawCode = entry?.payload?.code ?? entry?.code
            const code = typeof rawCode === 'string' ? rawCode : null
            if (code) {
              onSelectCategory?.(selectedCategory === code ? null : code)
            }
          },
        }}
        aria-label="Biểu đồ cột số câu hỏi và số kỹ năng theo 6 danh mục SFIA"
      />
    </Box>
  )
}
