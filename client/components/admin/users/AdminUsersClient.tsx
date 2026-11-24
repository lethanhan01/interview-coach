'use client'

import { useMemo, useState } from 'react'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Badge,
  Container,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconSearch, IconUsers } from '@tabler/icons-react'
import { useAuth } from '@/hooks/useAuth'
import { queryKeys } from '@/queries/keys'
import { userQueries } from '@/queries/user.queries'
import { userManagementService } from '@/services/admin.service'
import {
  computeUserMetrics,
  getUserDisplayName,
} from '@/components/admin/dashboard/dashboard-metrics'
import type { AdminUser } from '@/types'
import { DeleteUserModal } from './DeleteUserModal'
import { UsersStatusSummary } from './UsersStatusSummary'
import { UsersTable } from './UsersTable'

type StatusFilter = 'all' | 'active' | 'locked'
type RoleFilter = 'all' | 'admin' | 'candidate'

export function AdminUsersClient() {
  const queryClient = useQueryClient()
  const { user: currentUser, role, isLoading: authLoading } = useAuth()
  const isAdmin = !authLoading && role === 'admin'

  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search.trim().toLowerCase(), 250)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [mutationError, setMutationError] = useState('')
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)

  const usersQuery = useQuery({
    ...userQueries.adminList(),
    enabled: isAdmin,
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      userManagementService.updateUser(id, { status }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.adminList(),
      })
      notifications.show({
        color: 'success',
        title: 'Đã cập nhật trạng thái',
        message:
          variables.status === 'locked'
            ? 'Tài khoản đã được khóa thành công.'
            : 'Tài khoản đã được mở khóa thành công.',
      })
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Không thể cập nhật trạng thái'
      setMutationError(message)
      notifications.show({
        color: 'danger',
        title: 'Cập nhật thất bại',
        message,
      })
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userManagementService.deleteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.adminList(),
      })
      notifications.show({
        color: 'success',
        title: 'Đã xóa tài khoản',
        message: 'Tài khoản đã được xóa mềm khỏi hệ thống.',
      })
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Không thể xóa tài khoản'
      setMutationError(message)
      notifications.show({
        color: 'danger',
        title: 'Xóa tài khoản thất bại',
        message,
      })
    },
    onSettled: () => {
      setUserToDelete(null)
    },
  })

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])
  const metrics = useMemo(() => computeUserMetrics(users), [users])

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (roleFilter !== 'all' && item.role !== roleFilter) return false
      if (debouncedSearch) {
        const displayName = getUserDisplayName(item).toLowerCase()
        const matchesEmail = item.email.toLowerCase().includes(debouncedSearch)
        const matchesName = displayName.includes(debouncedSearch)
        if (!matchesEmail && !matchesName) return false
      }
      return true
    })
  }, [users, statusFilter, roleFilter, debouncedSearch])

  if (!isAdmin) return null

  const isMutating =
    updateUserMutation.isPending || deleteUserMutation.isPending
  const errorMessage =
    mutationError ||
    (usersQuery.error instanceof Error
      ? usersQuery.error.message
      : usersQuery.error
        ? 'Không thể tải danh sách người dùng'
        : '')

  const handleToggleStatus = (target: AdminUser) => {
    if (currentUser?.id && target.id === currentUser.id) return
    setMutationError('')
    updateUserMutation.mutate({
      id: target.id,
      status: target.status === 'active' ? 'locked' : 'active',
    })
  }

  const handleConfirmDelete = () => {
    if (!userToDelete) return
    if (currentUser?.id && userToDelete.id === currentUser.id) return
    setMutationError('')
    deleteUserMutation.mutate(userToDelete.id)
  }

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Title order={1} size="h2">
              Quản lý người dùng
            </Title>
            <Text size="sm" c="dimmed">
              Quản lý tài khoản, phân quyền và trạng thái hoạt động trên toàn hệ
              thống.
            </Text>
          </Stack>
          <Badge color="brand" variant="light" size="lg">
            {metrics.totalUsers} tài khoản
          </Badge>
        </Group>

        <UsersStatusSummary metrics={metrics} />

        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <TextInput
            placeholder="Tìm theo email hoặc họ tên..."
            aria-label="Tìm theo email hoặc họ tên"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            leftSection={<IconSearch size={16} stroke={1.5} />}
            w={{ base: '100%', sm: 320 }}
          />

          <Group gap="sm" wrap="wrap">
            <SegmentedControl
              size="xs"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              aria-label="Lọc theo trạng thái tài khoản"
              data={[
                { value: 'all', label: 'Tất cả' },
                { value: 'active', label: 'Hoạt động' },
                { value: 'locked', label: 'Đã khóa' },
              ]}
            />

            <Select
              size="xs"
              w={180}
              aria-label="Lọc theo vai trò"
              value={roleFilter}
              onChange={(value) =>
                setRoleFilter((value as RoleFilter | null) ?? 'all')
              }
              allowDeselect={false}
              data={[
                { value: 'all', label: 'Tất cả vai trò' },
                { value: 'admin', label: 'Quản trị viên' },
                { value: 'candidate', label: 'Ứng viên' },
              ]}
            />
          </Group>
        </Group>

        {errorMessage ? (
          <Alert
            color="danger"
            variant="light"
            icon={<IconAlertCircle size={18} stroke={1.5} />}
            title="Đã xảy ra lỗi"
          >
            {errorMessage}
          </Alert>
        ) : null}

        <Paper withBorder radius="md">
          {usersQuery.isLoading ? (
            <Stack p="md" gap="sm">
              <Skeleton height={36} radius="sm" />
              <Skeleton height={44} radius="sm" />
              <Skeleton height={44} radius="sm" />
              <Skeleton height={44} radius="sm" />
            </Stack>
          ) : filteredUsers.length === 0 ? (
            <Stack align="center" justify="center" gap="xs" py="xl" px="md">
              <IconUsers size={28} stroke={1.5} aria-hidden="true" />
              <Text size="sm" fw={600}>
                Không tìm thấy người dùng
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                {search || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'Không có tài khoản nào khớp với bộ lọc hiện tại.'
                  : 'Hệ thống chưa có người dùng nào.'}
              </Text>
            </Stack>
          ) : (
            <UsersTable
              users={filteredUsers}
              currentUserId={currentUser?.id ?? null}
              isMutating={isMutating}
              onToggleStatus={handleToggleStatus}
              onRequestDelete={(target) => setUserToDelete(target)}
            />
          )}
        </Paper>

        <DeleteUserModal
          user={userToDelete}
          isPending={deleteUserMutation.isPending}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      </Stack>
    </Container>
  )
}
