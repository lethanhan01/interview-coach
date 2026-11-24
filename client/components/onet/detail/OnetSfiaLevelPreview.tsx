'use client'

import { Badge, Divider, Group, Paper, Stack, Text } from '@mantine/core'
import surfaces from '@/styles/surfaces.module.css'
import type { SfiaLevelResponsibility, SfiaSkillDefinition } from '@/types'

export interface OnetSfiaLevelPreviewProps {
  skill: SfiaSkillDefinition
  level: number
  levels?: SfiaLevelResponsibility[]
}

export function OnetSfiaLevelPreview({
  skill,
  level,
  levels = [],
}: Readonly<OnetSfiaLevelPreviewProps>) {
  const levelMeta = levels.find((l) => l.levelId === level)
  const levelTitle = levelMeta?.nameVi
    ? `L${level} — ${levelMeta.nameVi}`
    : `L${level}`
  const description =
    skill.levelDescriptions?.[level] || 'Chưa có mô tả hành vi cho cấp độ này.'

  return (
    <Paper p="xs" radius="sm" className={surfaces.subtleSurface}>
      <Stack gap={6}>
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Text size="xs" fw={600}>
            {skill.name} ({skill.code})
          </Text>
          <Badge color="brand" variant="light" size="xs">
            Dải hợp lệ: L{skill.minLevel}–L{skill.maxLevel}
          </Badge>
        </Group>
        {skill.description ? (
          <Text size="xs" c="dimmed">
            {skill.description}
          </Text>
        ) : null}
        <Divider />
        <Stack gap={2}>
          <Text size="xs" c="dimmed" fw={600}>
            Mô tả hành vi cấp độ {levelTitle}:
          </Text>
          <Text size="xs">{description}</Text>
        </Stack>
      </Stack>
    </Paper>
  )
}
