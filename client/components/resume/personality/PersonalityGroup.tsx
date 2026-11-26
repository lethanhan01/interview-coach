'use client'

import { useState } from 'react'
import { Alert, Box, Button, Group, Stack, Text, Textarea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconPencil } from '@tabler/icons-react'
import ProfileEmptyState from '@/components/profile/primitives/ProfileEmptyState'
import ProfileSection from '@/components/profile/primitives/ProfileSection'
import { getErrorMessage } from '@/lib/form-errors'

export interface PersonalityGroupProps {
  data: { personality?: string | null }
  onSave: (patch: Record<string, unknown>) => Promise<void>
  onDirtyChange?: (dirty: boolean) => void
}

export default function PersonalityGroup({
  data,
  onSave,
  onDirtyChange,
}: Readonly<PersonalityGroupProps>) {
  const [isEditing, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [value, setValue] = useState(data.personality ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setValue(data.personality ?? '')
    setError(null)
    onDirtyChange?.(false)
    openEdit()
  }

  function handleCancel() {
    setValue(data.personality ?? '')
    setError(null)
    onDirtyChange?.(false)
    closeEdit()
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const trimmed = value.trim()
      await onSave({ personality: trimmed || null })
      onDirtyChange?.(false)
      notifications.show({
        title: 'Đã cập nhật',
        message: 'Phong cách làm việc đã được lưu.',
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

  const displayText = data.personality?.trim() || undefined

  return (
    <Box id="personality">
      <ProfileSection
        title="Tính cách & Phong cách làm việc"
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
        {isEditing ? (
          <Stack gap="md">
            {error ? (
              <Alert
                color="danger"
                variant="light"
                role="alert"
                icon={
                  <IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />
                }
              >
                {error}
              </Alert>
            ) : null}

            <Textarea
              label="Mô tả tính cách & phong cách làm việc"
              placeholder="VD: Chủ động, tư duy phân tích hệ thống, phối hợp nhóm tốt..."
              autosize
              minRows={3}
              maxRows={6}
              value={value}
              disabled={saving}
              onChange={(e) => {
                setValue(e.currentTarget.value)
                onDirtyChange?.(true)
              }}
            />

            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="xs">
                <Button
                  type="button"
                  color="brand"
                  size="sm"
                  loading={saving}
                  disabled={saving}
                  onClick={handleSave}
                >
                  Lưu thay đổi
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

              {value.trim() ? (
                <Button
                  type="button"
                  variant="subtle"
                  color="neutral"
                  size="xs"
                  disabled={saving}
                  onClick={() => {
                    setValue('')
                    onDirtyChange?.(true)
                  }}
                >
                  Xóa nội dung
                </Button>
              ) : null}
            </Group>
          </Stack>
        ) : displayText ? (
          <Text size="sm" lh={1.6}>
            {displayText}
          </Text>
        ) : (
          <ProfileEmptyState message="Chưa cập nhật" />
        )}
      </ProfileSection>
    </Box>
  )
}
