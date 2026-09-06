'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ScrollText, ArrowRight } from 'lucide-react'
import { userService } from '@/services'

import type { UserAccountResponse, UpdateUserAccountPayload } from '@/lib/types'
import PersonalInfoGroup from '@/components/profile/PersonalInfoGroup'
import AccountInfoGroup from '@/components/profile/AccountInfoGroup'
import ChangePasswordGroup from '@/components/profile/ChangePasswordGroup'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/patterns/LayoutPatterns'
import { LoadingState, ErrorState } from '@/components/patterns/FeedbackPatterns'

export default function ProfilePage() {
  const [data, setData] = useState<UserAccountResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    userService
      .getCurrentUser()
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : 'Không thể tải thông tin tài khoản'
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
        <h1 className="text-ink text-2xl font-bold">Cài đặt tài khoản</h1>
        <p className="text-ink-muted text-sm mt-1">
          Quản lý thông tin đăng nhập, hồ sơ cá nhân và bảo mật tài khoản.
        </p>
      </div>

      {/* Account Profile Header Card */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="bg-brand-100 dark:bg-brand/20 flex size-14 shrink-0 items-center justify-center rounded-full border border-brand/20">
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
            <ScrollText className="h-4 w-4 text-brand" />
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
