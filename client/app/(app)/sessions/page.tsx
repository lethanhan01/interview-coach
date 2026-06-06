'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import type { Session } from '@/lib/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

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
          <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium capitalize text-gray-900">{s.sessionType}</p>
                <p className="text-xs text-gray-400">
                  {s.contextPackId} · {s.status}
                </p>
              </div>
              {s.status === 'completed' && (
                <Link
                  href={`/sessions/${s.id}/report`}
                  className="text-sm font-medium text-black underline underline-offset-2"
                >
                  Xem báo cáo
                </Link>
              )}
              {s.status === 'active' && (
                <Link
                  href={`/sessions/${s.id}`}
                  className="text-sm font-medium text-black underline underline-offset-2"
                >
                  Tiếp tục
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
