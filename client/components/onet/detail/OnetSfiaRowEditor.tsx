'use client'

import { useEffect, useState } from 'react'
import {
  ActionIcon,
  Group,
  NumberInput,
  Select,
  Switch,
  Table,
  Tooltip,
} from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import type { OnetSfiaMapping } from '@/types'
import classes from './OnetSfiaRow.module.css'

export interface OnetSfiaRowEditorProps {
  mapping: OnetSfiaMapping
  minLevel: number
  maxLevel: number
  isSaving: boolean
  onSave: (payload: Partial<OnetSfiaMapping>) => Promise<void>
  onCancel: () => void
  onDirtyChange?: (isDirty: boolean) => void
}

export function OnetSfiaRowEditor({
  mapping,
  minLevel,
  maxLevel,
  isSaving,
  onSave,
  onCancel,
  onDirtyChange,
}: Readonly<OnetSfiaRowEditorProps>) {
  const [draftLevel, setDraftLevel] = useState(mapping.targetLevel)
  const [draftWeight, setDraftWeight] = useState(mapping.weight)
  const [draftIsCore, setDraftIsCore] = useState(mapping.isCore)

  const isDirty =
    draftLevel !== mapping.targetLevel ||
    draftWeight !== mapping.weight ||
    draftIsCore !== mapping.isCore

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const levelOptions = Array.from(
    { length: maxLevel - minLevel + 1 },
    (_, i) => {
      const lvl = minLevel + i
      return { value: String(lvl), label: `L${lvl}` }
    }
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.defaultPrevented) return

    // Guard against Enter/Escape when a select dropdown is expanded
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

  const handleSave = async () => {
    await onSave({
      targetLevel: draftLevel,
      weight: draftWeight,
      isCore: draftIsCore,
    })
  }

  return (
    <Table.Tr onKeyDown={handleKeyDown}>
      <Table.Td colSpan={2}>
        <Group gap="xs">
          <Select
            size="xs"
            w={90}
            comboboxProps={{ withinPortal: true }}
            value={String(draftLevel)}
            onChange={(val) => setDraftLevel(Number(val) || minLevel)}
            data={levelOptions}
            aria-label="Chỉnh sửa cấp độ mục tiêu SFIA"
          />
        </Group>
      </Table.Td>

      <Table.Td>
        <Select
          size="xs"
          w={90}
          comboboxProps={{ withinPortal: true }}
          value={String(draftLevel)}
          onChange={(val) => setDraftLevel(Number(val) || minLevel)}
          data={levelOptions}
          aria-label="Cấp độ mục tiêu"
        />
      </Table.Td>

      <Table.Td className={classes.weightCell}>
        <NumberInput
          size="xs"
          w={90}
          min={0.1}
          max={5.0}
          step={0.1}
          decimalScale={1}
          fixedDecimalScale
          value={draftWeight}
          onChange={(val) => setDraftWeight(Number(val) || 1.0)}
          aria-label="Chỉnh sửa trọng số đánh giá"
        />
      </Table.Td>

      <Table.Td>
        <Switch
          size="xs"
          checked={draftIsCore}
          onChange={(e) => setDraftIsCore(e.currentTarget.checked)}
          aria-label="Chỉnh sửa vai trò cốt lõi"
        />
      </Table.Td>

      <Table.Td>
        <Table.Td colSpan={1} />
      </Table.Td>

      <Table.Td className={classes.actionsCell}>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label="Lưu thay đổi" withArrow>
            <ActionIcon
              size="sm"
              color="success"
              variant="filled"
              loading={isSaving}
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
