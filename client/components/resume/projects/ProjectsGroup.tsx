'use client'

import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconExternalLink,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import ProfileEmptyState from '@/components/profile/primitives/ProfileEmptyState'
import ProfileSection from '@/components/profile/primitives/ProfileSection'
import { getErrorMessage } from '@/lib/form-errors'
import type { ProjectEntry, TechnicalSkillEntry } from '@/types'
import ProjectFormModal from './ProjectFormModal'
import { formatResumeDateRange } from '@/components/resume/resume-schemas'

export interface ProjectsGroupProps {
  data: ProjectEntry[] | undefined
  availableTechs: TechnicalSkillEntry[]
  onSave: (data: ProjectEntry[]) => Promise<void>
}

export default function ProjectsGroup({
  data,
  availableTechs,
  onSave,
}: Readonly<ProjectsGroupProps>) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ProjectEntry | null>(null)
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

  function handleOpenEdit(entry: ProjectEntry) {
    setEditingEntry(entry)
    setModalKey((k) => k + 1)
    setModalOpen(true)
  }

  async function handleSaveEntry(entry: ProjectEntry) {
    const exists = items.some((item) => item.id === entry.id)
    const nextList = exists
      ? items.map((item) => (item.id === entry.id ? entry : item))
      : [entry, ...items]
    await onSave(nextList)
    notifications.show({
      title: exists ? 'Đã cập nhật' : 'Đã thêm mới',
      message: 'Thông tin dự án đã được lưu.',
      color: 'success',
      closeButtonProps: { 'aria-label': 'Đóng thông báo' },
    })
  }

  function handleDeleteEntry(entry: ProjectEntry) {
    modals.openConfirmModal({
      title: 'Xóa dự án',
      children: (
        <Text size="sm">
          Bạn có chắc muốn xóa dự án {entry.name || 'này'} khỏi hồ sơ CV không?
        </Text>
      ),
      labels: { confirm: 'Xóa', cancel: 'Hủy' },
      confirmProps: { color: 'danger' },
      onConfirm: async () => {
        try {
          await onSave(items.filter((item) => item.id !== entry.id))
          notifications.show({
            title: 'Đã xóa',
            message: 'Dự án đã được xóa khỏi hồ sơ.',
            color: 'success',
            closeButtonProps: { 'aria-label': 'Đóng thông báo' },
          })
        } catch (err) {
          notifications.show({
            title: 'Xóa thất bại',
            message: getErrorMessage(err, 'Không thể xóa dự án'),
            color: 'danger',
            closeButtonProps: { 'aria-label': 'Đóng thông báo' },
          })
        }
      },
    })
  }

  return (
    <Box id="projects">
      <ProfileSection
        title="Dự án cá nhân"
        action={
          <Button
            type="button"
            variant="light"
            color="brand"
            size="xs"
            leftSection={<IconPlus size={14} stroke={1.5} aria-hidden="true" />}
            onClick={handleOpenCreate}
          >
            Thêm dự án
          </Button>
        }
      >
        {items.length === 0 ? (
          <ProfileEmptyState message="Chưa có thông tin dự án" />
        ) : (
          <SimpleGrid cols={{ base: 1 }} spacing="md">
            {items.map((entry) => (
              <Card key={entry.id} withBorder radius="md" p="md">
                <Stack gap="xs">
                  <Group
                    justify="space-between"
                    align="flex-start"
                    gap="xs"
                    wrap="nowrap"
                  >
                    <Stack gap={2} flex={1} miw={0}>
                      <Text size="sm" fw={600}>
                        {entry.name || '—'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatResumeDateRange(
                          entry.startDate,
                          entry.endDate,
                          entry.isCurrent
                        )}
                      </Text>
                    </Stack>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        variant="subtle"
                        color="neutral"
                        size="sm"
                        aria-label={`Chỉnh sửa dự án ${entry.name}`}
                        onClick={() => handleOpenEdit(entry)}
                      >
                        <IconPencil size={15} stroke={1.5} aria-hidden="true" />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="danger"
                        size="sm"
                        aria-label={`Xóa dự án ${entry.name}`}
                        onClick={() => handleDeleteEntry(entry)}
                      >
                        <IconTrash size={15} stroke={1.5} aria-hidden="true" />
                      </ActionIcon>
                    </Group>
                  </Group>

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

                  {entry.url ? (
                    <Anchor
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      c="brand"
                    >
                      <Group gap={4} wrap="nowrap" display="inline-flex">
                        <Text component="span" size="xs" truncate>
                          {entry.url}
                        </Text>
                        <IconExternalLink
                          size={12}
                          stroke={1.5}
                          aria-hidden="true"
                        />
                      </Group>
                    </Anchor>
                  ) : null}
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </ProfileSection>

      <ProjectFormModal
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
