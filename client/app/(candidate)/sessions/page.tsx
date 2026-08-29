'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Clock } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { Session } from '@/lib/types'
import { formatVietnamDateTime } from '@/lib/date-time'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'

const SESSION_TYPE_LABELS: Record<string, string> = {
  hr: 'HR / Behavioral',
  technical: 'Technical',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang phỏng vấn',
  paused: 'Tạm dừng',
  ready: 'Sẵn sàng',
  completing: 'Đang tạo báo cáo',
  completed: 'Hoàn thành',
  canceled: 'Đã hủy',
  generating: 'Đang tạo...',
  error: 'Lỗi',
}

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'default'

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  active: 'brand',
  paused: 'warning',
  ready: 'brand',
  completing: 'warning',
  completed: 'success',
  canceled: 'danger',
  generating: 'warning',
  error: 'danger',
}

function getCompanyName(jobDescription: string): string | undefined {
  const line = jobDescription
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith('Tên công ty:'))
  if (!line) return undefined
  return line.slice(line.indexOf(':') + 1).trim() || undefined
}

function scoreContainerClass(pct: number): string {
  if (pct >= 70) return 'bg-green-50 text-green-700'
  if (pct >= 50) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-700'
}

function ScoreDisplay({ score }: Readonly<{ score: number }>) {
  const pct = Math.min(100, Math.max(0, score))

  return (
    <div className={`rounded-xl px-4 py-3 ${scoreContainerClass(pct)}`}>
      <p className="mb-1 text-xs font-medium opacity-60">Điểm tổng</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums leading-none">
          {score}
        </span>
        <span className="text-sm opacity-50">/100</span>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    apiClient
      .get<{ sessions: Session[] }>('/sessions')
      .then((data) => {
        if (!cancelled) setSessions(data.sessions ?? [])
      })
      .catch((err) => {
        if (cancelled) return
        const msg =
          err instanceof Error ? err.message : 'Không thể tải danh sách'
        setError(
          msg === 'Failed to fetch'
            ? 'Không thể kết nối đến server. Kiểm tra server có đang chạy không.'
            : msg
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [retryCount])

  function retryLoad() {
    setLoading(true)
    setError(null)
    setRetryCount((c) => c + 1)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-danger text-sm">{error}</p>
        <button
          onClick={retryLoad}
          className="border-brand text-brand hover:bg-brand-subtle rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="border-border bg-surface shadow-card mb-8 rounded-3xl border p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-ink-muted text-xs font-semibold uppercase tracking-[0.2em]">
              Phiên phỏng vấn
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-ink text-2xl font-bold">
                Quản lý phiên phỏng vấn
              </h1>
              <Badge variant="brand">{sessions.length} phiên</Badge>
            </div>
            <p className="text-ink-muted mt-2 text-sm">
              Tạo phiên mới, tiếp tục phiên đang chạy hoặc xem báo cáo đã hoàn
              thành.
            </p>
          </div>
          <Link
            href="/setup"
            className="bg-brand shadow-btn hover:bg-brand-light hover:shadow-glow inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo phiên mới
          </Link>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="border-border bg-surface shadow-card rounded-3xl border p-10 text-center">
          <div className="bg-brand-subtle text-brand-subtle-fg mx-auto flex size-16 items-center justify-center rounded-2xl">
            <Plus className="size-7" aria-hidden="true" />
          </div>
          <p className="text-ink mt-5 text-lg font-semibold">
            Chưa có phiên phỏng vấn nào
          </p>
          <p className="text-ink-muted mx-auto mt-2 max-w-sm text-sm">
            Dán Job Description và bắt đầu luyện tập ngay để nhận phản hồi từ
            AI.
          </p>
          <Link
            href="/setup"
            className="bg-brand shadow-btn hover:bg-brand-light hover:shadow-glow mt-5 inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Bắt đầu phỏng vấn
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => {
            const company = getCompanyName(s.jobDescription)
            return (
              <div
                key={s.id}
                className="border-border bg-surface shadow-card hover:shadow-glow flex h-full flex-col rounded-2xl border transition-all duration-150 hover:-translate-y-0.5"
              >
                <div className="flex flex-1 flex-col gap-4 p-5">
                  {/* Status badge + date/time */}
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={STATUS_VARIANTS[s.status] ?? 'default'}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </Badge>
                    {s.createdAt && (
                      <span className="text-ink-faint shrink-0 text-xs">
                        {formatVietnamDateTime(s.createdAt)}
                      </span>
                    )}
                  </div>

                  {/* Job title + company */}
                  <div>
                    <p className="text-ink text-sm font-semibold leading-snug">
                      {s.jobTitle || '—'}
                    </p>
                    {company && (
                      <p className="text-ink-muted mt-0.5 text-xs">{company}</p>
                    )}
                  </div>

                  {/* Metadata chips: interview type, context pack, duration */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="border-border text-ink-muted rounded-md border px-2 py-0.5 text-xs font-medium">
                      {SESSION_TYPE_LABELS[s.sessionType] ?? s.sessionType}
                    </span>
                    <span className="border-border text-ink-muted rounded-md border px-2 py-0.5 text-xs">
                      {s.contextPackId}
                    </span>
                    {s.durationMin != null && (
                      <span className="border-border text-ink-muted flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {s.durationMin} phút
                      </span>
                    )}
                  </div>

                  {/* Score — completed sessions only */}
                  {s.status === 'completed' && s.overallScore != null && (
                    <ScoreDisplay score={s.overallScore} />
                  )}

                  {/* Action button */}
                  <div className="border-border mt-auto border-t pt-3">
                    {s.status === 'completed' && (
                      <Link
                        href={`/sessions/${s.id}/report`}
                        className="bg-brand shadow-btn hover:bg-brand-light block w-full rounded-full px-3 py-2 text-center text-xs font-semibold text-white transition-all"
                      >
                        Xem báo cáo
                      </Link>
                    )}
                    {s.status === 'completing' && (
                      <Link
                        href={`/sessions/${s.id}/report`}
                        className="border-brand text-brand hover:bg-brand-subtle block w-full rounded-full border px-3 py-2 text-center text-xs font-medium transition-colors"
                      >
                        Theo dõi báo cáo
                      </Link>
                    )}
                    {(s.status === 'active' ||
                      s.status === 'ready' ||
                      s.status === 'paused') && (
                      <Link
                        href={`/sessions/${s.id}`}
                        className="bg-brand shadow-btn hover:bg-brand-light block w-full rounded-full px-3 py-2 text-center text-xs font-semibold text-white transition-all"
                      >
                        {s.status === 'ready' ? 'Bắt đầu' : 'Tiếp tục'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
