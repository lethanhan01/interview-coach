'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  Search,
  X,
  Briefcase,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/patterns/FeedbackPatterns'

export interface OnetAlternateTitlesTabProps {
  titles: string[]
  className?: string
}

/**
 * Helper tách và highlight từ khóa tìm kiếm trong chức danh
 */
function HighlightedTitle({ title, query }: { title: string; query: string }) {
  const clean = query.trim()
  if (!clean) return <>{title}</>

  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = title.split(new RegExp(`(${escaped})`, 'gi'))

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === clean.toLowerCase() ? (
          <mark
            key={index}
            className="bg-brand/20 text-ink rounded px-0.5 font-semibold"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export function OnetAlternateTitlesTab({
  titles,
  className,
}: OnetAlternateTitlesTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  // Filter titles based on search
  const filteredTitles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return titles
    return titles.filter((t) => t.toLowerCase().includes(q))
  }, [titles, searchQuery])

  // Reset to page 1 if query changes or total pages decreases
  const totalPages = Math.max(1, Math.ceil(filteredTitles.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  // Sliced titles for current page
  const paginatedTitles = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filteredTitles.slice(start, start + pageSize)
  }, [filteredTitles, safeCurrentPage, pageSize])

  const fromIndex = filteredTitles.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const toIndex = Math.min(safeCurrentPage * pageSize, filteredTitles.length)

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }

  const handleCopySingle = async (title: string) => {
    try {
      await navigator.clipboard.writeText(title)
      setCopiedTitle(title)
      setTimeout(() => setCopiedTitle(null), 2000)
    } catch {
      // Fallback
    }
  }

  const handleCopyAll = async () => {
    try {
      const text = filteredTitles.join('\n')
      await navigator.clipboard.writeText(text)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2500)
    } catch {
      // Fallback
    }
  }

  return (
    <div className={cn('space-y-3.5', className)}>
      {/* Top Search and Batch Copy Controls */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="text-ink-muted absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm kiếm chức danh thị trường (vd: Full Stack, Architect...)"
            className="bg-surface-inset h-9 pl-9 pr-8 text-xs sm:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="text-ink-muted hover:text-ink absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded focus-ring"
              title="Xóa từ khóa tìm kiếm"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Copy All Button */}
        {filteredTitles.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            className="h-9 gap-1.5 px-3 text-xs shrink-0 self-start sm:self-auto"
            title="Sao chép toàn bộ danh sách chức danh hiển thị"
          >
            {copiedAll ? (
              <>
                <Check className="text-success size-3.5" />
                <span className="text-success font-medium">Đã chép tất cả ({filteredTitles.length})</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Sao chép tất cả ({filteredTitles.length})</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Subheader: Range Stats and Page Size Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-xs text-ink-muted">
        <div className="flex items-center gap-1.5">
          <span>Hiển thị</span>
          <span className="font-semibold text-ink font-mono tabular-nums">
            {fromIndex} - {toIndex}
          </span>
          <span>trên tổng số</span>
          <span className="font-semibold text-ink font-mono tabular-nums">
            {filteredTitles.length}
          </span>
          <span>chức danh O*NET</span>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[11px]">Mỗi trang:</span>
          {[10, 20, 50].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => {
                setPageSize(size)
                setCurrentPage(1)
              }}
              className={cn(
                'rounded px-1.5 py-0.5 text-[11px] font-mono tabular-nums transition-colors focus-ring',
                pageSize === size
                  ? 'bg-brand text-brand-foreground font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-inset'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredTitles.length === 0 && (
        <Card className="p-8">
          <EmptyState
            icon={<Layers className="text-ink-muted size-10" />}
            title="Không tìm thấy chức danh nào"
            description={`Không có chức danh nào khớp với từ khóa "${searchQuery}".`}
            action={{
              label: 'Xóa bộ lọc tìm kiếm',
              onClick: () => handleSearchChange(''),
            }}
          />
        </Card>
      )}

      {/* 2-Column Responsive Card Grid */}
      {paginatedTitles.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 md:grid-cols-2">
          {paginatedTitles.map((title) => {
            const isCopied = copiedTitle === title

            return (
              <Card
                key={title}
                className="group pressable flex items-center justify-between gap-2.5 p-3 transition-all hover:border-brand/40 hover:bg-surface-inset/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="bg-brand/10 text-brand flex size-7 shrink-0 items-center justify-center rounded-lg">
                    <Briefcase className="size-3.5" />
                  </div>
                  <span className="text-ink text-xs sm:text-sm font-medium truncate">
                    <HighlightedTitle title={title} query={searchQuery} />
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopySingle(title)}
                  className="text-ink-muted hover:text-ink h-7 w-7 shrink-0 p-0 rounded-md"
                  title="Sao chép chức danh này"
                  aria-label={`Sao chép chức danh ${title}`}
                >
                  {isCopied ? (
                    <Check className="text-success size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-border/70">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            className="h-8 gap-1 px-2.5 text-xs"
          >
            <ChevronLeft className="size-3.5" />
            <span>Trước</span>
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span>Trang</span>
            <span className="font-semibold text-ink font-mono tabular-nums">
              {safeCurrentPage}
            </span>
            <span>/</span>
            <span className="font-mono tabular-nums">{totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="h-8 gap-1 px-2.5 text-xs"
          >
            <span>Sau</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
