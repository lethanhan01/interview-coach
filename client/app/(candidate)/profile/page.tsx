'use client'

import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ScrollText, ArrowRight } from 'lucide-react'
import {
  queryKeys,
  useOptionalQueryClient,
  userQueries,
} from '@/lib/query-client'
import { userService } from '@/services'

import type { UpdateUserAccountPayload } from '@/types'
import PersonalInfoGroup from '@/components/profile/PersonalInfoGroup'
import AccountInfoGroup from '@/components/profile/AccountInfoGroup'
import ChangePasswordGroup from '@/components/profile/ChangePasswordGroup'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/patterns/LayoutPatterns'
import {
  LoadingState,
  ErrorState,
} from '@/components/patterns/FeedbackPatterns'

export default function ProfilePage() {
  const queryClient = useOptionalQueryClient()
  const {
    data = null,
    isLoading: loading,
    error: queryError,
  } = useQuery(userQueries.me())

  const updateAccountMutation = useMutation({
    mutationFn: (patch: UpdateUserAccountPayload) =>
      userService.updateCurrentUser(patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.users.me(), updated)
    },
  })

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? 'Không thể tải thông tin tài khoản'
        : null

  async function patchAccount(patch: UpdateUserAccountPayload) {
    await updateAccountMutation.mutateAsync(patch)
  }

  if (loading) {
    return (
      <LoadingState
        text="Đang tải thông tin tài khoản..."
        minHeight="min-h-[50vh]"
      />
    )
  }

  if (error) {
    return (
      <PageContainer maxWidth="md" className="py-10">
        <ErrorState description={error} />
      </PageContainer>
    )
  }

  const fullName = [data?.lastname, data?.firstname].filter(Boolean).join(' ')

  return (
    <PageContainer maxWidth="md" className="space-y-6">
      <div>
        <h1 className="text-ink text-2xl font-bold">Cài đặt tài khoản</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Quản lý thông tin đăng nhập, hồ sơ cá nhân và bảo mật tài khoản.
        </p>
      </div>

      {/* Account Profile Header Card */}
      <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="bg-brand-100 dark:bg-brand/20 border-brand/20 flex size-14 shrink-0 items-center justify-center rounded-full border">
            <span className="text-brand text-xl font-bold">
              {(data?.firstname?.[0] || data?.email?.[0] || 'U').toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-ink text-lg font-semibold">
                {fullName || data?.email}
              </h2>
              <Badge variant="secondary" className="text-xs">
                Ứng viên
              </Badge>
            </div>
            <p className="text-ink-muted text-sm">{data?.email}</p>
          </div>
        </div>

        {/* Quick jump to Resume */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="shrink-0 gap-1.5 self-start sm:self-auto"
        >
          <Link href="/resume">
            <ScrollText className="text-brand h-4 w-4" />
            <span>Xem hồ sơ CV</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </Card>

      <div className="flex flex-col gap-6">
        <PersonalInfoGroup
          data={{
            firstname: data?.firstname ?? undefined,
            lastname: data?.lastname ?? undefined,
          }}
          onSave={(patch) => patchAccount(patch)}
        />

        <AccountInfoGroup
          email={data?.email}
          role={data?.role || 'candidate'}
          status={data?.status || 'active'}
        />

        <ChangePasswordGroup />
      </div>
    </PageContainer>
  )
}
