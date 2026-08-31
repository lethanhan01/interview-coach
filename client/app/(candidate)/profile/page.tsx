'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ScrollText, ArrowRight, User } from 'lucide-react'
import { profileService } from '@/services'

import type { GetProfileResponse } from '@/lib/types'
import PersonalInfoGroup from '@/components/profile/PersonalInfoGroup'
import AccountInfoGroup from '@/components/profile/AccountInfoGroup'
import ChangePasswordGroup from '@/components/profile/ChangePasswordGroup'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function ProfilePage() {
  const [data, setData] = useState<GetProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    profileService
      .getProfile()
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin tài khoản')
      )
      .finally(() => setLoading(false))
  }, [])

  async function patchProfile<T extends object>(patch: T) {
    const updated = await profileService.updateProfile(patch)
    setData(updated)
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-brand size-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <p className="text-danger text-sm">{error}</p>
      </div>
    )
  }

  const fullName = [data?.lastname, data?.firstname].filter(Boolean).join(' ')

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-ink text-2xl font-bold">Cài đặt tài khoản</h1>
        <p className="text-ink-muted text-sm mt-1">
          Quản lý thông tin đăng nhập, hồ sơ cá nhân và bảo mật tài khoản.
        </p>
      </div>

      {/* Account Profile Header Card */}
      <div className="border-border bg-surface shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5">
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
        <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5 self-start sm:self-auto">
          <Link href="/resume">
            <ScrollText className="h-4 w-4 text-brand" />
            <span>Xem hồ sơ CV</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        <PersonalInfoGroup
          data={{ firstname: data?.firstname, lastname: data?.lastname }}
          onSave={(patch) => patchProfile(patch)}
        />

        <AccountInfoGroup
          email={data?.email}
          role="candidate"
          status="active"
        />

        <ChangePasswordGroup />
      </div>
    </div>
  )
}
