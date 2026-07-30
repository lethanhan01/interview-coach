'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import type { SavedJobDescription } from '@/lib/types'
import { formatVietnamRelativeDate } from '@/lib/date-time'
import { Building2, MapPin, Clock, Plus, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

const MAX_TECH_SHOWN = 5

export default function JdLibraryPage() {
  const router = useRouter()
  const [items, setItems] = useState<SavedJobDescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get<{ items: SavedJobDescription[] }>('/saved-job-descriptions')
      .then((data) => setItems(data.items ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải danh sách'))
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(item: SavedJobDescription) {
    // Navigate to setup with the selected JD pre-filled via query param
    router.push(`/setup?jdId=${item.id}`)
  }

  function handleNew() {
    router.push('/setup?new=1')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <p className="text-sm text-danger">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Job Descriptions</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {items.length > 0
              ? `${items.length} JD đã lưu — chọn để bắt đầu phỏng vấn`
              : 'Chưa có JD nào được lưu'}
          </p>
        </div>
        <Button onClick={handleNew} size="md">
          <Plus className="size-4" aria-hidden="true" />
          Tạo phiên mới
        </Button>
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand">
            <Building2 className="size-7" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-ink">Chưa có Job Description nào</p>
            <p className="mt-1 text-sm text-ink-muted">
              Tạo phiên phỏng vấn đầu tiên để bắt đầu lưu JD
            </p>
          </div>
          <Button onClick={handleNew} variant="secondary">
            <Plus className="size-4" aria-hidden="true" />
            Tạo phiên mới
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const displayDate = item.lastUsedAt
              ? `Dùng lần cuối ${formatVietnamRelativeDate(item.lastUsedAt)}`
              : `Tạo ${formatVietnamRelativeDate(item.createdAt)}`
            const shownTechs = item.techStack.slice(0, MAX_TECH_SHOWN)
            const extraCount = item.techStack.length - MAX_TECH_SHOWN

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="group w-full rounded-2xl border border-border bg-surface p-5 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-glow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Company + position */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
                        <Building2 className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{item.companyName}</p>
                        <p className="truncate text-sm text-ink-muted">{item.jobTitle}</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      {item.location && (
                        <span className="flex items-center gap-1 text-xs text-ink-faint">
                          <MapPin className="size-3" aria-hidden="true" />
                          {item.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-ink-faint">
                        <Clock className="size-3" aria-hidden="true" />
                        {displayDate}
                      </span>
                      {item.salary && (
                        <span className="text-xs font-medium text-success">{item.salary}</span>
                      )}
                    </div>

                    {/* Tech stack */}
                    {item.techStack.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {shownTechs.map((tech) => (
                          <Badge key={tech} variant="brand" className="text-[11px]">
                            {tech}
                          </Badge>
                        ))}
                        {extraCount > 0 && (
                          <Badge variant="default" className="text-[11px]">
                            +{extraCount}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="mt-1 size-5 shrink-0 text-ink-faint transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-brand" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
