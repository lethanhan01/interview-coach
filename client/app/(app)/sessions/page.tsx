'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { Session } from '@/lib/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'

const SESSION_TYPE_LABELS: Record<string, string> = {
  hr: 'HR / Behavioral',
  technical: 'Technical',
  mixed: 'Mixed',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang phỏng vấn',
  ready: 'Sẵn sàng',
  completing: 'Đang tạo báo cáo',
  completed: 'Hoàn thành',
  generating: 'Đang tạo...',
  error: 'Lỗi',
}

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'default'

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  active: 'brand',
  ready: 'brand',
  completing: 'warning',
  completed: 'success',
  generating: 'warning',
  error: 'danger',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get<{ sessions: Session[] }>('/sessions')
      .then((data) => setSessions(data.sessions ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải danh sách'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-danger">{error}</div>
    )
  }

  return (
    <div>
      <div className="mb-8 rounded-3xl border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
              Phiên phỏng vấn
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-ink">Quản lý phiên phỏng vấn</h1>
              <Badge variant="brand">{sessions.length} phiên</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              Tạo phiên mới, tiếp tục phiên đang chạy hoặc xem báo cáo đã hoàn thành.
            </p>
          </div>
        <Link
          href="/setup"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-btn transition-all duration-150 hover:scale-[1.02] hover:bg-brand-light hover:shadow-glow"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tạo phiên mới
        </Link>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center shadow-card">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-50">
            <Plus className="size-7 text-brand" aria-hidden="true" />
          </div>
          <p className="mt-5 text-lg font-semibold text-ink">Chưa có phiên phỏng vấn nào</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Dán Job Description và bắt đầu luyện tập ngay để nhận phản hồi từ AI.
          </p>
          <Link
            href="/setup"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-btn transition-all duration-150 hover:scale-[1.02] hover:bg-brand-light hover:shadow-glow"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Bắt đầu phỏng vấn
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <Badge variant={STATUS_VARIANTS[s.status] ?? 'default'}>
                  {STATUS_LABELS[s.status] ?? s.status}
                </Badge>
                {s.createdAt && (
                  <span className="text-xs text-ink-faint">{formatDate(s.createdAt)}</span>
                )}
              </div>

              <p className="text-sm font-medium text-ink mb-2">
                {SESSION_TYPE_LABELS[s.sessionType] ?? s.sessionType}
              </p>

              {s.contextPackId && (
                <Badge variant="default" className="mb-3">{s.contextPackId}</Badge>
              )}

              {s.status === 'completed' && s.overallScore != null && (
                <p className="text-xs text-ink-muted mb-3">
                  Điểm tổng:{' '}
                  <span className="font-semibold text-ink">{s.overallScore}/10</span>
                </p>
              )}

              <div className="mt-auto flex gap-2 border-t border-border pt-3">
                {s.status === 'completed' && (
                  <Link
                    href={`/sessions/${s.id}/report`}
                    className="flex-1 rounded-full border border-brand px-3 py-1.5 text-center text-xs font-medium text-brand transition-colors hover:bg-brand-50"
                  >
                    Xem báo cáo
                  </Link>
                )}
                {s.status === 'completing' && (
                  <Link
                    href={`/sessions/${s.id}/report`}
                    className="flex-1 rounded-full border border-brand px-3 py-1.5 text-center text-xs font-medium text-brand transition-colors hover:bg-brand-50"
                  >
                    Theo dõi báo cáo
                  </Link>
                )}
                {(s.status === 'active' || s.status === 'ready') && (
                  <Link
                    href={`/sessions/${s.id}`}
                    className="flex-1 rounded-full bg-brand px-3 py-1.5 text-center text-xs font-medium text-white shadow-btn transition-all hover:bg-brand-light"
                  >
                    {s.status === 'ready' ? 'Bắt đầu' : 'Tiếp tục'}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
