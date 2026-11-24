'use client'

import {
  Avatar,
  Badge,
  Button,
  Group,
  Stack,
  Table,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconLock, IconLockOpen, IconTrash } from '@tabler/icons-react'
import { formatVietnamRelativeDate } from '@/lib/date-time'
import {
  getUserDisplayName,
  getUserInitials,
} from '@/components/admin/dashboard/dashboard-metrics'
import type { AdminUser } from '@/types'

interface UsersTableProps {
  users: AdminUser[]
  currentUserId: string | null
  isMutating: boolean
  onToggleStatus: (user: AdminUser) => void
  onRequestDelete: (user: AdminUser) => void
}

export function UsersTable({
  users,
  currentUserId,
  isMutating,
  onToggleStatus,
  onRequestDelete,
}: Readonly<UsersTableProps>) {
  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Người dùng</Table.Th>
            <Table.Th>Vai trò</Table.Th>
            <Table.Th>Trạng thái</Table.Th>
            <Table.Th>Ngày tạo</Table.Th>
            <Table.Th ta="right">Hành động</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user) => {
            const displayName = getUserDisplayName(user)
            const isSelf = currentUserId !== null && user.id === currentUserId
            const isActive = user.status === 'active'
            const actionButtons = (
              <Group gap="xs" justify="flex-end" wrap="nowrap">
                <Button
                  variant="light"
                  color={isActive ? 'warning' : 'success'}
                  size="xs"
                  disabled={isMutating || isSelf}
                  leftSection={
                    isActive ? (
                      <IconLock size={14} stroke={1.5} aria-hidden="true" />
                    ) : (
                      <IconLockOpen size={14} stroke={1.5} aria-hidden="true" />
                    )
                  }
                  onClick={() => onToggleStatus(user)}
                >
                  {isActive ? 'Khóa' : 'Mở khóa'}
                </Button>
                <Button
                  variant="light"
                  color="danger"
                  size="xs"
                  disabled={isMutating || isSelf}
                  leftSection={
                    <IconTrash size={14} stroke={1.5} aria-hidden="true" />
                  }
                  onClick={() => onRequestDelete(user)}
                >
                  Xóa
                </Button>
              </Group>
            )

            return (
              <Table.Tr key={user.id}>
                <Table.Td>
                  <Group gap="sm" wrap="nowrap">
                    <Avatar
                      color={user.role === 'admin' ? 'brand' : 'neutral'}
                      radius="xl"
                      size="sm"
                      aria-hidden="true"
                    >
                      {getUserInitials(user)}
                    </Avatar>
                    <Stack gap={0}>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="sm" fw={500} lineClamp={1}>
                          {displayName}
                        </Text>
                        {isSelf ? (
                          <Badge color="brand" variant="outline" size="xs">
                            Bạn
                          </Badge>
                        ) : null}
                      </Group>
                      {displayName !== user.email ? (
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {user.email}
                        </Text>
                      ) : null}
                    </Stack>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={user.role === 'admin' ? 'brand' : 'neutral'}
                    variant="light"
                    size="sm"
                  >
                    {user.role === 'admin' ? 'Quản trị viên' : 'Ứng viên'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={isActive ? 'success' : 'danger'}
                    variant="light"
                    size="sm"
                  >
                    {isActive ? 'Hoạt động' : 'Đã khóa'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {formatVietnamRelativeDate(user.createdAt)}
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  {isSelf ? (
                    <Tooltip label="Không thể tự khóa hoặc xóa tài khoản đang đăng nhập">
                      {actionButtons}
                    </Tooltip>
                  ) : (
                    actionButtons
                  )}
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
