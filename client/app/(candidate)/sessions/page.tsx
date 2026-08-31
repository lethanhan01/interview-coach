'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Clock } from 'lucide-react'
import { sessionService } from '@/services'

import type { Session } from '@/lib/types'
import { formatVietnamDateTime } from '@/lib/date-time'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/patterns/LayoutPatterns'
import { LoadingState, ErrorState, EmptyState } from '@/components/patterns/FeedbackPatterns'
import { cn } from '@/lib/utils'

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

const scoreVariants = {
  high: 'bg-success-subtle text-success-subtle-fg border-success-subtle-fg/30',
  medium: 'bg-warning-subtle text-warning-subtle-fg border-warning-subtle-fg/30',
  low: 'bg-danger-subtle text-danger-subtle-fg border-danger-subtle-fg/30',
} as const

function getScoreTier(pct: number): keyof typeof scoreVariants {
  if (pct >= 70) return 'high'
  if (pct >= 50) return 'medium'
  return 'low'
}

function ScoreDisplay({ score }: Readonly<{ score: number }>) {
  const pct = Math.min(100, Math.max(0, score))
  const tier = getScoreTier(pct)

  return (
    <div className={cn('rounded-xl border px-4 py-3', scoreVariants[tier])}>
      <p className="mb-1 text-xs font-medium opacity-70">Điểm tổng</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums leading-none">
          {score}
        </span>
        <span className="text-sm opacity-60">/100</span>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    sessionService
      .getSessions()
      .then((data) => {
        if (!cancelled) setSessions(data)
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
    return <LoadingState text="Đang tải danh sách phiên phỏng vấn..." minHeight="min-h-[50vh]" />
  }

  if (error) {
    return (
      <PageContainer maxWidth="xl" className="py-10">
        <ErrorState description={error} onRetry={retryLoad} />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="xl" className="space-y-8">
      <Card className="p-6">
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
          <Button asChild size="md">
            <Link href="/setup">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tạo phiên mới
            </Link>
          </Button>
        </div>
      </Card>

      {sessions.length === 0 ? (
        <EmptyState
          title="Chưa có phiên phỏng vấn nào"
          description="Dán Job Description và bắt đầu luyện tập ngay để nhận phản hồi từ AI."
          icon={<Plus className="size-12 text-brand" aria-hidden="true" />}
          action={{
            label: 'Bắt đầu phỏng vấn',
            onClick: () => router.push('/setup'),
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => {
            const company = getCompanyName(s.jobDescription)
            return (
              <Card
                key={s.id}
                hover
                className="flex h-full flex-col justify-between"
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
                    <Badge variant="default" className="font-medium">
                      {SESSION_TYPE_LABELS[s.sessionType] ?? s.sessionType}
                    </Badge>
                    <Badge variant="default">
                      {s.contextPackId}
                    </Badge>
                    {s.durationMin != null && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {s.durationMin} phút
                      </Badge>
                    )}
                  </div>

                  {/* Score — completed sessions only */}
                  {s.status === 'completed' && s.overallScore != null && (
                    <ScoreDisplay score={s.overallScore} />
                  )}

                  {/* Action button */}
                  <div className="border-border mt-auto border-t pt-3">
                    {s.status === 'completed' && (
                      <Button asChild size="sm" className="w-full">
                        <Link href={`/sessions/${s.id}/report`}>
                          Xem báo cáo
                        </Link>
                      </Button>
                    )}
                    {s.status === 'completing' && (
                      <Button asChild variant="outline" size="sm" className="w-full text-brand border-brand hover:bg-brand-subtle">
                        <Link href={`/sessions/${s.id}/report`}>
                          Theo dõi báo cáo
                        </Link>
                      </Button>
                    )}
                    {(s.status === 'active' ||
                      s.status === 'ready' ||
                      s.status === 'paused') && (
                      <Button asChild size="sm" className="w-full">
                        <Link href={`/sessions/${s.id}`}>
                          {s.status === 'ready' ? 'Bắt đầu' : 'Tiếp tục'}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
