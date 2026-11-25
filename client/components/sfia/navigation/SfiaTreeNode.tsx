'use client'

import { Badge, Box, Group, Text, Tooltip, UnstyledButton } from '@mantine/core'
import type { RenderTreeNodePayload } from '@mantine/core'
import { IconChevronRight, IconFolderRoot } from '@tabler/icons-react'
import interactions from '@/styles/interactions.module.css'
import layout from '@/styles/layout.module.css'
import type { SfiaSkillSummary } from '@/types'
import sfia from '../sfia.module.css'
import { getSfiaCategorySemanticTheme } from '../sfia-theme'

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
        gap="xs"
        className={[
          payload.elementProps.className,
          interactions.hoverRow,
          sfia.treeCategoryNode,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Group gap={6} wrap="nowrap" miw={0}>
          <IconChevronRight
            size={15}
            stroke={1.5}
            className={sfia.treeChevron}
            data-expanded={payload.expanded}
          />
          <CategoryIcon size={16} stroke={1.5} className={layout.shrink0} />
          <Text size="sm" fw={700} truncate>
            {payload.node.label}
          </Text>
        </Group>
        <Badge
          size="sm"
          variant="light"
          color={theme.color}
          className={layout.shrink0}
        >
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
        gap="xs"
        className={[
          payload.elementProps.className,
          interactions.hoverRow,
          sfia.treeSubcategoryNode,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Group gap={6} wrap="nowrap" miw={0}>
          <IconChevronRight
            size={14}
            stroke={1.5}
            className={sfia.treeChevron}
            data-expanded={payload.expanded}
          />
          <IconFolderRoot size={15} stroke={1.5} className={layout.shrink0} />
          <Text size="sm" fw={600} truncate>
            {payload.node.label}
          </Text>
        </Group>
        <Badge
          size="xs"
          variant="outline"
          color="neutral"
          className={layout.shrink0}
        >
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
      className={[payload.elementProps.className, sfia.treeSkillWrapper]
        .filter(Boolean)
        .join(' ')}
    >
      <Tooltip
        label={`${skill.code} — ${skill.name}`}
        position="right"
        openDelay={400}
        withArrow
      >
        <UnstyledButton
          id={`sfia-tree-skill-${skill.code}`}
          aria-label={`${skill.code} ${skill.name}`}
          className={interactions.selectableItem}
          mod={{ selected: isSelected }}
          onClick={() => onSelectSkill(skill.code, effectiveLevel)}
        >
          <Badge
            size="sm"
            variant="light"
            color={theme.color}
            ff="monospace"
            className={sfia.treeSkillCodeBadge}
          >
            {skill.code}
          </Badge>
          <Text
            size="sm"
            fw={isSelected ? 600 : 400}
            c={isSelected ? 'brand' : undefined}
            truncate
            miw={0}
            flex={1}
          >
            {skill.name}
          </Text>
        </UnstyledButton>
      </Tooltip>
    </Box>
  )
}
