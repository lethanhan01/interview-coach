'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  completed: 'Hoàn thành',
  generating: 'Đang tạo...',
  error: 'Lỗi',
}

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'default'

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  active: 'brand',
  ready: 'brand',
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Phiên phỏng vấn</h1>
          <p className="text-sm text-ink-muted mt-1">{sessions.length} phiên</p>
        </div>
        <Link
          href="/setup"
          className="px-5 py-2.5 text-sm font-medium text-white bg-brand rounded-full shadow-btn hover:bg-brand-light hover:shadow-glow transition-all duration-150 hover:scale-[1.02]"
        >
          Tạo phiên mới
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="size-16 rounded-2xl bg-brand-50 flex items-center justify-center">
            <span className="size-8 rounded-full bg-brand-200" />
          </div>
          <p className="text-lg font-medium text-ink">Chưa có phiên phỏng vấn nào</p>
          <p className="text-sm text-ink-muted max-w-sm">
            Dán Job Description và bắt đầu luyện tập ngay để nhận phản hồi từ AI.
          </p>
          <Link
            href="/setup"
            className="mt-2 px-6 py-2.5 text-sm font-medium text-white bg-brand rounded-full shadow-btn hover:bg-brand-light transition-all"
          >
            Bắt đầu phỏng vấn
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-surface rounded-2xl shadow-card border border-border p-5 transition-all duration-150 hover:shadow-glow hover:-translate-y-0.5"
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

              <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                {s.status === 'completed' && (
                  <Link
                    href={`/sessions/${s.id}/report`}
                    className="flex-1 text-center rounded-full border border-brand text-brand px-3 py-1.5 text-xs font-medium hover:bg-brand-50 transition-colors"
                  >
                    Xem báo cáo
                  </Link>
                )}
                {(s.status === 'active' || s.status === 'ready') && (
                  <Link
                    href={`/sessions/${s.id}`}
                    className="flex-1 text-center rounded-full bg-brand text-white px-3 py-1.5 text-xs font-medium hover:bg-brand-light shadow-btn transition-all"
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
