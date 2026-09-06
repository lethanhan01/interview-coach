import React from 'react'
import { CheckCircle2, XCircle, Quote, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { BinaryCriterionResult } from '@/lib/types'

export interface BinaryCriteriaChecklistProps {
  criteria?: BinaryCriterionResult[]
  className?: string
}

export function BinaryCriteriaChecklist({
  criteria = [],
  className,
}: BinaryCriteriaChecklistProps) {
  if (!criteria || criteria.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <h5 className="text-ink text-xs font-bold uppercase tracking-wider">
          Tiêu Chí Đánh Giá Nhị Phân (Binary Criteria)
        </h5>
        <span className="text-ink-muted text-xs tabular-nums">
          Đạt {criteria.filter((c) => c.passed).length}/{criteria.length} tiêu chí
        </span>
      </div>

      <div className="border-border/60 divide-border/60 divide-y rounded-xl border">
        {criteria.map((criterion, idx) => {
          const isCore = criterion.dimension === 'core'
          const isSeniority = criterion.dimension === 'seniority'

          return (
            <div
              key={criterion.criteriaId || `crit-${idx}`}
              className={cn(
                'flex flex-col gap-2.5 p-3.5 transition-colors',
                criterion.passed
                  ? 'bg-surface hover:bg-surface-raised/40'
                  : 'bg-surface-raised/30 hover:bg-surface-raised/60'
              )}
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {criterion.passed ? (
                    <CheckCircle2
                      className="size-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      className="size-4 shrink-0 text-danger"
                      aria-hidden="true"
                    />
                  )}

                  {/* Dimension badge */}
                  {isCore && (
                    <Badge variant="outline" className="text-[11px] font-medium">
                      Cốt lõi (Core)
                    </Badge>
                  )}
                  {isSeniority && (
                    <Badge variant="brand" className="text-[11px] font-medium">
                      Thâm niên (Seniority)
                    </Badge>
                  )}
                  {!isCore && !isSeniority && (
                    <Badge variant="secondary" className="text-[11px]">
                      Tiêu chí
                    </Badge>
                  )}

                  <span className="text-ink text-xs font-semibold">
                    {criterion.criteriaText || criterion.criteriaId}
                  </span>
                </div>

                {/* Status badge */}
                <Badge
                  variant={criterion.passed ? 'success' : 'danger'}
                  className="px-2 py-0 text-[11px] font-medium"
                >
                  {criterion.passed ? 'Đạt' : 'Không đạt'}
                </Badge>
              </div>

              {/* Evidence box */}
              {criterion.evidence && (
                <div className="bg-surface-inset text-ink border-border/40 flex flex-col gap-1 rounded-lg border p-2.5 text-xs">
                  <div className="text-ink-muted flex items-center gap-1 text-[11px] font-medium">
                    <Quote className="size-3" aria-hidden="true" />
                    <span>Bằng chứng ghi nhận:</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line pl-4 italic">
                    &ldquo;{criterion.evidence}&rdquo;
                  </p>
                </div>
              )}

              {/* Deduction reason box (if failed) */}
              {!criterion.passed && criterion.deductionReason && (
                <div className="bg-danger-subtle/30 border-danger text-ink rounded-r-lg border-l-2 p-2.5 text-xs">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-danger">
                    <AlertCircle className="size-3" aria-hidden="true" />
                    <span>Lý do chưa đạt:</span>
                  </div>
                  <p className="text-ink mt-0.5 leading-relaxed">
                    {criterion.deductionReason}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
