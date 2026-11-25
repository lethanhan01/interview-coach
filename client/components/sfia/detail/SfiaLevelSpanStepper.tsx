'use client'

import {
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { IconSparkles } from '@tabler/icons-react'
import interactions from '@/styles/interactions.module.css'
import type { SfiaLevelResponsibility } from '@/types'
import sfia from '../sfia.module.css'
import { getSfiaCategorySemanticTheme } from '../sfia-theme'

export interface SfiaLevelSpanStepperProps {
  minLevel: number
  maxLevel: number
  selectedLevel: number
  categoryCode: string
  onSelectLevel: (level: number) => void
  levels?: SfiaLevelResponsibility[]
  className?: string
}

const ALL_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const

export function SfiaLevelSpanStepper({
  minLevel,
  maxLevel,
  selectedLevel,
  categoryCode,
  onSelectLevel,
  levels,
  className,
}: Readonly<SfiaLevelSpanStepperProps>) {
  const theme = getSfiaCategorySemanticTheme(categoryCode)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const nextLevel = selectedLevel + 1
      if (nextLevel <= maxLevel) {
        onSelectLevel(nextLevel)
      } else {
        onSelectLevel(minLevel)
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prevLevel = selectedLevel - 1
      if (prevLevel >= minLevel) {
        onSelectLevel(prevLevel)
      } else {
        onSelectLevel(maxLevel)
      }
    } else if (/^[1-7]$/.test(e.key)) {
      const targetLvl = Number.parseInt(e.key, 10)
      if (targetLvl >= minLevel && targetLvl <= maxLevel) {
        e.preventDefault()
        onSelectLevel(targetLvl)
      }
    }
  }

  const getLevelName = (lvl: number): string => {
    const found = levels?.find((l) => l.levelId === lvl)
    return found?.nameVi || found?.name || `Cấp độ ${lvl}`
  }

  return (
    <Paper
      withBorder
      radius="md"
      p="xs"
      className={[interactions.focusRing, className].filter(Boolean).join(' ')}
      component="section"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Thước đo cấp độ trách nhiệm SFIA 9"
    >
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="xs" align="center">
            <IconSparkles size={16} stroke={1.5} />
            <Text size="sm" fw={700}>
              Thước Đo Cấp Độ Trách Nhiệm
            </Text>
          </Group>

          <Badge color={theme.color} variant="light" size="sm">
            Dải áp dụng: Cấp độ {minLevel} ➔ Cấp độ {maxLevel} (
            {maxLevel - minLevel + 1}/7 cấp)
          </Badge>
        </Group>

        <Box className={sfia.stepperContainer} pt={4}>
          <Box className={sfia.stepperRailGrid}>
            {ALL_LEVELS.map((lvl) => {
              const isAvailable = lvl >= minLevel && lvl <= maxLevel
              const isSelected = lvl === selectedLevel
              const levelName = getLevelName(lvl)
              const isLeftInRange = lvl > minLevel && lvl <= maxLevel
              const isRightInRange = lvl >= minLevel && lvl < maxLevel

              return (
                <Box key={lvl} className={sfia.stepperColumn}>
                  <Box className={sfia.stepperNodeRailWrapper}>
                    <Box
                      className={sfia.stepperConnector}
                      data-hidden={lvl === 1}
                      data-in-range={isLeftInRange}
                    />

                    <Tooltip
                      label={
                        isAvailable
                          ? `Cấp độ ${lvl}: ${levelName}`
                          : `Không áp dụng cho Cấp độ ${lvl}`
                      }
                      position="top"
                      withArrow
                    >
                      <UnstyledButton
                        aria-label={`Chọn Cấp độ ${lvl} - ${levelName}`}
                        aria-current={isSelected ? 'step' : undefined}
                        className={sfia.stepperNodeCircle}
                        data-active={isSelected}
                        data-available={isAvailable}
                        disabled={!isAvailable}
                        onClick={() => isAvailable && onSelectLevel(lvl)}
                      >
                        {lvl}
                      </UnstyledButton>
                    </Tooltip>

                    <Box
                      className={sfia.stepperConnector}
                      data-hidden={lvl === 7}
                      data-in-range={isRightInRange}
                    />
                  </Box>

                  <Stack gap={1} align="center" mt={4}>
                    <Text
                      size="xs"
                      fw={isSelected ? 700 : 500}
                      c={
                        isSelected
                          ? theme.color
                          : isAvailable
                            ? undefined
                            : 'dimmed'
                      }
                      ff="monospace"
                    >
                      L{lvl}
                    </Text>
                    <Text
                      size="xs"
                      c={isSelected ? undefined : 'dimmed'}
                      ta="center"
                      truncate
                      maw={{ base: 56, sm: 100 }}
                    >
                      {levelName}
                    </Text>
                  </Stack>
                </Box>
              )
            })}
          </Box>
        </Box>
      </Stack>
    </Paper>
  )
}
