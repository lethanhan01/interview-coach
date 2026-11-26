'use client'

import {
  BarChart,
  DonutChart,
  type BarChartSeries,
  type DonutChartCell,
} from '@mantine/charts'
import { Box, Group } from '@mantine/core'
import { getSfiaLevelSemanticTheme } from '@/components/sfia/sfia-theme'
import type { SfiaLevelMetric } from '@/types'

export type SfiaLevelChartMode = 'bar' | 'donut'

export interface SfiaLevelBarChartProps {
  data: SfiaLevelMetric[]
  chartMode: SfiaLevelChartMode
  selectedLevel?: number | null
  onSelectLevel?: (level: number | null) => void
}

const BAR_SERIES: BarChartSeries[] = [
  { name: 'questionCount', label: 'Câu hỏi', color: 'brand' },
  { name: 'activeCellCount', label: 'Ô khả dụng', color: 'neutral' },
]

export default function SfiaLevelBarChart({
  data,
  chartMode,
  selectedLevel,
  onSelectLevel,
}: Readonly<SfiaLevelBarChartProps>) {
  if (chartMode === 'donut') {
    const donutData: DonutChartCell[] = data.map((lvl) => ({
      name: `L${lvl.level}`,
      value: lvl.questionCount,
      color: getSfiaLevelSemanticTheme(lvl.level).color,
    }))

    return (
      <Group
        justify="center"
        py="xs"
        role="region"
        aria-label="Biểu đồ tỷ trọng câu hỏi theo 7 cấp độ SFIA"
      >
        <DonutChart
          size={196}
          thickness={26}
          paddingAngle={2}
          data={donutData}
          withLabelsLine
          withLabels
          withTooltip
          tooltipDataSource="segment"
        />
      </Group>
    )
  }

  return (
    <Box role="region" aria-label="Biểu đồ cột phân bổ theo 7 cấp độ SFIA">
      <BarChart
        h={220}
        data={data}
        dataKey="shortName"
        series={BAR_SERIES}
        gridAxis="y"
        withTooltip
        withLegend
        minBarSize={4}
        barProps={{
          onClick: (entry: {
            level?: unknown
            payload?: { level?: unknown }
          }) => {
            const rawLevel = entry?.payload?.level ?? entry?.level
            const level = typeof rawLevel === 'number' ? rawLevel : null
            if (level !== null) {
              onSelectLevel?.(selectedLevel === level ? null : level)
            }
          },
        }}
        aria-label="Biểu đồ cột câu hỏi và ô khả dụng theo 7 cấp độ SFIA"
      />
    </Box>
  )
}
