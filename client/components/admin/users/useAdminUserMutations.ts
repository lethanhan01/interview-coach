'use client'

import { useState } from 'react'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/keys'
import { userManagementService } from '@/services/admin.service'
import type { AdminUser } from '@/types'

export function useAdminUserMutations(currentUserId: string | null) {
  const queryClient = useQueryClient()
  const [mutationError, setMutationError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)

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
      setDeleteModalOpened(false)
      setDeleteError('')
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
      setDeleteError(message)
      setMutationError(message)
      notifications.show({
        color: 'danger',
        title: 'Xóa tài khoản thất bại',
        message,
      })
    },
  })

  const handleToggleStatus = (target: AdminUser) => {
    if (currentUserId && target.id === currentUserId) return
    setMutationError('')
    updateUserMutation.mutate({
      id: target.id,
      status: target.status === 'active' ? 'locked' : 'active',
    })
  }

  const handleRequestDelete = (target: AdminUser) => {
    setDeleteError('')
    setUserToDelete(target)
    setDeleteModalOpened(true)
  }

  const handleConfirmDelete = () => {
    if (!userToDelete) return
    if (currentUserId && userToDelete.id === currentUserId) return
    setDeleteError('')
    setMutationError('')
    deleteUserMutation.mutate(userToDelete.id)
  }

  const handleCloseDeleteModal = () => {
    setDeleteModalOpened(false)
    setDeleteError('')
  }

  return {
    mutationError,
    clearMutationError: () => setMutationError(''),
    deleteError,
    userToDelete,
    deleteModalOpened,
    updatingUserId: updateUserMutation.isPending
      ? (updateUserMutation.variables?.id ?? null)
      : null,
    isDeleting: deleteUserMutation.isPending,
    handleToggleStatus,
    handleRequestDelete,
    handleConfirmDelete,
    handleCloseDeleteModal,
  }
}
