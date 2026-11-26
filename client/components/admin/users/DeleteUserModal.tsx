'use client'

import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import type { AdminUser } from '@/types'

interface DeleteUserModalProps {
  opened: boolean
  user: AdminUser | null
  isPending: boolean
  errorMessage?: string
  onClose: () => void
  onConfirm: () => void
}

export function DeleteUserModal({
  opened,
  user,
  isPending,
  errorMessage,
  onClose,
  onConfirm,
}: Readonly<DeleteUserModalProps>) {
  return (
    <Modal
      opened={opened}
      onClose={() => !isPending && onClose()}
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
        {errorMessage ? (
          <Alert
            color="danger"
            variant="light"
            icon={<IconAlertCircle size={16} stroke={1.5} />}
          >
            {errorMessage}
          </Alert>
        ) : null}
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
