'use client'

import { useState } from 'react'
import { Alert, Box, Button, Group, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconPencil } from '@tabler/icons-react'
import ProfileSection from '@/components/profile/primitives/ProfileSection'
import { getErrorMessage } from '@/lib/form-errors'
import type { OnetTech, TechnicalSkillEntry } from '@/types'
import type { TechCategory } from '@/components/resume/constants'
import OnetSkillSuggestions from './OnetSkillSuggestions'
import SkillCategoryEditor, { detectTechCategory } from './SkillCategoryEditor'
import SkillCategoryGrid from './SkillCategoryGrid'

export { detectTechCategory }

export interface TechnicalSkillsGroupProps {
  data: TechnicalSkillEntry[]
  onetSocCode?: string | null
  targetPosition?: string | null
  onSave: (patch: Record<string, unknown>) => Promise<void>
  onDirtyChange?: (dirty: boolean) => void
}

export default function TechnicalSkillsGroup({
  data,
  onetSocCode,
  onSave,
  onDirtyChange,
}: Readonly<TechnicalSkillsGroupProps>) {
  const [isEditing, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [entries, setEntries] = useState<TechnicalSkillEntry[]>(data)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] =
    useState<TechCategory>('framework')
  const [customMonths, setCustomMonths] = useState<number | string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setEntries(data)
    setCustomName('')
    setCustomMonths('')
    setError(null)
    onDirtyChange?.(false)
    openEdit()
  }

  function handleCancel() {
    setError(null)
    onDirtyChange?.(false)
    closeEdit()
  }

  function handlePickOnet(tech: OnetTech) {
    setCustomName(tech.example)
    setCustomCategory(detectTechCategory(tech.example))
    if (customMonths === '') setCustomMonths(12)
  }

  function handleAddSkill() {
    const trimmed = customName.trim()
    if (!trimmed) return
    const parsedMonths =
      customMonths === '' ? 12 : Number.parseInt(String(customMonths), 10)
    if (Number.isNaN(parsedMonths) || parsedMonths < 0 || parsedMonths > 600) {
      setError('Số tháng kinh nghiệm phải là số nguyên từ 0 đến 600.')
      return
    }
    if (entries.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Kỹ năng "${trimmed}" đã có trong hồ sơ.`)
      return
    }
    setError(null)
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category: customCategory,
        name: trimmed,
        usagePeriod: parsedMonths,
      },
    ])
    onDirtyChange?.(true)
    setCustomName('')
    setCustomMonths('')
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((item) => item.id !== id))
    onDirtyChange?.(true)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave({ technicalSkills: entries })
      onDirtyChange?.(false)
      notifications.show({
        title: 'Đã cập nhật',
        message: 'Danh sách kỹ năng chuyên môn đã được lưu.',
        color: 'success',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
      closeEdit()
    } catch (err) {
      setError(getErrorMessage(err, 'Lưu thất bại'))
    } finally {
      setSaving(false)
    }
  }

  const activeList = isEditing ? entries : data
  const existingNames = new Set(activeList.map((e) => e.name.toLowerCase()))

  return (
    <Box id="skills">
      <ProfileSection
        title="Kỹ năng chuyên môn"
        action={
          !isEditing ? (
            <Button
              type="button"
              variant="light"
              color="brand"
              size="xs"
              leftSection={
                <IconPencil size={14} stroke={1.5} aria-hidden="true" />
              }
              onClick={handleEdit}
            >
              Chỉnh sửa
            </Button>
          ) : undefined
        }
      >
        <Stack gap="md">
          {isEditing ? (
            <>
              <OnetSkillSuggestions
                onetSocCode={onetSocCode}
                existingNames={existingNames}
                onPickTech={handlePickOnet}
              />
              <SkillCategoryEditor
                customName={customName}
                customCategory={customCategory}
                customMonths={customMonths}
                disabled={saving}
                onNameChange={(val) => {
                  setCustomName(val)
                  if (val.trim()) setCustomCategory(detectTechCategory(val))
                }}
                onCategoryChange={setCustomCategory}
                onMonthsChange={setCustomMonths}
                onAdd={handleAddSkill}
              />
            </>
          ) : null}

          <SkillCategoryGrid
            items={activeList}
            isEditing={isEditing}
            onRemove={removeEntry}
          />

          {isEditing ? (
            <>
              {error ? (
                <Alert
                  color="danger"
                  variant="light"
                  role="alert"
                  icon={
                    <IconAlertCircle
                      size={18}
                      stroke={1.5}
                      aria-hidden="true"
                    />
                  }
                >
                  {error}
                </Alert>
              ) : null}
              <Group gap="xs">
                <Button
                  type="button"
                  color="brand"
                  size="sm"
                  loading={saving}
                  disabled={saving}
                  onClick={handleSave}
                >
                  Lưu kỹ năng
                </Button>
                <Button
                  type="button"
                  variant="subtle"
                  color="neutral"
                  size="sm"
                  disabled={saving}
                  onClick={handleCancel}
                >
                  Hủy
                </Button>
              </Group>
            </>
          ) : null}
        </Stack>
      </ProfileSection>
    </Box>
  )
}
