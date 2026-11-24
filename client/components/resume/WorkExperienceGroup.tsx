'use client'

import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Text,
  Timeline,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconBriefcase,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import ProfileEmptyState from '@/components/profile/ProfileEmptyState'
import ProfileSection from '@/components/profile/ProfileSection'
import { getErrorMessage } from '@/lib/form-errors'
import type { TechnicalSkillEntry, WorkExperienceEntry } from '@/types'
import { formatResumeDateRange } from './resume-schemas'
import WorkExperienceFormModal from './WorkExperienceFormModal'

export interface WorkExperienceGroupProps {
  data: WorkExperienceEntry[] | undefined
  availableTechs: TechnicalSkillEntry[]
  onSave: (data: WorkExperienceEntry[]) => Promise<void>
}

export default function WorkExperienceGroup({
  data,
  availableTechs,
  onSave,
}: Readonly<WorkExperienceGroupProps>) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WorkExperienceEntry | null>(
    null
  )
  const [modalKey, setModalKey] = useState(0)

  const items = data ?? []
  const suggestedTechs = useMemo(
    () => Array.from(new Set(availableTechs.map((item) => item.name))),
    [availableTechs]
  )

  function handleOpenCreate() {
    setEditingEntry(null)
    setModalKey((k) => k + 1)
    setModalOpen(true)
  }

  function handleOpenEdit(entry: WorkExperienceEntry) {
    setEditingEntry(entry)
    setModalKey((k) => k + 1)
    setModalOpen(true)
  }

  async function handleSaveEntry(entry: WorkExperienceEntry) {
    const exists = items.some((item) => item.id === entry.id)
    const nextList = exists
      ? items.map((item) => (item.id === entry.id ? entry : item))
      : [entry, ...items]
    await onSave(nextList)
    notifications.show({
      title: exists ? 'Đã cập nhật' : 'Đã thêm mới',
      message: 'Kinh nghiệm làm việc đã được lưu.',
      color: 'success',
      closeButtonProps: { 'aria-label': 'Đóng thông báo' },
    })
  }

  function handleDeleteEntry(entry: WorkExperienceEntry) {
    modals.openConfirmModal({
      title: 'Xóa kinh nghiệm làm việc',
      children: (
        <Text size="sm">
          Bạn có chắc muốn xóa kinh nghiệm{' '}
          {entry.position || entry.company || 'này'} khỏi hồ sơ CV không?
        </Text>
      ),
      labels: { confirm: 'Xóa', cancel: 'Hủy' },
      confirmProps: { color: 'danger' },
      onConfirm: async () => {
        try {
          await onSave(items.filter((item) => item.id !== entry.id))
          notifications.show({
            title: 'Đã xóa',
            message: 'Kinh nghiệm làm việc đã được xóa khỏi hồ sơ.',
            color: 'success',
            closeButtonProps: { 'aria-label': 'Đóng thông báo' },
          })
        } catch (err) {
          notifications.show({
            title: 'Xóa thất bại',
            message: getErrorMessage(err, 'Không thể xóa kinh nghiệm làm việc'),
            color: 'danger',
            closeButtonProps: { 'aria-label': 'Đóng thông báo' },
          })
        }
      },
    })
  }

  return (
    <Box id="experience">
      <ProfileSection
        title="Kinh nghiệm làm việc"
        action={
          <Button
            type="button"
            variant="light"
            color="brand"
            size="xs"
            leftSection={<IconPlus size={14} stroke={1.5} aria-hidden="true" />}
            onClick={handleOpenCreate}
          >
            Thêm kinh nghiệm
          </Button>
        }
      >
        {items.length === 0 ? (
          <ProfileEmptyState message="Chưa có thông tin kinh nghiệm làm việc" />
        ) : (
          <Timeline active={items.length} bulletSize={28} lineWidth={2}>
            {items.map((entry) => (
              <Timeline.Item
                key={entry.id}
                bullet={
                  <IconBriefcase size={14} stroke={1.5} aria-hidden="true" />
                }
                title={
                  <Group
                    justify="space-between"
                    align="flex-start"
                    gap="xs"
                    wrap="nowrap"
                  >
                    <Stack gap={2} flex={1} miw={0}>
                      <Text size="sm" fw={600}>
                        {entry.position || '—'}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {entry.company || '—'}
                      </Text>
                    </Stack>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        variant="subtle"
                        color="neutral"
                        size="sm"
                        aria-label={`Chỉnh sửa kinh nghiệm tại ${entry.company || entry.position}`}
                        onClick={() => handleOpenEdit(entry)}
                      >
                        <IconPencil size={15} stroke={1.5} aria-hidden="true" />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="danger"
                        size="sm"
                        aria-label={`Xóa kinh nghiệm tại ${entry.company || entry.position}`}
                        onClick={() => handleDeleteEntry(entry)}
                      >
                        <IconTrash size={15} stroke={1.5} aria-hidden="true" />
                      </ActionIcon>
                    </Group>
                  </Group>
                }
              >
                <Stack gap="xs" mt={4}>
                  <Text size="xs" c="dimmed">
                    {formatResumeDateRange(
                      entry.startDate,
                      entry.endDate,
                      entry.isCurrent
                    )}
                  </Text>
                  {entry.techStack && entry.techStack.length > 0 ? (
                    <Group gap={6} wrap="wrap">
                      {entry.techStack.map((tech) => (
                        <Badge
                          key={tech}
                          variant="light"
                          color="brand"
                          size="xs"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </Group>
                  ) : null}
                  {entry.description ? (
                    <Text size="sm">{entry.description}</Text>
                  ) : null}
                </Stack>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </ProfileSection>

      <WorkExperienceFormModal
        key={modalKey}
        opened={modalOpen}
        initialEntry={editingEntry}
        suggestedTechs={suggestedTechs}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveEntry}
      />
    </Box>
  )
}
