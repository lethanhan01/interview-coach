'use client'

import { useEffect, useState } from 'react'
import { userService } from '@/services'
import type { UserAccountResponse, UpdateUserAccountPayload } from '@/lib/types'
import PersonalInfoGroup from '@/components/profile/PersonalInfoGroup'
import AccountInfoGroup from '@/components/profile/AccountInfoGroup'
import ChangePasswordGroup from '@/components/profile/ChangePasswordGroup'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/patterns/LayoutPatterns'
import { LoadingState, ErrorState } from '@/components/patterns/FeedbackPatterns'
import { ShieldCheck } from 'lucide-react'

export default function AdminProfilePage() {
  const [data, setData] = useState<UserAccountResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải thông tin tài khoản'
        )
      )
      .finally(() => setLoading(false))
  }, [])

  async function patchAccount(patch: UpdateUserAccountPayload) {
    const updated = await userService.updateCurrentUser(patch)
    setData(updated)
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
        <h1 className="text-ink text-2xl font-bold">Hồ sơ Quản trị viên</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Quản lý thông tin tài khoản và bảo mật của quản trị viên hệ thống.
        </p>
      </div>

      {/* Admin Profile Header Card */}
      <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="bg-brand-subtle text-brand-subtle-fg flex size-14 shrink-0 items-center justify-center rounded-full border border-brand/20">
            <span className="text-brand text-xl font-bold">
              {(data?.firstname?.[0] || data?.email?.[0] || 'A').toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-ink text-lg font-semibold">
                {fullName || data?.email}
              </h2>
              <Badge variant="brand" className="text-xs">
                Quản trị viên
              </Badge>
            </div>
            <p className="text-ink-muted text-sm">{data?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <ShieldCheck className="size-4 text-brand" />
          <span>Toàn quyền hệ thống</span>
        </div>
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
          role={data?.role || 'admin'}
          status={data?.status || 'active'}
        />

        <ChangePasswordGroup />
      </div>
    </PageContainer>
  )
}
