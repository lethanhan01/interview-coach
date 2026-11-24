'use client'

import { useState } from 'react'
import {
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import surfaces from '@/styles/surfaces.module.css'
import type { OnetSfiaMapping, SfiaSkillDefinition } from '@/types'
import { OnetSfiaRow } from './OnetSfiaRow'

export interface OnetSfiaTableProps {
  mappings: OnetSfiaMapping[]
  availableSkills: SfiaSkillDefinition[]
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
  editingId,
  savingId,
  highlightedSkillCode,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onDirtyChange,
}: Readonly<OnetSfiaTableProps>) {
  const [deletingMapping, setDeletingMapping] = useState<OnetSfiaMapping | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = async () => {
    if (!deletingMapping) return
    setIsDeleting(true)
    try {
      await onDelete(deletingMapping.id)
      setDeletingMapping(null)
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
            Thử thay đổi từ khóa tìm kiếm hoặc bấm Thêm ánh xạ để bổ sung kỹ năng mới.
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
                  onStartEdit={() => onStartEdit(mapping.id)}
                  onCancelEdit={onCancelEdit}
                  onSave={(payload) => onSave(mapping.id, payload)}
                  onDelete={() => setDeletingMapping(mapping)}
                  onDirtyChange={onDirtyChange}
                  isHighlighted={highlightedSkillCode === mapping.skillCode}
                />
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* Controlled Delete Modal completely outside of table */}
      <Modal
        opened={Boolean(deletingMapping)}
        onClose={isDeleting ? () => undefined : () => setDeletingMapping(null)}
        closeOnClickOutside={!isDeleting}
        closeButtonProps={{ 'aria-label': 'Đóng cửa sổ xóa ánh xạ SFIA' }}
        title="Xác nhận xóa ánh xạ SFIA"
        centered
        size="sm"
      >
        <Stack gap="sm">
          <Text size="sm">
            Bạn có chắc chắn muốn xóa ánh xạ kỹ năng{' '}
            <Text span fw={700}>
              {deletingMapping?.skillCode} ({deletingMapping?.skillName})
            </Text>{' '}
            khỏi nghề này? Thao tác này có thể ảnh hưởng đến kết quả đánh giá phỏng vấn.
          </Text>

          <Group justify="flex-end" pt="xs">
            <Button
              variant="default"
              disabled={isDeleting}
              onClick={() => setDeletingMapping(null)}
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
