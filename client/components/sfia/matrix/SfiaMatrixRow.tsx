'use client'

import { memo } from 'react'
import {
  Badge,
  Box,
  Group,
  Stack,
  Table,
  Text,
  VisuallyHidden,
} from '@mantine/core'
import type {
  SfiaLevelResponsibility,
  SfiaMatrixCellData,
  SfiaMatrixDisplayMode,
  SfiaSkillSummary,
} from '@/types'
import { getSfiaCategorySemanticTheme } from '@/components/sfia/sfia-theme'
import { SfiaMatrixCell } from './SfiaMatrixCell'
import classes from './SfiaMatrixView.module.css'

const SFIA_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const

export interface SfiaMatrixRowProps {
  skill: SfiaSkillSummary
  cells: Record<string, SfiaMatrixCellData>
  displayMode: SfiaMatrixDisplayMode
  levels?: SfiaLevelResponsibility[]
  inspectedCell?: { skillCode: string; levelId: number } | null
  onSelectCell: (skillCode: string, levelId: number) => void
}

export const SfiaMatrixRow = memo(function SfiaMatrixRow({
  skill,
  cells,
  displayMode,
  levels,
  inspectedCell,
  onSelectCell,
}: Readonly<SfiaMatrixRowProps>) {
  const categoryTheme = getSfiaCategorySemanticTheme(skill.categoryCode)

  return (
    <Table.Tr data-testid={`matrix-row-${skill.code}`}>
      <Table.Th scope="row" className={classes.stickySkillCol}>
        <Stack gap={2}>
          <Group gap={6} align="center" wrap="nowrap">
            <Badge
              color={categoryTheme.color}
              variant={categoryTheme.badgeVariant}
              size="xs"
              ff="monospace"
            >
              {skill.code}
            </Badge>
            <Text size="xs" ff="monospace" c="dimmed">
              L{skill.minLevel}–L{skill.maxLevel}
            </Text>
          </Group>
          <Text size="xs" fw={500} truncate title={skill.name}>
            {skill.name}
          </Text>
        </Stack>
      </Table.Th>

      {SFIA_LEVELS.map((lvl) => {
        if (lvl < skill.minLevel || lvl > skill.maxLevel) {
          return (
            <Table.Td key={lvl} className={classes.cellTd}>
              <Box
                data-testid={`cell-${skill.code}-L${lvl}-inactive`}
                className={classes.inactiveCell}
              >
                <Text component="span" size="xs" aria-hidden="true">
                  —
                </Text>
                <VisuallyHidden>Không áp dụng tại Cấp độ {lvl}</VisuallyHidden>
              </Box>
            </Table.Td>
          )
        }

        const cell = cells[`${skill.code}_L${lvl}`]
        const levelMeta = levels?.find((l) => l.levelId === lvl)
        const isInspected =
          inspectedCell?.skillCode === skill.code &&
          inspectedCell?.levelId === lvl

        return (
          <Table.Td key={lvl} className={classes.cellTd}>
            <SfiaMatrixCell
              skill={skill}
              levelId={lvl}
              cell={cell}
              displayMode={displayMode}
              levelMeta={levelMeta}
              isInspected={isInspected}
              onSelectCell={onSelectCell}
            />
          </Table.Td>
        )
      })}
    </Table.Tr>
  )
})
