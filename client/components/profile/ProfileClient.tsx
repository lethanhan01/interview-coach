'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AccountProfileView } from '@/components/profile/AccountProfileView'
import { getErrorMessage } from '@/lib/form-errors'
import { queryKeys } from '@/queries/keys'
import { userQueries } from '@/queries/user.queries'
import { userService } from '@/services/user.service'
import type { UpdateUserAccountPayload } from '@/types'

export default function ProfileClient() {
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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.candidateProfile.detail(),
      })
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
      variant="candidate"
      title="Cài đặt tài khoản"
      subtitle="Quản lý thông tin đăng nhập, hồ sơ cá nhân và bảo mật tài khoản."
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
