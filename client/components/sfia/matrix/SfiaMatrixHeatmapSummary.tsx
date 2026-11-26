'use client'

import { useMemo } from 'react'
import {
  Badge,
  Button,
  Group,
  Paper,
  Progress,
  Stack,
  Tooltip,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconChevronsDown,
  IconChevronsUp,
} from '@tabler/icons-react'
import type { SfiaMatrixCellData, SfiaSkillSummary } from '@/types'
import { getSfiaHeatmapSemanticTheme } from '@/components/sfia/sfia-theme'

export interface SfiaMatrixHeatmapSummaryProps {
  skills: SfiaSkillSummary[]
  cells: Record<string, SfiaMatrixCellData>
  blindSpotsOnly: boolean
  onToggleBlindSpotsOnly?: (enabled: boolean) => void
  allCollapsed?: boolean
  onToggleAllCategories?: () => void
  embedded?: boolean
}

const TIER_META = [
  { key: 'rich', color: 'success', title: 'Dồi dào (6+ câu hỏi)' },
  { key: 'good', color: 'brand', title: 'Tốt (3–5 câu hỏi)' },
  { key: 'low', color: 'warning', title: 'Mỏng (1–2 câu hỏi)' },
  { key: 'blind', color: 'danger', title: 'Điểm mù (0 câu hỏi)' },
] as const

export function SfiaMatrixHeatmapSummary({
  skills,
  cells,
  blindSpotsOnly,
  onToggleBlindSpotsOnly,
  allCollapsed = false,
  onToggleAllCategories,
  embedded = false,
}: Readonly<SfiaMatrixHeatmapSummaryProps>) {
  const counts = useMemo(() => {
    const tally = { rich: 0, good: 0, low: 0, blind: 0, total: 0 }
    for (const skill of skills) {
      for (let lvl = skill.minLevel; lvl <= skill.maxLevel; lvl++) {
        const count = cells[`${skill.code}_L${lvl}`]?.questionCount ?? 0
        tally[getSfiaHeatmapSemanticTheme(count).tier] += 1
        tally.total += 1
      }
    }
    return tally
  }, [skills, cells])

  const toPct = (n: number) =>
    counts.total > 0 ? Math.round((n / counts.total) * 1000) / 10 : 0

  const content = (
    <Stack gap={6}>
      <Progress.Root size="xs" radius="xl">
        {TIER_META.map((tier) => {
          const count = counts[tier.key]
          if (count === 0) return null
          const pct = toPct(count)
          const label = `${tier.title}: ${count} ô (${pct}%)`
          return (
            <Tooltip key={tier.key} label={label} withArrow>
              <Progress.Section
                value={pct}
                color={tier.color}
                aria-label={label}
              />
            </Tooltip>
          )
        })}
      </Progress.Root>

      <Group justify="space-between" align="center" wrap="wrap" gap={6}>
        <Group gap={6} align="center" wrap="wrap">
          <Badge color="success" variant="light" size="sm">
            Dồi dào 6+: {counts.rich}
          </Badge>
          <Badge color="brand" variant="light" size="sm">
            Tốt 3–5: {counts.good}
          </Badge>
          <Badge color="warning" variant="light" size="sm">
            Mỏng 1–2: {counts.low}
          </Badge>
          <Button
            variant={blindSpotsOnly ? 'filled' : 'light'}
            color="danger"
            size="compact-xs"
            radius="xl"
            aria-pressed={blindSpotsOnly}
            leftSection={<IconAlertTriangle size={12} stroke={1.5} />}
            disabled={!onToggleBlindSpotsOnly}
            onClick={() => onToggleBlindSpotsOnly?.(!blindSpotsOnly)}
          >
            Điểm mù (0): {counts.blind}
          </Button>
        </Group>

        {onToggleAllCategories && (
          <Button
            variant="subtle"
            color="neutral"
            size="compact-xs"
            leftSection={
              allCollapsed ? (
                <IconChevronsDown size={13} stroke={1.5} />
              ) : (
                <IconChevronsUp size={13} stroke={1.5} />
              )
            }
            onClick={onToggleAllCategories}
          >
            {allCollapsed ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
          </Button>
        )}
      </Group>
    </Stack>
  )

  if (embedded) {
    return content
  }

  return (
    <Paper withBorder px="xs" py={6} radius="md">
      {content}
    </Paper>
  )
}
