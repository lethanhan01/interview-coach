'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  Search,
  X,
  Star,
  ListChecks,
  Copy,
  Check,
  FileCheck2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/patterns/FeedbackPatterns'
import type { OnetTaskStatement } from './types'

export interface OnetTasksTabProps {
  tasks: OnetTaskStatement[]
  className?: string
}

/**
 * Helper tách và highlight từ khóa tìm kiếm trong chuỗi văn bản
 */
function HighlightedText({ text, query }: { text: string; query: string }) {
  const clean = query.trim()
  if (!clean) return <>{text}</>

  // Escape special regex characters
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === clean.toLowerCase() ? (
          <mark
            key={index}
            className="bg-brand/20 text-ink rounded px-0.5 font-medium"
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

export function OnetTasksTab({ tasks, className }: OnetTasksTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null)

  // Split tasks into Core and Supplemental
  const { coreTasks, supplementalTasks } = useMemo(() => {
    const core: OnetTaskStatement[] = []
    const supplemental: OnetTaskStatement[] = []

    for (const t of tasks) {
      if (t.isCore) {
        core.push(t)
      } else {
        supplemental.push(t)
      }
    }

    return { coreTasks: core, supplementalTasks: supplemental }
  }, [tasks])

  // Filter tasks based on search
  const q = searchQuery.trim().toLowerCase()

  const filteredCore = useMemo(() => {
    if (!q) return coreTasks
    return coreTasks.filter((t) => t.statement.toLowerCase().includes(q))
  }, [coreTasks, q])

  const filteredSupplemental = useMemo(() => {
    if (!q) return supplementalTasks
    return supplementalTasks.filter((t) => t.statement.toLowerCase().includes(q))
  }, [supplementalTasks, q])

  const totalFilteredCount = filteredCore.length + filteredSupplemental.length

  const handleCopyTask = async (task: OnetTaskStatement) => {
    try {
      await navigator.clipboard.writeText(task.statement)
      setCopiedTaskId(task.id)
      setTimeout(() => setCopiedTaskId(null), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="text-ink-muted absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nội dung nhiệm vụ công việc..."
            className="bg-surface-inset h-9 pl-9 pr-8 text-xs sm:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-ink-muted hover:text-ink absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded focus-ring"
              title="Xóa từ khóa tìm kiếm"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-ink-muted flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <span>Hiển thị</span>
          <span className="font-semibold text-ink tabular-nums">
            {totalFilteredCount}
          </span>
          <span>/</span>
          <span className="font-mono tabular-nums">{tasks.length}</span>
          <span>nhiệm vụ</span>
        </div>
      </div>

      {/* Empty State when no tasks match */}
      {totalFilteredCount === 0 && (
        <Card className="p-8">
          <EmptyState
            icon={<FileCheck2 className="text-ink-muted size-10" />}
            title="Không tìm thấy nhiệm vụ nào"
            description={`Không có nhiệm vụ nào chứa từ khóa "${searchQuery}".`}
            action={{
              label: 'Xóa bộ lọc tìm kiếm',
              onClick: () => setSearchQuery(''),
            }}
          />
        </Card>
      )}

      {/* Section 1: Core Tasks */}
      {filteredCore.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500/20 size-4" />
              <h3 className="text-ink text-xs sm:text-sm font-bold tracking-tight">
                Nhiệm vụ Cốt lõi (Core Tasks)
              </h3>
            </div>
            <Badge variant="outline" className="border-brand/40 text-brand text-[11px] font-mono tabular-nums">
              {q ? `${filteredCore.length} / ${coreTasks.length}` : `${coreTasks.length}`} nhiệm vụ
            </Badge>
          </div>

          <div className="space-y-2">
            {filteredCore.map((task, index) => {
              const isCopied = copiedTaskId === task.id

              return (
                <Card
                  key={task.id}
                  className="group relative border-l-4 border-l-brand/80 p-3 transition-colors hover:border-brand hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="bg-brand/10 text-brand flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold tabular-nums">
                        {index + 1}
                      </span>
                      <p className="text-ink/90 text-xs sm:text-sm leading-relaxed">
                        <HighlightedText text={task.statement} query={searchQuery} />
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyTask(task)}
                      className="text-ink-muted hover:text-ink -mr-1 -mt-1 h-7 w-7 shrink-0 p-0"
                      title="Sao chép câu nhiệm vụ"
                      aria-label="Sao chép câu nhiệm vụ"
                    >
                      {isCopied ? (
                        <Check className="text-success size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Section 2: Supplemental Tasks */}
      {filteredSupplemental.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="text-ink-muted size-4" />
              <h3 className="text-ink text-xs sm:text-sm font-bold tracking-tight">
                Nhiệm vụ Bổ trợ (Supplemental Tasks)
              </h3>
            </div>
            <Badge variant="secondary" className="text-[11px] font-mono tabular-nums">
              {q
                ? `${filteredSupplemental.length} / ${supplementalTasks.length}`
                : `${supplementalTasks.length}`}{' '}
              nhiệm vụ
            </Badge>
          </div>

          <div className="space-y-2">
            {filteredSupplemental.map((task, index) => {
              const isCopied = copiedTaskId === task.id

              return (
                <Card
                  key={task.id}
                  className="group relative border-l-4 border-l-border p-3 transition-colors hover:border-ink-muted/40 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="bg-surface-inset text-ink-muted flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-medium tabular-nums">
                        {index + 1}
                      </span>
                      <p className="text-ink/80 text-xs sm:text-sm leading-relaxed">
                        <HighlightedText text={task.statement} query={searchQuery} />
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyTask(task)}
                      className="text-ink-muted hover:text-ink -mr-1 -mt-1 h-7 w-7 shrink-0 p-0"
                      title="Sao chép câu nhiệm vụ"
                      aria-label="Sao chép câu nhiệm vụ"
                    >
                      {isCopied ? (
                        <Check className="text-success size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
