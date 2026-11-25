import { Box, Group, Stack, Text } from '@mantine/core'
import surfaces from '@/styles/surfaces.module.css'
import typography from '@/styles/typography.module.css'
import type { CatalogSfiaLevelOption } from '@/types'
import report from '../report.module.css'

export interface SfiaSegmentMeterProps {
  demonstratedLevel: number
  targetLevel: number
  skillName: string
  sfiaLevels?: readonly CatalogSfiaLevelOption[]
}

const SEGMENTS = [1, 2, 3, 4, 5, 6, 7]

export function SfiaSegmentMeter({
  demonstratedLevel,
  targetLevel,
  skillName,
  sfiaLevels,
}: Readonly<SfiaSegmentMeterProps>) {
  const safeDemonstratedLevel = Math.max(0, Math.min(7, demonstratedLevel ?? 0))
  const isPassed = safeDemonstratedLevel >= targetLevel && targetLevel > 0

  return (
    <Stack gap={6}>
      <Box
        component="meter"
        min={0}
        max={7}
        value={safeDemonstratedLevel}
        aria-valuenow={safeDemonstratedLevel}
        aria-valuemin={0}
        aria-valuemax={7}
        aria-label={`Thang đo SFIA 7 cấp độ cho ${skillName}`}
        className={typography.srOnly}
      >
        {safeDemonstratedLevel} / 7
      </Box>

      <Group gap={4} wrap="nowrap">
        {SEGMENTS.map((level) => {
          const isFilled =
            level <= safeDemonstratedLevel && safeDemonstratedLevel > 0
          const isTarget = level === targetLevel
          const isBetweenDemonstratedAndTarget =
            level > safeDemonstratedLevel && level <= targetLevel

          let state: 'passed' | 'warning' | 'gap' | 'empty' = 'empty'
          if (isFilled) {
            state = isPassed ? 'passed' : 'warning'
          } else if (isBetweenDemonstratedAndTarget) {
            state = 'gap'
          }

          const levelMeta = sfiaLevels?.find((item) => item.levelId === level)
          const levelLabel = levelMeta?.nameVi || levelMeta?.name || `L${level}`
          const title = `Level ${level}: ${levelLabel}${
            isTarget ? ' (Mục tiêu)' : ''
          }${level === safeDemonstratedLevel ? ' (Thể hiện)' : ''}`

          return (
            <Box
              key={level}
              title={title}
              className={`${surfaces.subtleSurface} ${report.meterSegment}`}
              mod={{ state, target: isTarget }}
            >
              {level}
            </Box>
          )
        })}
      </Group>

      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed">
          L1: Cơ bản
        </Text>
        <Text size="xs" c="dimmed">
          Thang SFIA Level 1-7
        </Text>
        <Text size="xs" c="dimmed">
          L7: Chiến lược
        </Text>
      </Group>
    </Stack>
  )
}

export default SfiaSegmentMeter
