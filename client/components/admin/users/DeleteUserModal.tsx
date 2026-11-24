'use client'

import { Button, Group, Modal, Stack, Text } from '@mantine/core'
import type { AdminUser } from '@/types'

interface DeleteUserModalProps {
  user: AdminUser | null
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteUserModal({
  user,
  isPending,
  onClose,
  onConfirm,
}: Readonly<DeleteUserModalProps>) {
  return (
    <Modal
      opened={user !== null}
      onClose={() => {
        if (!isPending) onClose()
      }}
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
      withCloseButton={!isPending}
      title="Xác nhận xóa tài khoản"
      centered
    >
      <Stack gap="md">
        <Text size="sm">
          Bạn có chắc chắn muốn xóa mềm tài khoản{' '}
          <Text span fw={600}>
            {user?.email}
          </Text>
          ? Người dùng sẽ không thể đăng nhập được nữa.
        </Text>

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button color="danger" loading={isPending} onClick={onConfirm}>
            Xóa tài khoản
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
