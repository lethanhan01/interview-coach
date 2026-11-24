'use client'

import { useState } from 'react'
import {
  Alert,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import type {
  OnetSfiaMapping,
  SfiaLevelResponsibility,
  SfiaSkillDefinition,
} from '@/types'
import { OnetSfiaRow } from './OnetSfiaRow'

export interface OnetSfiaTableProps {
  mappings: OnetSfiaMapping[]
  availableSkills: SfiaSkillDefinition[]
  levels?: SfiaLevelResponsibility[]
  editingId: string | null
  savingId: string | null
  highlightedSkillCode: string | null
  onStartEdit: (id: string) => void
  onCancelEdit: () => void
  onSave: (id: string, payload: Partial<OnetSfiaMapping>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDirtyChange?: (isDirty: boolean) => void
}

export function OnetSfiaTable({
  mappings,
  availableSkills,
  levels = [],
  editingId,
  savingId,
  highlightedSkillCode,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onDirtyChange,
}: Readonly<OnetSfiaTableProps>) {
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [deletingMapping, setDeletingMapping] =
    useState<OnetSfiaMapping | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleOpenDelete = (mapping: OnetSfiaMapping) => {
    setDeletingMapping(mapping)
    setDeleteError(null)
    setDeleteModalOpened(true)
  }

  const handleCloseDelete = () => {
    if (isDeleting) return
    setDeleteModalOpened(false)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingMapping) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(deletingMapping.id)
      setDeleteModalOpened(false)
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Không thể xóa ánh xạ SFIA'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (mappings.length === 0) {
    return (
      <Paper p="xl" radius="md" className={surfaces.subtleSurface}>
        <Stack align="center" gap="xs">
          <Text size="sm" fw={600}>
            Chưa có kỹ năng SFIA nào phù hợp với bộ lọc
          </Text>
          <Text size="xs" c="dimmed">
            Thử thay đổi từ khóa tìm kiếm hoặc bấm Thêm ánh xạ để bổ sung kỹ
            năng mới.
          </Text>
        </Stack>
      </Paper>
    )
  }

  return (
    <>
      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={650}>
          <Table verticalSpacing="xs" horizontalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w="28%">Kỹ năng SFIA</Table.Th>
                <Table.Th w="20%">Phân loại</Table.Th>
                <Table.Th w="12%">Cấp độ</Table.Th>
                <Table.Th w="16%">Trọng số</Table.Th>
                <Table.Th w="10%">Vai trò</Table.Th>
                <Table.Th w="14%">Nguồn</Table.Th>
                <Table.Th w={80} ta="right">
                  Thao tác
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {mappings.map((mapping) => (
                <OnetSfiaRow
                  key={mapping.id}
                  mapping={mapping}
                  isEditing={editingId === mapping.id}
                  isSaving={savingId === mapping.id}
                  availableSkills={availableSkills}
                  levels={levels}
                  onStartEdit={() => onStartEdit(mapping.id)}
                  onCancelEdit={onCancelEdit}
                  onSave={(payload) => onSave(mapping.id, payload)}
                  onDelete={() => handleOpenDelete(mapping)}
                  onDirtyChange={onDirtyChange}
                  isHighlighted={highlightedSkillCode === mapping.skillCode}
                />
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Modal
        opened={deleteModalOpened}
        onClose={handleCloseDelete}
        closeOnClickOutside={!isDeleting}
        closeOnEscape={!isDeleting}
        withCloseButton={!isDeleting}
        closeButtonProps={{ 'aria-label': 'Đóng cửa sổ xóa ánh xạ SFIA' }}
        title="Xác nhận xóa ánh xạ SFIA"
        centered
        size="sm"
      >
        <Stack gap="sm">
          {deleteError ? (
            <Alert
              color="danger"
              variant="light"
              icon={<IconAlertCircle size={16} stroke={1.5} />}
              title="Lỗi xóa ánh xạ"
            >
              {deleteError}
            </Alert>
          ) : null}

          <Text size="sm">
            Bạn có chắc chắn muốn xóa ánh xạ kỹ năng{' '}
            <Text span fw={700}>
              {deletingMapping?.skillCode} ({deletingMapping?.skillName})
            </Text>{' '}
            khỏi nghề này? Thao tác này có thể ảnh hưởng đến kết quả đánh giá
            phỏng vấn.
          </Text>

          <Group justify="flex-end" pt="xs">
            <Button
              variant="default"
              disabled={isDeleting}
              onClick={handleCloseDelete}
            >
              Hủy
            </Button>
            <Button
              color="danger"
              loading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Xác nhận xóa
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
