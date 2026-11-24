'use client'

import { useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Radio,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconPencil } from '@tabler/icons-react'
import ProfileEmptyState from '@/components/profile/ProfileEmptyState'
import ProfileSection from '@/components/profile/ProfileSection'
import { getErrorMessage } from '@/lib/form-errors'
import { PERSONALITY_OPTIONS } from './constants'
import interactions from '@/styles/interactions.module.css'

const SELECTABLE_OPTIONS = PERSONALITY_OPTIONS.filter((opt) => opt.value !== '')

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
  const [selected, setSelected] = useState(data.personality ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setSelected(data.personality ?? '')
    setError(null)
    onDirtyChange?.(false)
    openEdit()
  }

  function handleCancel() {
    setSelected(data.personality ?? '')
    setError(null)
    onDirtyChange?.(false)
    closeEdit()
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave({ personality: selected || null })
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

  const personalityLabel = SELECTABLE_OPTIONS.find(
    (opt) => opt.value === data.personality
  )?.label

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

            <Radio.Group
              aria-label="Tính cách & phong cách làm việc"
              value={selected}
              onChange={(val) => {
                setSelected(val)
                onDirtyChange?.(true)
              }}
            >
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {SELECTABLE_OPTIONS.map((opt) => (
                  <Radio.Card
                    key={opt.value}
                    value={opt.value}
                    radius="md"
                    p="sm"
                    disabled={saving}
                    className={interactions.optionCard}
                  >
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Text size="sm" fw={500}>
                        {opt.label}
                      </Text>
                      <Radio.Indicator color="brand" />
                    </Group>
                  </Radio.Card>
                ))}
              </SimpleGrid>
            </Radio.Group>

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

              {selected ? (
                <Button
                  type="button"
                  variant="subtle"
                  color="neutral"
                  size="xs"
                  disabled={saving}
                  onClick={() => {
                    setSelected('')
                    onDirtyChange?.(true)
                  }}
                >
                  Bỏ chọn
                </Button>
              ) : null}
            </Group>
          </Stack>
        ) : personalityLabel ? (
          <Badge size="lg" variant="light" color="brand" w="fit-content">
            {personalityLabel}
          </Badge>
        ) : (
          <ProfileEmptyState message="Chưa cập nhật" />
        )}
      </ProfileSection>
    </Box>
  )
}
