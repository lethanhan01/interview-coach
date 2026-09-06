import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge, type BadgeProps } from '@/components/ui/Badge'
import { Compass, Clock, BookOpen, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActionPlanItem } from '@/lib/types'

export interface ActionPlanTimelineProps {
  actionPlan?:
    | {
        items?: string[]
        actionPlan?: ActionPlanItem[]
      }
    | ActionPlanItem[]
    | string[]
    | null
  className?: string
}

const PRIORITY_CONFIG: Record<
  ActionPlanItem['priority'],
  {
    label: string
    variant: NonNullable<BadgeProps['variant']>
    borderClass: string
  }
> = {
  high: {
    label: 'Ưu tiên cao',
    variant: 'danger',
    borderClass: 'border-l-danger',
  },
  medium: {
    label: 'Ưu tiên trung bình',
    variant: 'warning',
    borderClass: 'border-l-warning',
  },
  low: {
    label: 'Ưu tiên thấp',
    variant: 'brand',
    borderClass: 'border-l-brand',
  },
}

export function ActionPlanTimeline({
  actionPlan,
  className,
}: ActionPlanTimelineProps) {
  if (!actionPlan) {
    return null
  }

  // Extract structured items or legacy text items
  let structuredItems: ActionPlanItem[] = []
  let legacyItems: string[] = []

  if (Array.isArray(actionPlan)) {
    if (actionPlan.length > 0 && typeof actionPlan[0] === 'string') {
      legacyItems = actionPlan as string[]
    } else {
      structuredItems = actionPlan as ActionPlanItem[]
    }
  } else if (typeof actionPlan === 'object') {
    if (actionPlan.actionPlan && Array.isArray(actionPlan.actionPlan)) {
      structuredItems = actionPlan.actionPlan
    } else if (actionPlan.items && Array.isArray(actionPlan.items)) {
      legacyItems = actionPlan.items
    }
  }

  if (structuredItems.length === 0 && legacyItems.length === 0) {
    return null
  }

  const totalEstimatedWeeks = structuredItems.reduce(
    (sum, item) => sum + (item.estimatedWeeks || 0),
    0
  )

  return (
    <Card className={cn('flex flex-col gap-6', className)}>
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-subtle text-brand-subtle-fg flex size-9 items-center justify-center rounded-lg">
              <Compass className="size-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Kế Hoạch Hành Động & Lộ Trình Ôn Tập (Action Plan)
              </CardTitle>
              <p className="text-ink-muted text-xs">
                Lộ trình phát triển kỹ năng được cá nhân hóa dựa trên kết quả phỏng
                vấn
              </p>
            </div>
          </div>

          {totalEstimatedWeeks > 0 && (
            <Badge variant="secondary" className="gap-1.5 py-1 text-xs">
              <Clock className="size-3.5 text-brand" aria-hidden="true" />
              Tổng thời gian ước tính:{' '}
              <strong className="text-ink tabular-nums">
                ~{totalEstimatedWeeks} tuần
              </strong>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="py-0">
        {/* Structured Timeline Cards */}
        {structuredItems.length > 0 && (
          <div className="flex flex-col gap-4">
            {structuredItems.map((item, index) => {
              const priority = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium

              return (
                <div
                  key={`${item.skillCode}-${index}`}
                  className={cn(
                    'bg-surface-raised/40 hover:bg-surface-raised/80 border-border/70 flex flex-col gap-3 rounded-xl border border-l-4 p-4 transition-colors',
                    priority.borderClass
                  )}
                >
                  {/* Top metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={priority.variant}
                        className="text-xs font-semibold"
                      >
                        {priority.label}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.skillCode}
                      </Badge>
                    </div>

                    <div className="text-ink-muted flex items-center gap-1 text-xs">
                      <Clock className="size-3.5" aria-hidden="true" />
                      <span>Thời gian:</span>
                      <strong className="text-ink tabular-nums font-semibold">
                        {item.estimatedWeeks} tuần
                      </strong>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-ink text-sm font-bold leading-snug">
                    {item.title}
                  </h4>

                  {/* Focus Topics */}
                  {item.topics && item.topics.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-ink-muted text-[11px] font-medium uppercase tracking-wider">
                        Chủ đề trọng tâm cần củng cố:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.topics.map((topic) => (
                          <span
                            key={topic}
                            className="bg-surface border-border/70 text-ink inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-2xs"
                          >
                            <BookOpen
                              className="size-3 text-brand shrink-0"
                              aria-hidden="true"
                            />
                            <span>{topic}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Legacy String Items Fallback */}
        {legacyItems.length > 0 && structuredItems.length === 0 && (
          <div className="border-border/60 divide-border/60 divide-y rounded-xl border">
            {legacyItems.map((item, index) => (
              <div
                key={index}
                className="hover:bg-surface-raised/40 flex items-start gap-3 p-3.5 text-xs transition-colors"
              >
                <CheckCircle2
                  className="size-4 shrink-0 text-brand mt-0.5"
                  aria-hidden="true"
                />
                <span className="text-ink leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
