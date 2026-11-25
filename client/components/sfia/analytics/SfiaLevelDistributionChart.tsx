'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Badge,
  Button,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { IconAdjustments, IconInfoCircle, IconX } from '@tabler/icons-react'
import { getSfiaLevelSemanticTheme } from '@/components/sfia/sfia-theme'
import surfaces from '@/styles/surfaces.module.css'
import typography from '@/styles/typography.module.css'
import type { SfiaLevelMetric, SfiaLevelResponsibility } from '@/types'
import sfia from '../sfia.module.css'
import type { SfiaLevelChartMode } from './SfiaLevelBarChart'

const SfiaLevelBarChart = dynamic(() => import('./SfiaLevelBarChart'), {
  ssr: false,
  loading: () => <Skeleton height={220} radius="md" />,
})

export interface SfiaLevelDistributionChartProps {
  levelDistribution: SfiaLevelMetric[]
  levels?: SfiaLevelResponsibility[]
  selectedLevel?: number | null
  onSelectLevel?: (level: number | null) => void
}

export function SfiaLevelDistributionChart({
  levelDistribution,
  levels,
  selectedLevel,
  onSelectLevel,
}: Readonly<SfiaLevelDistributionChartProps>) {
  const [chartMode, setChartMode] = useState<SfiaLevelChartMode>('bar')

  const levelNameMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const lvl of levels ?? []) {
      if (lvl.nameVi) {
        map.set(lvl.levelId, lvl.nameVi)
      }
    }
    return map
  }, [levels])

  const hasSelectedLevel = selectedLevel !== null && selectedLevel !== undefined

  return (
    <Paper withBorder p="sm" radius="md" h="100%">
      <Stack justify="space-between" gap="xs" h="100%">
        <Stack gap="xs">
          <Group
            justify="space-between"
            align="flex-start"
            gap="xs"
            wrap="wrap"
          >
            <Group gap="xs" align="flex-start" wrap="nowrap">
              <ThemeIcon size="md" radius="md" variant="light" color="brand">
                <IconAdjustments size={16} stroke={1.5} />
              </ThemeIcon>
              <Stack gap={0}>
                <Title order={3} size="h4">
                  Phân bổ câu hỏi theo 7 Cấp độ SFIA
                </Title>
                <Text size="sm" c="dimmed">
                  Độ phủ câu hỏi trên 7 cấp độ trách nhiệm L1–L7
                </Text>
              </Stack>
            </Group>

            <Group gap="xs" wrap="wrap">
              <SegmentedControl
                size="sm"
                value={chartMode}
                onChange={(val) => setChartMode(val as SfiaLevelChartMode)}
                aria-label="Chế độ biểu đồ cấp độ SFIA"
                data={[
                  { value: 'bar', label: 'Cột' },
                  { value: 'donut', label: 'Tỷ trọng' },
                ]}
              />
              {hasSelectedLevel ? (
                <Button
                  variant="light"
                  color="brand"
                  size="compact-sm"
                  rightSection={<IconX size={13} stroke={1.5} />}
                  onClick={() => onSelectLevel?.(null)}
                >
                  Bỏ lọc Cấp L{selectedLevel}
                </Button>
              ) : null}
            </Group>
          </Group>

          {levelDistribution.length === 0 ? (
            <Paper p="sm" radius="md" className={surfaces.subtleSurface}>
              <Text size="sm" c="dimmed" ta="center">
                Chưa có dữ liệu phân bổ theo cấp độ SFIA.
              </Text>
            </Paper>
          ) : (
            <SfiaLevelBarChart
              data={levelDistribution}
              chartMode={chartMode}
              selectedLevel={selectedLevel}
              onSelectLevel={onSelectLevel}
            />
          )}

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            {levelDistribution.map((lvl) => {
              const theme = getSfiaLevelSemanticTheme(lvl.level)
              const isSelected = selectedLevel === lvl.level
              const displayName = levelNameMap.get(lvl.level) ?? lvl.name

              return (
                <UnstyledButton
                  key={lvl.level}
                  aria-pressed={isSelected}
                  aria-label={`Lọc theo Cấp L${lvl.level}`}
                  className={sfia.analyticsFilterPill}
                  mod={{ active: isSelected || undefined }}
                  onClick={() => onSelectLevel?.(isSelected ? null : lvl.level)}
                >
                  <Group gap="xs" wrap="nowrap" miw={0}>
                    <Badge
                      size="sm"
                      color={theme.color}
                      variant={theme.badgeVariant}
                      className={typography.tabularNums}
                    >
                      L{lvl.level}
                    </Badge>
                    <Text size="sm" fw={600} truncate>
                      {displayName}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed" className={typography.tabularNums}>
                    {lvl.questionCount} CH / {lvl.activeCellCount} ô
                  </Text>
                </UnstyledButton>
              )
            })}
          </SimpleGrid>
        </Stack>

        <Group gap={6} wrap="nowrap" pt="xs" className={surfaces.borderedTop}>
          <IconInfoCircle size={15} stroke={1.5} />
          <Text size="sm" c="dimmed">
            Chọn cấp độ để lọc các kỹ năng có phạm vi tương ứng trong Bảng Điểm
            mù.
          </Text>
        </Group>
      </Stack>
    </Paper>
  )
}
