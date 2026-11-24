'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AccountProfileView } from '@/components/profile/AccountProfileView'
import { getErrorMessage } from '@/lib/form-errors'
import { queryKeys } from '@/queries/keys'
import { userQueries } from '@/queries/user.queries'
import { userService } from '@/services/user.service'
import type { UpdateUserAccountPayload } from '@/types'

export default function AdminProfileClient() {
  const queryClient = useQueryClient()
  const {
    data = null,
    isPending,
    error: queryError,
    refetch,
  } = useQuery(userQueries.me())

  const updateAccountMutation = useMutation({
    mutationFn: (patch: UpdateUserAccountPayload) =>
      userService.updateCurrentUser(patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.users.me(), updated)
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    },
  })

  const error = queryError
    ? getErrorMessage(queryError, 'Không thể tải thông tin tài khoản')
    : null

  async function patchAccount(patch: UpdateUserAccountPayload) {
    await updateAccountMutation.mutateAsync(patch)
  }

  return (
    <AccountProfileView
      variant="admin"
      title="Hồ sơ Quản trị viên"
      subtitle="Quản lý thông tin tài khoản và bảo mật của quản trị viên hệ thống."
      data={data}
      loading={isPending}
      error={error}
      onRetry={() => {
        void refetch()
      }}
      onSavePersonalInfo={patchAccount}
    />
  )
}
