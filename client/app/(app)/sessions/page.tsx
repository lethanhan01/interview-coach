'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import type { Session } from '@/lib/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const SESSION_TYPE_LABELS: Record<string, string> = {
  hr: 'HR / Behavioral',
  technical: 'Technical',
  mixed: 'Mixed',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang phỏng vấn',
  completed: 'Hoàn thành',
  generating: 'Đang tạo...',
  error: 'Lỗi',
}

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  generating: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-red-700',
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
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-red-600">{error}</div>
    )
  }

  if (!sessions.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-base font-medium text-gray-900">Chưa có phiên phỏng vấn nào</p>
        <p className="max-w-sm text-sm text-gray-500">
          Dán Job Description và bắt đầu luyện tập ngay để nhận phản hồi từ AI.
        </p>
        <Link
          href="/setup"
          className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Bắt đầu phỏng vấn
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Lịch sử phỏng vấn</h1>
        <Link
          href="/setup"
          className="rounded-md bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Phỏng vấn mới
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-gray-900">
                  {SESSION_TYPE_LABELS[s.sessionType] ?? s.sessionType}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_CLASSES[s.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  {s.contextPackId && (
                    <span className="text-xs text-gray-400">{s.contextPackId}</span>
                  )}
                  {s.createdAt && (
                    <span className="text-xs text-gray-400">{formatDate(s.createdAt)}</span>
                  )}
                </div>
                {s.status === 'completed' && s.overallScore != null && (
                  <p className="text-xs text-gray-500">
                    Điểm tổng:{' '}
                    <span className="font-semibold text-gray-900">{s.overallScore}/10</span>
                  </p>
                )}
              </div>

              <div className="flex-shrink-0">
                {s.status === 'completed' && (
                  <Link
                    href={`/sessions/${s.id}/report`}
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Xem báo cáo
                  </Link>
                )}
                {s.status === 'active' && (
                  <Link
                    href={`/sessions/${s.id}`}
                    className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                  >
                    Tiếp tục
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
