'use client'

import { Building2, MapPin, Clock, Plus, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { SavedJobDescription } from '@/lib/types'
import { getJdLevelLabel } from '@/lib/interview-options'
import { formatVietnamRelativeDate } from '@/lib/date-time'

interface Props {
  items: SavedJobDescription[]
  onSelect: (item: SavedJobDescription) => void
  onNew: () => void
}

const MAX_TECH_SHOWN = 4

export default function SavedJdPicker({ items, onSelect, onNew }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-ink text-xl font-semibold">Chọn Job Description</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Tái sử dụng JD từ phiên phỏng vấn trước hoặc tạo JD mới.
        </p>
      </div>

      {/* New JD button */}
      <button
        type="button"
        onClick={onNew}
        className="border-brand-subtle-border bg-brand-subtle/50 hover:border-brand hover:bg-brand-subtle group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed p-5 text-left transition-all duration-150"
      >
        <div className="bg-brand shadow-btn flex size-10 shrink-0 items-center justify-center rounded-full text-white transition-transform duration-150 group-hover:scale-110">
          <Plus className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-brand text-sm font-semibold">Thêm JD mới</p>
          <p className="text-ink-muted text-xs">
            Điền thông tin Job Description từ đầu
          </p>
        </div>
        <ChevronRight className="text-brand ml-auto size-4 opacity-60 transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-ink-faint text-xs font-medium">
          JD đã lưu ({items.length})
        </span>
        <div className="bg-border h-px flex-1" />
      </div>

      {/* Saved JD cards */}
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
              onClick={() => onSelect(item)}
              className="border-border bg-surface shadow-card hover:border-brand/40 hover:shadow-glow group w-full rounded-2xl border p-5 text-left transition-all duration-150 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: company + position */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="bg-brand-subtle text-brand-subtle-fg flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Building2 className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-ink truncate text-sm font-semibold">
                        {item.companyName}
                      </p>
                      <p className="text-ink-muted truncate text-xs">
                        {item.jobTitle}
                      </p>
                    </div>
                  </div>

                  {/* Meta: location + date */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {item.level && (
                      <span className="text-brand text-xs font-medium">
                        {getJdLevelLabel(item.level)}
                      </span>
                    )}
                    {item.location && (
                      <span className="text-ink-faint flex items-center gap-1 text-xs">
                        <MapPin className="size-3" aria-hidden="true" />
                        {item.location}
                      </span>
                    )}
                    <span className="text-ink-faint flex items-center gap-1 text-xs">
                      <Clock className="size-3" aria-hidden="true" />
                      {displayDate}
                    </span>
                  </div>

                  {/* Tech stack badges */}
                  {item.techStack.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {shownTechs.map((tech) => (
                        <Badge
                          key={tech}
                          variant="brand"
                          className="text-xs"
                        >
                          {tech}
                        </Badge>
                      ))}
                      {extraCount > 0 && (
                        <Badge variant="default" className="text-xs">
                          +{extraCount}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: arrow */}
                <ChevronRight className="text-ink-faint group-hover:text-brand mt-1 size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
