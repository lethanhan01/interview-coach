'use client'

import { Badge, Box, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import type { RenderTreeNodePayload } from '@mantine/core'
import { IconChevronRight, IconFolderRoot } from '@tabler/icons-react'
import type { SfiaSkillSummary } from '@/types'
import { getSfiaCategorySemanticTheme } from '../sfia-semantic-theme'
import classes from './SfiaSidebarTree.module.css'

export interface SfiaTreeNodeProps {
  payload: RenderTreeNodePayload
  selectedSkill: string
  selectedLevel: number
  onSelectSkill: (skillCode: string, targetLevel?: number) => void
}

function clampLevel(skill: SfiaSkillSummary, targetLevel: number): number {
  if (targetLevel < skill.minLevel) return skill.minLevel
  if (targetLevel > skill.maxLevel) return skill.maxLevel
  return targetLevel
}

export function SfiaTreeNode({
  payload,
  selectedSkill,
  selectedLevel,
  onSelectSkill,
}: Readonly<SfiaTreeNodeProps>) {
  const nodeProps = (payload.node.nodeProps ?? {}) as {
    type?: 'category' | 'subcategory' | 'skill'
    code?: string
    categoryCode?: string
    subcategoryCode?: string
    skill?: SfiaSkillSummary
    count?: number
  }

  if (nodeProps.type === 'category') {
    const theme = getSfiaCategorySemanticTheme(nodeProps.code)
    const CategoryIcon = theme.icon

    return (
      <Group
        {...payload.elementProps}
        wrap="nowrap"
        justify="space-between"
        className={[payload.elementProps.className, classes.categoryNode]
          .filter(Boolean)
          .join(' ')}
      >
        <Group gap={6} wrap="nowrap" miw={0}>
          <IconChevronRight
            size={14}
            stroke={1.5}
            className={classes.chevron}
            data-expanded={payload.expanded}
          />
          <CategoryIcon size={14} stroke={1.5} />
          <Text size="xs" fw={700} truncate>
            {payload.node.label}
          </Text>
        </Group>
        <Badge size="xs" variant="light" color={theme.color}>
          {nodeProps.count ?? 0}
        </Badge>
      </Group>
    )
  }

  if (nodeProps.type === 'subcategory') {
    return (
      <Group
        {...payload.elementProps}
        wrap="nowrap"
        justify="space-between"
        className={[payload.elementProps.className, classes.subcategoryNode]
          .filter(Boolean)
          .join(' ')}
      >
        <Group gap={6} wrap="nowrap" miw={0}>
          <IconChevronRight
            size={12}
            stroke={1.5}
            className={classes.chevron}
            data-expanded={payload.expanded}
          />
          <IconFolderRoot size={13} stroke={1.5} />
          <Text size="xs" fw={500} truncate>
            {payload.node.label}
          </Text>
        </Group>
        <Badge size="xs" variant="outline" color="neutral">
          {nodeProps.count ?? 0}
        </Badge>
      </Group>
    )
  }

  // Skill leaf node
  const skill = nodeProps.skill
  if (!skill) return null

  const isSelected = selectedSkill === skill.code
  const theme = getSfiaCategorySemanticTheme(skill.categoryCode)
  const effectiveLevel = clampLevel(skill, selectedLevel)

  return (
    <Box
      {...payload.elementProps}
      className={[payload.elementProps.className, classes.skillWrapper]
        .filter(Boolean)
        .join(' ')}
    >
      <UnstyledButton
        id={`sfia-tree-skill-${skill.code}`}
        aria-label={`${skill.code} ${skill.name}`}
        className={classes.skillButton}
        mod={{ selected: isSelected }}
        onClick={() => onSelectSkill(skill.code, effectiveLevel)}
      >
        <Group gap={6} wrap="nowrap" miw={0}>
          <Badge size="xs" variant="light" color={theme.color}>
            {skill.code}
          </Badge>
          <Stack gap={1} miw={0}>
            <Text size="xs" fw={isSelected ? 600 : 400} truncate>
              {skill.name}
            </Text>
          </Stack>
        </Group>

        <Group gap={4} wrap="nowrap">
          {skill.questionCount === 0 ? (
            <Badge size="xs" variant="outline" color="danger">
              0 CH
            </Badge>
          ) : (
            <Badge size="xs" variant="light" color="brand">
              {skill.questionCount} CH
            </Badge>
          )}
          <Text size="xs" c="dimmed" ff="monospace">
            L{skill.minLevel}–{skill.maxLevel}
          </Text>
        </Group>
      </UnstyledButton>
    </Box>
  )
}
