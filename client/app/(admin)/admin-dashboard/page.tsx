'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { userManagementService } from '@/services'
import type { AdminUser } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/patterns/LayoutPatterns'
import { LoadingState, ErrorState } from '@/components/patterns/FeedbackPatterns'
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  ArrowRight,
  UserCog,
  Sparkles,
} from 'lucide-react'
import { formatVietnamRelativeDate } from '@/lib/date-time'

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    userManagementService
      .listUsers()
      .then(setUsers)
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải dữ liệu thống kê quản trị'
        )
      )
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <LoadingState text="Đang tải dữ liệu thống kê quản trị..." minHeight="min-h-[50vh]" />
  }

  if (error) {
    return (
      <PageContainer maxWidth="lg" className="py-10">
        <ErrorState description={error} />
      </PageContainer>
    )
  }

  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.status === 'active').length
  const lockedUsers = users.filter((u) => u.status === 'locked').length
  const adminCount = users.filter((u) => u.role === 'admin').length

  const recentUsers = [...users]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)

  return (
    <PageContainer maxWidth="lg" className="space-y-8 py-0">
      {/* Header Banner */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Bảng điều khiển
              </span>
            </div>
            <h1 className="text-ink mt-2 text-2xl font-bold">
              Tổng quan hệ thống
            </h1>
            <p className="text-ink-muted mt-1 text-sm">
              Theo dõi người dùng, phân quyền và các hoạt động trên nền tảng InterviewCoach.
            </p>
          </div>
          <Button asChild size="md">
            <Link href="/users">
              <Users className="size-4 mr-1.5" />
              <span>Quản lý người dùng</span>
            </Link>
          </Button>
        </div>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              Tổng người dùng
            </span>
            <div className="bg-brand-subtle text-brand flex size-9 items-center justify-center rounded-xl">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-ink text-3xl font-bold tabular-nums">
              {totalUsers}
            </span>
            <span className="text-ink-faint text-xs">tài khoản</span>
          </div>
        </Card>

        {/* Active Users */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              Đang hoạt động
            </span>
            <div className="bg-success-subtle text-success-subtle-fg flex size-9 items-center justify-center rounded-xl">
              <UserCheck className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-ink text-3xl font-bold tabular-nums">
              {activeUsers}
            </span>
            <span className="text-success text-xs font-medium">
              {totalUsers > 0
                ? `${Math.round((activeUsers / totalUsers) * 100)}%`
                : '100%'}
            </span>
          </div>
        </Card>

        {/* Locked Users */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              Đã bị khóa
            </span>
            <div className="bg-danger-subtle text-danger-subtle-fg flex size-9 items-center justify-center rounded-xl">
              <UserX className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-ink text-3xl font-bold tabular-nums">
              {lockedUsers}
            </span>
            <span className="text-ink-faint text-xs">tài khoản</span>
          </div>
        </Card>

        {/* Admin Accounts */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              Quản trị viên
            </span>
            <div className="bg-brand-subtle text-brand flex size-9 items-center justify-center rounded-xl">
              <Shield className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-ink text-3xl font-bold tabular-nums">
              {adminCount}
            </span>
            <span className="text-ink-faint text-xs">admin</span>
          </div>
        </Card>
      </div>

      {/* Two columns: Recent Registrations & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent users snippet (2 cols) */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-ink text-base font-semibold">
                Người dùng mới đăng ký
              </h2>
              <p className="text-ink-muted text-xs mt-0.5">
                Các tài khoản vừa tạo trong hệ thống
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/users" className="gap-1 text-xs">
                <span>Xem tất cả</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          <div className="divide-border divide-y">
            {recentUsers.map((u) => {
              const fullName = [u.lastname, u.firstname]
                .filter(Boolean)
                .join(' ')
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-subtle text-brand flex size-9 items-center justify-center rounded-full text-xs font-bold">
                      {(u.firstname?.[0] || u.email[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-ink text-sm font-medium">
                        {fullName || u.email}
                      </p>
                      <p className="text-ink-muted text-xs">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Badge
                      variant={u.role === 'admin' ? 'brand' : 'default'}
                      className="text-xs"
                    >
                      {u.role}
                    </Badge>
                    <span className="text-ink-faint text-xs">
                      {formatVietnamRelativeDate(u.createdAt)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Quick Actions (1 col) */}
        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <h2 className="text-ink text-base font-semibold mb-1">
              Thao tác nhanh
            </h2>
            <p className="text-ink-muted text-xs mb-4">
              Truy cập nhanh các chức năng quản trị chính
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/users"
                className="border-border hover:border-brand/40 bg-surface-raised flex items-center justify-between rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-brand-subtle text-brand flex size-8 items-center justify-center rounded-lg">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <p className="text-ink text-sm font-medium">
                      Quản lý tài khoản
                    </p>
                    <p className="text-ink-muted text-xs">
                      Khóa, mở khóa và phân quyền
                    </p>
                  </div>
                </div>
                <ArrowRight className="text-ink-faint size-4" />
              </Link>

              <Link
                href="/admin-profile"
                className="border-border hover:border-brand/40 bg-surface-raised flex items-center justify-between rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-brand-subtle text-brand flex size-8 items-center justify-center rounded-lg">
                    <UserCog className="size-4" />
                  </div>
                  <div>
                    <p className="text-ink text-sm font-medium">
                      Hồ sơ quản trị
                    </p>
                    <p className="text-ink-muted text-xs">
                      Đổi mật khẩu và thông tin cá nhân
                    </p>
                  </div>
                </div>
                <ArrowRight className="text-ink-faint size-4" />
              </Link>
            </div>
          </Card>

          <Card className="bg-brand p-5 text-white border-brand">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-brand-200" />
              <p className="font-semibold text-sm">AI Session Engine</p>
            </div>
            <p className="text-brand-100 text-xs mt-2 leading-relaxed">
              Hệ thống phỏng vấn AI và đánh giá tự động đang hoạt động bình thường trên nền tảng.
            </p>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
