'use client'

import { Building2, MapPin, Clock, Plus, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { SavedJobDescription } from '@/lib/types'
import { getJdLevelLabel } from '@/lib/interview-options'

interface Props {
  items: SavedJobDescription[]
  onSelect: (item: SavedJobDescription) => void
  onNew: () => void
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`
  return `${Math.floor(diffDays / 365)} năm trước`
}

const MAX_TECH_SHOWN = 4

export default function SavedJdPicker({ items, onSelect, onNew }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-ink">Chọn Job Description</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Tái sử dụng JD từ phiên phỏng vấn trước hoặc tạo JD mới.
        </p>
      </div>

      {/* New JD button */}
      <button
        type="button"
        onClick={onNew}
        className="group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-5 text-left transition-all duration-150 hover:border-brand hover:bg-brand-50"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-btn transition-transform duration-150 group-hover:scale-110">
          <Plus className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand">Thêm JD mới</p>
          <p className="text-xs text-ink-muted">Điền thông tin Job Description từ đầu</p>
        </div>
        <ChevronRight className="ml-auto size-4 text-brand opacity-60 transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-ink-faint">JD đã lưu ({items.length})</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Saved JD cards */}
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const displayDate = item.lastUsedAt
            ? `Dùng lần cuối ${formatRelativeDate(item.lastUsedAt)}`
            : `Tạo ${formatRelativeDate(item.createdAt)}`

          const shownTechs = item.techStack.slice(0, MAX_TECH_SHOWN)
          const extraCount = item.techStack.length - MAX_TECH_SHOWN

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="group w-full rounded-2xl border border-border bg-surface p-5 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-glow"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: company + position */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">
                      <Building2 className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{item.companyName}</p>
                      <p className="truncate text-xs text-ink-muted">{item.jobTitle}</p>
                    </div>
                  </div>

                  {/* Meta: location + date */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {item.level && (
                      <span className="text-xs font-medium text-brand">
                        {getJdLevelLabel(item.level)}
                      </span>
                    )}
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
                  </div>

                  {/* Tech stack badges */}
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

                {/* Right: arrow */}
                <ChevronRight className="mt-1 size-4 shrink-0 text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
