'use client'

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { IconExternalLink, IconFlame, IconPlus } from '@tabler/icons-react'
import { getSfiaCategorySemanticTheme } from '@/components/sfia/sfia-theme'
import typography from '@/styles/typography.module.css'
import type { SfiaSkillSummary } from '@/types'
import { getBlindSpotPriority } from './sfia-analytics-export'
import classes from './SfiaAnalytics.module.css'

export interface SfiaBlindSpotsRowProps {
  skill: SfiaSkillSummary
  categoryLabel: string
  onCreateQuestion: (skill: SfiaSkillSummary) => void
  onSelectSkill: (skillCode: string) => void
}

export function SfiaBlindSpotsRow({
  skill,
  categoryLabel,
  onCreateQuestion,
  onSelectSkill,
}: Readonly<SfiaBlindSpotsRowProps>) {
  const categoryTheme = getSfiaCategorySemanticTheme(skill.categoryCode)
  const priority = getBlindSpotPriority(skill.onetCount)
  const isHighDemand = skill.onetCount >= 8

  return (
    <Table.Tr>
      <Table.Td>
        <UnstyledButton
          data-testid={`skill-code-${skill.code}`}
          aria-label={`Mã kỹ năng ${skill.code}`}
          title={`Xem chi tiết ${skill.code} trong Cây kỹ năng`}
          className={classes.skillCodeButton}
          onClick={() => onSelectSkill(skill.code)}
        >
          <Text component="span" size="xs" fw={700} ff="monospace">
            {skill.code}
          </Text>
          <IconExternalLink size={12} stroke={1.5} />
        </UnstyledButton>
      </Table.Td>

      <Table.Td>
        <Stack gap={0} miw={0}>
          <Text size="xs" fw={600} lineClamp={1} title={skill.name}>
            {skill.name}
          </Text>
          <Text size="xs" c="dimmed" ff="monospace">
            {skill.subcategoryCode}
          </Text>
        </Stack>
      </Table.Td>

      <Table.Td>
        <Badge
          size="xs"
          color={categoryTheme.color}
          variant={categoryTheme.badgeVariant}
        >
          {categoryLabel}
        </Badge>
      </Table.Td>

      <Table.Td ta="center">
        <Badge
          size="xs"
          color="neutral"
          variant="outline"
          className={typography.tabularNums}
        >
          L{skill.minLevel} — L{skill.maxLevel}
        </Badge>
      </Table.Td>

      <Table.Td ta="center">
        <Group gap={4} justify="center" wrap="nowrap">
          {isHighDemand ? (
            <Box component="span" c="danger" lh={0}>
              <IconFlame size={14} stroke={1.5} />
            </Box>
          ) : null}
          <Text
            size="xs"
            fw={600}
            c={isHighDemand ? 'danger' : 'brand'}
            className={typography.tabularNums}
          >
            {skill.onetCount} nghề
          </Text>
        </Group>
      </Table.Td>

      <Table.Td>
        <Badge size="xs" color={priority.badgeVariant} variant="light">
          {priority.labelVi}
        </Badge>
      </Table.Td>

      <Table.Td ta="right">
        <Group gap={6} justify="flex-end" wrap="nowrap">
          <Button
            size="compact-xs"
            variant="light"
            color="danger"
            leftSection={<IconPlus size={12} stroke={1.5} />}
            onClick={() => onCreateQuestion(skill)}
          >
            Tạo câu hỏi
          </Button>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="neutral"
            aria-label={`Xem chi tiết ${skill.code}`}
            title={`Xem chi tiết kỹ năng ${skill.code}`}
            onClick={() => onSelectSkill(skill.code)}
          >
            <IconExternalLink size={14} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}
