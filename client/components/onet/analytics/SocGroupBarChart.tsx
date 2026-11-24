'use client'

import { BarChart, type BarChartSeries } from '@mantine/charts'

export type SocChartMetricMode = 'occupations' | 'coverage' | 'mappedSplit'

export interface SocChartDatum {
  code: string
  name: string
  totalOccupations: number
  mappedOccupations: number
  unmappedOccupations: number
  mappingCoveragePercent: number
}

export interface SocGroupBarChartProps {
  data: SocChartDatum[]
  metricMode: SocChartMetricMode
  selectedGroup: string | null
  onSelectGroup: (groupCode: string | null) => void
}

export default function SocGroupBarChart({
  data,
  metricMode,
  selectedGroup,
  onSelectGroup,
}: Readonly<SocGroupBarChartProps>) {
  const series: BarChartSeries[] =
    metricMode === 'coverage'
      ? [
          {
            name: 'mappingCoveragePercent',
            label: 'Tỷ lệ ánh xạ (%)',
            color: 'success',
          },
        ]
      : metricMode === 'mappedSplit'
        ? [
            { name: 'mappedOccupations', label: 'Đã ánh xạ', color: 'brand' },
            {
              name: 'unmappedOccupations',
              label: 'Chưa ánh xạ',
              color: 'neutral',
            },
          ]
        : [{ name: 'totalOccupations', label: 'Tổng số nghề', color: 'brand' }]

  return (
    <BarChart
      h={220}
      data={data}
      dataKey="code"
      type={metricMode === 'mappedSplit' ? 'stacked' : 'default'}
      series={series}
      unit={metricMode === 'coverage' ? '%' : undefined}
      gridAxis="y"
      withTooltip
      barProps={{
        onClick: (entry: { code?: unknown; payload?: { code?: unknown } }) => {
          const rawCode = entry?.payload?.code ?? entry?.code
          const code = typeof rawCode === 'string' ? rawCode : null
          if (code) {
            onSelectGroup(selectedGroup === code ? null : code)
          }
        },
      }}
      minBarSize={4}
      aria-label="Biểu đồ phân bổ 23 nhóm ngành SOC"
    />
  )
}
