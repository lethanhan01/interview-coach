'use client'

import { useMemo, useState } from 'react'
import { useDebouncedValue } from '@mantine/hooks'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconRefresh, IconUsers } from '@tabler/icons-react'
import {
  computeUserMetrics,
  getUserDisplayName,
} from '@/components/admin/user-metrics'
import { useAuth } from '@/hooks/useAuth'
import { userQueries } from '@/queries/user.queries'
import { DeleteUserModal } from './DeleteUserModal'
import { useAdminUserMutations } from './useAdminUserMutations'
import {
  UsersFilterToolbar,
  type RoleFilter,
  type StatusFilter,
} from './UsersFilterToolbar'
import { UsersStatusSummary } from './UsersStatusSummary'
import { UsersTable } from './UsersTable'

export function AdminUsersClient() {
  const { user: currentUser, role, isLoading: authLoading } = useAuth()
  const isAdmin = !authLoading && role === 'admin'

  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search.trim().toLowerCase(), 250)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

  const usersQuery = useQuery({ ...userQueries.adminList(), enabled: isAdmin })
  const mutations = useAdminUserMutations(currentUser?.id ?? null)

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])
  const metrics = useMemo(() => computeUserMetrics(users), [users])
  const filteredUsers = useMemo(
    () =>
      users.filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        if (roleFilter !== 'all' && item.role !== roleFilter) return false
        if (debouncedSearch) {
          const name = getUserDisplayName(item).toLowerCase()
          const matchesEmail = item.email
            .toLowerCase()
            .includes(debouncedSearch)
          if (!matchesEmail && !name.includes(debouncedSearch)) return false
        }
        return true
      }),
    [users, statusFilter, roleFilter, debouncedSearch]
  )

  if (!isAdmin) return null

  const hasActiveFilter = Boolean(
    search.trim() || statusFilter !== 'all' || roleFilter !== 'all'
  )
  const queryError =
    usersQuery.error instanceof Error
      ? usersQuery.error.message
      : 'Không thể tải danh sách người dùng'

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setRoleFilter('all')
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
          {usersQuery.isLoading ? (
            <Skeleton height={26} width={110} radius="xl" />
          ) : (
            <Badge color="brand" variant="light" size="lg">
              {metrics.totalUsers} tài khoản
            </Badge>
          )}
        </Group>

        <UsersStatusSummary
          metrics={metrics}
          isLoading={usersQuery.isLoading}
        />

        <UsersFilterToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          filteredCount={filteredUsers.length}
          totalCount={users.length}
          hasActiveFilter={hasActiveFilter}
        />

        {mutations.mutationError ? (
          <Alert
            color="danger"
            variant="light"
            icon={<IconAlertCircle size={18} stroke={1.5} />}
            title="Thao tác thất bại"
            withCloseButton
            onClose={mutations.clearMutationError}
          >
            {mutations.mutationError}
          </Alert>
        ) : null}

        {usersQuery.isError ? (
          <Alert
            color="danger"
            variant="light"
            icon={<IconAlertCircle size={18} stroke={1.5} />}
            title="Không thể tải danh sách người dùng"
          >
            <Stack gap="xs">
              <Text size="sm">{queryError}</Text>
              <Group>
                <Button
                  size="xs"
                  variant="light"
                  color="danger"
                  leftSection={<IconRefresh size={14} stroke={1.5} />}
                  onClick={() => void usersQuery.refetch()}
                >
                  Thử lại
                </Button>
              </Group>
            </Stack>
          </Alert>
        ) : (
          <Paper withBorder radius="md">
            {usersQuery.isLoading ? (
              <Stack p="md" gap="sm">
                <Skeleton height={36} radius="sm" />
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
                  {hasActiveFilter
                    ? 'Không có tài khoản nào khớp với bộ lọc hiện tại.'
                    : 'Hệ thống chưa có người dùng nào.'}
                </Text>
                {hasActiveFilter ? (
                  <Button
                    size="xs"
                    variant="light"
                    onClick={handleResetFilters}
                  >
                    Xóa bộ lọc
                  </Button>
                ) : null}
              </Stack>
            ) : (
              <UsersTable
                users={filteredUsers}
                currentUserId={currentUser?.id ?? null}
                updatingUserId={mutations.updatingUserId}
                onToggleStatus={mutations.handleToggleStatus}
                onRequestDelete={mutations.handleRequestDelete}
              />
            )}
          </Paper>
        )}

        <DeleteUserModal
          opened={mutations.deleteModalOpened}
          user={mutations.userToDelete}
          isPending={mutations.isDeleting}
          errorMessage={mutations.deleteError}
          onClose={mutations.handleCloseDeleteModal}
          onConfirm={mutations.handleConfirmDelete}
        />
      </Stack>
    </Container>
  )
}
