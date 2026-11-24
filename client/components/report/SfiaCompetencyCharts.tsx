'use client'

import { SimpleGrid } from '@mantine/core'
import { BarChart, RadarChart } from '@mantine/charts'
import type { SkillBreakdownItem } from '@/types'

export interface SfiaCompetencyChartsProps {
  skills: SkillBreakdownItem[]
}

export function SfiaCompetencyCharts({
  skills,
}: Readonly<SfiaCompetencyChartsProps>) {
  if (!skills || skills.length === 0) {
    return null
  }

  const chartData = skills.map((s) => ({
    skill: s.skillCode || s.skillName,
    demonstrated: Math.max(0, Math.min(7, s.demonstratedLevel ?? 0)),
    target: Math.max(0, Math.min(7, s.targetLevel ?? 0)),
  }))

  const series = [
    { name: 'demonstrated', label: 'Cấp độ thể hiện', color: 'brand' },
    { name: 'target', label: 'Cấp độ mục tiêu', color: 'neutral' },
  ]

  const hasMultipleSkills = skills.length >= 3

  return (
    <SimpleGrid cols={{ base: 1, lg: hasMultipleSkills ? 2 : 1 }} spacing="md">
      <BarChart
        h={260}
        data={chartData}
        dataKey="skill"
        series={series}
        withLegend
        legendProps={{ verticalAlign: 'bottom', height: 40 }}
      />
      {hasMultipleSkills && (
        <RadarChart
          h={260}
          data={chartData}
          dataKey="skill"
          series={series}
          withPolarGrid
          withPolarAngleAxis
          withPolarRadiusAxis
          polarRadiusAxisProps={{ domain: [0, 7], tickCount: 8 }}
        />
      )}
    </SimpleGrid>
  )
}

export default SfiaCompetencyCharts
