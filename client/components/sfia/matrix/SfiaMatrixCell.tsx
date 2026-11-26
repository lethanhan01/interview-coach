'use client'

import { memo } from 'react'
import {
  Badge,
  Box,
  Divider,
  Group,
  HoverCard,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import type {
  SfiaLevelResponsibility,
  SfiaMatrixCellData,
  SfiaMatrixDisplayMode,
  SfiaSkillSummary,
} from '@/types'
import {
  getSfiaCategorySemanticTheme,
  getSfiaHeatmapSemanticTheme,
} from '@/components/sfia/sfia-theme'
import sfia from '../sfia.module.css'

export interface SfiaMatrixCellProps {
  skill: SfiaSkillSummary
  levelId: number
  cell?: SfiaMatrixCellData
  displayMode: SfiaMatrixDisplayMode
  levelMeta?: SfiaLevelResponsibility
  isInspected: boolean
  onSelectCell: (skillCode: string, levelId: number) => void
}

function getCellSubLabel(
  mode: SfiaMatrixDisplayMode,
  questionCount: number,
  onetCount: number
): string {
  if (mode === 'onet') return `${onetCount} nghề`
  return `${questionCount} CH`
}

export const SfiaMatrixCell = memo(function SfiaMatrixCell({
  skill,
  levelId,
  cell,
  displayMode,
  levelMeta,
  isInspected,
  onSelectCell,
}: Readonly<SfiaMatrixCellProps>) {
  const qCount = cell?.questionCount ?? 0
  const onetCount = cell?.onetCount ?? 0
  const isBlind = qCount === 0
  const heat = getSfiaHeatmapSemanticTheme(qCount)
  const categoryTheme = getSfiaCategorySemanticTheme(skill.categoryCode)
  const levelName = levelMeta?.nameVi || levelMeta?.name || `L${levelId}`
  const subLabel = getCellSubLabel(displayMode, qCount, onetCount)

  return (
    <HoverCard
      width={300}
      shadow="md"
      withArrow
      openDelay={200}
      closeDelay={80}
      withinPortal
    >
      <HoverCard.Target>
        <UnstyledButton
          data-testid={`cell-${skill.code}-L${levelId}`}
          className={sfia.matrixHeatCell}
          mod={{ heat: heat.dataHeat, active: isInspected }}
          onClick={() => onSelectCell(skill.code, levelId)}
          aria-label={`${skill.code} Cấp độ ${levelId} (${levelName}), ${qCount} câu hỏi, ${onetCount} nghề O*NET`}
        >
          {isBlind && (
            <Box
              component="span"
              className={sfia.matrixBlindSpotDot}
              aria-hidden="true"
            />
          )}
          <Text component="span" ff="monospace" fz="sm" fw={700} lh={1.1}>
            L{levelId}
          </Text>
          <Text
            component="span"
            fz="xs"
            fw={isBlind ? 700 : 500}
            lh={1.2}
            truncate
            maw="100%"
          >
            {subLabel}
          </Text>
        </UnstyledButton>
      </HoverCard.Target>

      <HoverCard.Dropdown>
        <Stack gap={6}>
          <Group justify="space-between" gap="xs" wrap="nowrap">
            <Badge
              color={categoryTheme.color}
              variant="light"
              size="sm"
              ff="monospace"
            >
              {skill.code}
            </Badge>
            <Badge color={heat.color} variant="light" size="sm">
              L{levelId}
              {levelMeta?.nameVi ? ` — ${levelMeta.nameVi}` : ''}
            </Badge>
          </Group>
          <Text size="sm" fw={600} lh={1.35}>
            {skill.name}
          </Text>
          {cell?.statementSnippet && (
            <Text size="sm" c="dimmed" lineClamp={3} lh={1.45}>
              {cell.statementSnippet}
            </Text>
          )}
          <Divider />
          <Group justify="space-between" gap="xs">
            <Text
              size="sm"
              fw={isBlind ? 700 : 500}
              c={isBlind ? 'danger' : undefined}
            >
              Câu hỏi: {qCount}
            </Text>
            <Text size="sm" c="dimmed">
              Nghề O*NET: {onetCount}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" fs="italic">
            Nhấn để xem chi tiết &amp; tạo câu hỏi
          </Text>
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  )
})
