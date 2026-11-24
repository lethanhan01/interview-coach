'use client'

import {
  ActionIcon,
  Badge,
  Group,
  HoverCard,
  Progress,
  Stack,
  Table,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconInfoCircle, IconPencil, IconTrash } from '@tabler/icons-react'
import type { OnetSfiaMapping, SfiaSkillDefinition } from '@/types'
import { OnetSfiaRowEditor } from './OnetSfiaRowEditor'
import classes from './OnetSfiaRow.module.css'

export interface OnetSfiaRowProps {
  mapping: OnetSfiaMapping
  isEditing: boolean
  isSaving: boolean
  availableSkills?: SfiaSkillDefinition[]
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: (data: Partial<OnetSfiaMapping>) => Promise<void>
  onDelete: () => void
  onDirtyChange?: (isDirty: boolean) => void
  isHighlighted?: boolean
}

const SOURCE_LABELS: Record<
  OnetSfiaMapping['source'],
  { label: string; color: 'brand' | 'neutral' | 'success'; variant: 'outline' | 'light' }
> = {
  ONET_CROSSWALK: { label: 'O*NET Crosswalk', color: 'neutral', variant: 'outline' },
  EXPERT_CURATED: { label: 'Chuyên gia', color: 'brand', variant: 'light' },
  USER_DEFINED: { label: 'Tự định nghĩa', color: 'success', variant: 'light' },
}

export function OnetSfiaRow({
  mapping,
  isEditing,
  isSaving,
  availableSkills = [],
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onDirtyChange,
  isHighlighted = false,
}: Readonly<OnetSfiaRowProps>) {
  const skillDef = availableSkills.find((s) => s.code === mapping.skillCode)
  const minLevel = skillDef?.minLevel ?? mapping.minLevel
  const maxLevel = skillDef?.maxLevel ?? mapping.maxLevel

  const levelDescription =
    skillDef?.levelDescriptions?.[mapping.targetLevel] ??
    `Cấp độ ${mapping.targetLevel} theo tiêu chuẩn năng lực SFIA 9.`

  const sourceMeta = SOURCE_LABELS[mapping.source] ?? {
    label: mapping.source,
    color: 'neutral',
    variant: 'outline',
  }

  if (isEditing) {
    return (
      <OnetSfiaRowEditor
        mapping={mapping}
        minLevel={minLevel}
        maxLevel={maxLevel}
        isSaving={isSaving}
        onSave={onSave}
        onCancel={onCancelEdit}
        onDirtyChange={onDirtyChange}
      />
    )
  }

  return (
    <Table.Tr
      id={`sfia-row-${mapping.skillCode}`}
      className={isHighlighted ? classes.highlighted : undefined}
    >
      {/* Col 1: Skill Code & Name */}
      <Table.Td>
        <Group gap={6} align="center" wrap="nowrap">
          <Badge color="brand" variant="light" size="xs">
            {mapping.skillCode}
          </Badge>
          <Text size="xs" fw={600}>
            {mapping.skillName}
          </Text>
        </Group>
      </Table.Td>

      {/* Col 2: Category */}
      <Table.Td>
        <Text size="xs" c="dimmed">
          {mapping.category}
        </Text>
      </Table.Td>

      {/* Col 3: Target Level with HoverCard */}
      <Table.Td>
        <HoverCard width={280} shadow="md" withArrow openDelay={200} withinPortal>
          <HoverCard.Target>
            <Group gap={4} align="center" wrap="nowrap" className={classes.interactiveTarget}>
              <Badge color="brand" size="xs">
                L{mapping.targetLevel}
              </Badge>
              <IconInfoCircle size={12} stroke={1.5} />
            </Group>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            <Stack gap={4}>
              <Text size="xs" fw={700}>
                {mapping.skillCode} — Cấp độ {mapping.targetLevel}
              </Text>
              <Text size="xs" c="dimmed">
                {levelDescription}
              </Text>
            </Stack>
          </HoverCard.Dropdown>
        </HoverCard>
      </Table.Td>

      {/* Col 4: Weight */}
      <Table.Td className={classes.weightCell}>
        <Group gap="xs" align="center" wrap="nowrap">
          <Progress
            value={Math.min(100, (mapping.weight / 5) * 100)}
            color="brand"
            size="sm"
            radius="xl"
            flex={1}
            aria-label={`Trọng số ${mapping.weight}/5.0`}
          />
          <Text size="xs" fw={600} w={28}>
            {mapping.weight.toFixed(1)}
          </Text>
        </Group>
      </Table.Td>

      {/* Col 5: Role (Core vs Secondary) */}
      <Table.Td>
        {mapping.isCore ? (
          <Badge color="brand" variant="light" size="xs">
            Cốt lõi
          </Badge>
        ) : (
          <Badge color="neutral" variant="outline" size="xs">
            Bổ trợ
          </Badge>
        )}
      </Table.Td>

      {/* Col 6: Source */}
      <Table.Td>
        <Badge color={sourceMeta.color} variant={sourceMeta.variant} size="xs">
          {sourceMeta.label}
        </Badge>
      </Table.Td>

      {/* Col 7: Actions */}
      <Table.Td className={classes.actionsCell}>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label="Chỉnh sửa ánh xạ" withArrow>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="brand"
              onClick={onStartEdit}
              aria-label="Chỉnh sửa ánh xạ này"
            >
              <IconPencil size={14} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Xóa ánh xạ" withArrow>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="danger"
              onClick={onDelete}
              aria-label="Xóa ánh xạ này"
            >
              <IconTrash size={14} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}
