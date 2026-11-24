'use client'

import { useMemo } from 'react'
import {
  Badge,
  Box,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import {
  IconScale,
  IconSparkles,
  IconStar,
  IconTrendingUp,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { sfiaAdminQueries } from '@/queries/sfia.queries'
import surfaces from '@/styles/surfaces.module.css'
import type { OnetSfiaMapping, SfiaLevelDto } from '@/types'
import classes from './OnetSfiaSpectrumBar.module.css'

export interface OnetSfiaSpectrumBarProps {
  mappings: OnetSfiaMapping[]
  levels?: SfiaLevelDto[]
  onSelectSkill?: (skillCode: string) => void
}

const LEVEL_SEMANTICS: Record<
  number,
  {
    color: 'neutral' | 'brand' | 'warning' | 'danger'
    variant: 'outline' | 'light' | 'filled'
    label: string
  }
> = {
  1: { color: 'neutral', variant: 'outline', label: 'L1 Thực thi' },
  2: { color: 'neutral', variant: 'light', label: 'L2 Hỗ trợ' },
  3: { color: 'brand', variant: 'light', label: 'L3 Áp dụng' },
  4: { color: 'brand', variant: 'filled', label: 'L4 Tự chủ' },
  5: { color: 'warning', variant: 'light', label: 'L5 Đảm bảo' },
  6: { color: 'warning', variant: 'filled', label: 'L6 Định hướng' },
  7: { color: 'danger', variant: 'filled', label: 'L7 Chiến lược' },
}

export function OnetSfiaSpectrumBar({
  mappings,
  levels: propLevels,
  onSelectSkill,
}: Readonly<OnetSfiaSpectrumBarProps>) {
  const levelsQuery = useQuery({
    ...sfiaAdminQueries.levels(),
    enabled: !propLevels,
  })
  const levels = propLevels ?? levelsQuery.data ?? []

  const totalCount = mappings.length
  const coreCount = useMemo(
    () => mappings.filter((m) => m.isCore).length,
    [mappings]
  )
  const corePercentage =
    totalCount > 0 ? Math.round((coreCount / totalCount) * 100) : 0

  const avgLevel = useMemo(() => {
    if (totalCount === 0) return 0
    const sum = mappings.reduce((acc, m) => acc + m.targetLevel, 0)
    return Math.round((sum / totalCount) * 10) / 10
  }, [mappings, totalCount])

  const totalWeight = useMemo(() => {
    const sum = mappings.reduce((acc, m) => acc + m.weight, 0)
    return Math.round(sum * 10) / 10
  }, [mappings])

  const skillsByLevel = useMemo(() => {
    const map: Record<number, OnetSfiaMapping[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
    }
    for (const m of mappings) {
      if (map[m.targetLevel]) {
        map[m.targetLevel].push(m)
      }
    }
    return map
  }, [mappings])

  const handleSkillClick = (skillCode: string) => {
    onSelectSkill?.(skillCode)
    const el = document.getElementById(`sfia-row-${skillCode}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <Stack gap="xs" className={classes.root}>
      {/* 4 KPI Metrics */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
        <Paper p="xs" radius="sm" className={surfaces.subtleSurface}>
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Tổng kỹ năng SFIA
              </Text>
              <Text size="lg" fw={700}>
                {totalCount}
              </Text>
            </Stack>
            <ThemeIcon size="sm" variant="light" color="brand">
              <IconSparkles size={14} stroke={1.5} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="xs" radius="sm" className={surfaces.subtleSurface}>
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Tỷ lệ Cốt lõi
              </Text>
              <Text size="lg" fw={700}>
                {corePercentage}%
              </Text>
            </Stack>
            <ThemeIcon size="sm" variant="light" color="warning">
              <IconStar size={14} stroke={1.5} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="xs" radius="sm" className={surfaces.subtleSurface}>
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Cấp độ Trung bình
              </Text>
              <Text size="lg" fw={700}>
                L{avgLevel || '—'}
              </Text>
            </Stack>
            <ThemeIcon size="sm" variant="light" color="brand">
              <IconTrendingUp size={14} stroke={1.5} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="xs" radius="sm" className={surfaces.subtleSurface}>
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Tổng Trọng số
              </Text>
              <Text size="lg" fw={700}>
                {totalWeight}
              </Text>
            </Stack>
            <ThemeIcon size="sm" variant="light" color="success">
              <IconScale size={14} stroke={1.5} />
            </ThemeIcon>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* 7 Columns SFIA Spectrum */}
      <SimpleGrid cols={{ base: 2, sm: 4, md: 7 }} spacing="xs">
        {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
          const levelMeta = levels.find((l) => l.levelId === lvl)
          const semantic = LEVEL_SEMANTICS[lvl]
          const list = skillsByLevel[lvl] ?? []

          return (
            <Box key={lvl} className={classes.levelCol}>
              <Stack gap={2}>
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Badge
                    color={semantic.color}
                    variant={semantic.variant}
                    size="xs"
                  >
                    L{lvl}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    ({list.length})
                  </Text>
                </Group>
                <Text size="xs" fw={600} truncate title={levelMeta?.name}>
                  {levelMeta?.nameVi ?? levelMeta?.name ?? semantic.label}
                </Text>
              </Stack>

              <Stack gap={4} flex={1}>
                {list.length === 0 ? (
                  <Text size="xs" c="dimmed" ta="center" pt="md">
                    —
                  </Text>
                ) : (
                  list.map((m) => (
                    <UnstyledButton
                      key={m.id}
                      onClick={() => handleSkillClick(m.skillCode)}
                      className={classes.skillPill}
                      aria-label={`Đi tới kỹ năng ${m.skillCode}`}
                    >
                      <Tooltip
                        label={`${m.skillCode}: ${m.skillName} (Trọng số ${m.weight})`}
                        withArrow
                      >
                        <Badge
                          fullWidth
                          size="xs"
                          variant={m.isCore ? 'filled' : 'light'}
                          color={m.isCore ? 'brand' : 'neutral'}
                        >
                          {m.skillCode}
                        </Badge>
                      </Tooltip>
                    </UnstyledButton>
                  ))
                )}
              </Stack>
            </Box>
          )
        })}
      </SimpleGrid>
    </Stack>
  )
}
