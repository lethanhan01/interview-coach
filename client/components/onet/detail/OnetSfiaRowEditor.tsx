'use client'

import { useEffect, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Group,
  NumberInput,
  Select,
  Switch,
  Table,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import type { OnetSfiaMapping, SfiaLevelResponsibility } from '@/types'
import classes from './OnetSfiaRow.module.css'

export interface OnetSfiaRowEditorProps {
  mapping: OnetSfiaMapping
  minLevel: number
  maxLevel: number
  levels?: SfiaLevelResponsibility[]
  isSaving: boolean
  onSave: (payload: Partial<OnetSfiaMapping>) => Promise<void>
  onCancel: () => void
  onDirtyChange?: (isDirty: boolean) => void
}

const SOURCE_LABELS: Record<
  OnetSfiaMapping['source'],
  {
    label: string
    color: 'brand' | 'neutral' | 'success'
    variant: 'outline' | 'light'
  }
> = {
  ONET_CROSSWALK: {
    label: 'O*NET Crosswalk',
    color: 'neutral',
    variant: 'outline',
  },
  EXPERT_CURATED: { label: 'Chuyên gia', color: 'brand', variant: 'light' },
  USER_DEFINED: {
    label: 'Tự định nghĩa',
    color: 'success',
    variant: 'light',
  },
}

export function OnetSfiaRowEditor({
  mapping,
  minLevel,
  maxLevel,
  levels = [],
  isSaving,
  onSave,
  onCancel,
  onDirtyChange,
}: Readonly<OnetSfiaRowEditorProps>) {
  const [draftLevel, setDraftLevel] = useState<string>(
    String(mapping.targetLevel)
  )
  const [draftWeight, setDraftWeight] = useState<string | number>(
    mapping.weight
  )
  const [draftIsCore, setDraftIsCore] = useState<boolean>(mapping.isCore)

  const parsedWeight =
    typeof draftWeight === 'number' ? draftWeight : Number(draftWeight)
  const isWeightValid =
    draftWeight !== '' &&
    !Number.isNaN(parsedWeight) &&
    parsedWeight >= 0.1 &&
    parsedWeight <= 5.0

  const isDirty =
    Number(draftLevel) !== mapping.targetLevel ||
    (isWeightValid ? parsedWeight !== mapping.weight : true) ||
    draftIsCore !== mapping.isCore

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const levelOptions = Array.from(
    { length: maxLevel - minLevel + 1 },
    (_, i) => {
      const lvl = minLevel + i
      const levelMeta = levels.find((l) => l.levelId === lvl)
      return {
        value: String(lvl),
        label: levelMeta?.nameVi ? `L${lvl} — ${levelMeta.nameVi}` : `L${lvl}`,
      }
    }
  )

  const sourceMeta = SOURCE_LABELS[mapping.source] ?? {
    label: mapping.source,
    color: 'neutral',
    variant: 'outline',
  }

  const handleSave = async () => {
    if (!isWeightValid || isSaving) return
    try {
      await onSave({
        targetLevel: Number(draftLevel),
        weight: parsedWeight,
        isCore: draftIsCore,
      })
    } catch {
      // Error feedback is handled by mutation toast in parent
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.defaultPrevented) return

    const active = document.activeElement
    const isComboboxExpanded =
      active?.getAttribute('role') === 'combobox' &&
      active?.getAttribute('aria-expanded') === 'true'

    if (isComboboxExpanded) return

    if (e.key === 'Enter') {
      e.preventDefault()
      void handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <Table.Tr onKeyDown={handleKeyDown}>
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

      {/* Col 3: Single Target Level Select */}
      <Table.Td>
        <Select
          size="xs"
          w={150}
          comboboxProps={{ withinPortal: true }}
          allowDeselect={false}
          value={draftLevel}
          onChange={(val) => {
            if (val) setDraftLevel(val)
          }}
          data={levelOptions}
          aria-label="Chỉnh sửa cấp độ mục tiêu SFIA"
        />
      </Table.Td>

      {/* Col 4: Weight */}
      <Table.Td className={classes.weightCell}>
        <NumberInput
          size="xs"
          w={90}
          min={0.1}
          max={5.0}
          step={0.1}
          decimalScale={1}
          fixedDecimalScale
          clampBehavior="none"
          value={draftWeight}
          onChange={setDraftWeight}
          error={!isWeightValid}
          aria-label="Chỉnh sửa trọng số đánh giá"
        />
      </Table.Td>

      {/* Col 5: Core Switch */}
      <Table.Td>
        <Switch
          size="xs"
          checked={draftIsCore}
          onChange={(e) => setDraftIsCore(e.currentTarget.checked)}
          aria-label="Chỉnh sửa vai trò cốt lõi"
        />
      </Table.Td>

      {/* Col 6: Source */}
      <Table.Td>
        <Badge color={sourceMeta.color} variant={sourceMeta.variant} size="xs">
          {sourceMeta.label}
        </Badge>
      </Table.Td>

      {/* Col 7: Save / Cancel Actions */}
      <Table.Td className={classes.actionsCell}>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label="Lưu thay đổi" withArrow>
            <ActionIcon
              size="sm"
              color="success"
              variant="filled"
              loading={isSaving}
              disabled={!isWeightValid}
              onClick={handleSave}
              aria-label="Lưu thay đổi ánh xạ"
            >
              <IconCheck size={14} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Hủy" withArrow>
            <ActionIcon
              size="sm"
              color="neutral"
              variant="subtle"
              disabled={isSaving}
              onClick={onCancel}
              aria-label="Hủy chỉnh sửa ánh xạ"
            >
              <IconX size={14} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}
