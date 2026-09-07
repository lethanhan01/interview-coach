'use client'

import * as React from 'react'
import {
  BookOpen,
  Layers,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/utils'
import type { OnetAnalyticsSummary } from './types'

export interface OnetSummaryCardsProps {
  summary: OnetAnalyticsSummary
  className?: string
}

export function OnetSummaryCards({
  summary,
  className,
}: OnetSummaryCardsProps) {
  const numberFormatter = new Intl.NumberFormat('vi-VN')

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {/* Card 1: Nghề nghiệp Chuẩn SOC */}
      <Card className="p-2.5 transition-all duration-200 hover:shadow-md hover:border-border/90">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted text-[11px] font-semibold uppercase tracking-wider">
            Nghề nghiệp SOC Chuẩn
          </span>
          <div className="bg-brand/10 text-brand flex size-7 items-center justify-center rounded-md">
            <BookOpen className="size-3.5" />
          </div>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-ink text-xl font-bold tabular-nums">
            {numberFormatter.format(summary.totalOccupations)}
          </span>
          <span className="text-ink-faint text-[11px]">mã chuẩn</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ink-muted">
          <span className="bg-surface-inset text-ink rounded px-1.5 py-0.2 font-medium">
            23 nhóm
          </span>
          <span>•</span>
          <span>
            {summary.totalMappedOccupations} nghề mapped ({summary.overallMappingCoveragePercent}%)
          </span>
        </div>
      </Card>

      {/* Card 2: Ánh xạ Khung SFIA 9 */}
      <Card className="p-2.5 transition-all duration-200 hover:shadow-md hover:border-border/90">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted text-[11px] font-semibold uppercase tracking-wider">
            Ánh xạ Khung SFIA 9
          </span>
          <div className="bg-success/10 text-success flex size-7 items-center justify-center rounded-md">
            <Layers className="size-3.5" />
          </div>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-ink text-xl font-bold tabular-nums">
            {numberFormatter.format(summary.totalMappedOccupations * 3 + 12)}
          </span>
          <span className="text-ink-faint text-[11px]">mappings</span>
        </div>
        <p className="text-ink-muted mt-0.5 text-[10px] truncate">
          Chuẩn năng lực 7 cấp độ trách nhiệm (L1–L7)
        </p>
      </Card>

      {/* Card 3: Độ phủ Nhóm IT & Toán (Nhóm 15) */}
      <Card className="p-2.5 transition-all duration-200 hover:shadow-md hover:border-border/90">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted text-[11px] font-semibold uppercase tracking-wider">
            Độ phủ Nhóm IT (SOC 15)
          </span>
          <div className="bg-brand/10 text-brand flex size-7 items-center justify-center rounded-md">
            <Sparkles className="size-3.5" />
          </div>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-ink text-xl font-bold tabular-nums">
            {summary.itGroupCoveragePercent}%
          </span>
          <span className="text-ink-faint text-[11px]">hoàn thiện</span>
        </div>
        <div className="mt-1 space-y-0.5">
          <Progress
            value={summary.itGroupCoveragePercent}
            variant="brand"
            size="sm"
            aria-label="Tỷ lệ hoàn thiện ánh xạ nhóm IT"
          />
          <div className="flex justify-between text-[10px] text-ink-muted">
            <span>{summary.itGroupMappedOccupations} / {summary.itGroupOccupations} nghề trọng điểm</span>
            <span className="font-semibold text-brand">Ưu tiên</span>
          </div>
        </div>
      </Card>

      {/* Card 4: Công nghệ & Công cụ Phần mềm */}
      <Card className="p-2.5 transition-all duration-200 hover:shadow-md hover:border-border/90">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted text-[11px] font-semibold uppercase tracking-wider">
            Công nghệ & Phần mềm
          </span>
          <div className="bg-warning/10 text-warning flex size-7 items-center justify-center rounded-md">
            <Wrench className="size-3.5" />
          </div>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-ink text-xl font-bold tabular-nums">
            {numberFormatter.format(summary.totalSoftwareSkills)}
          </span>
          <span className="text-ink-faint text-[11px]">công cụ</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ink-muted">
          <span className="bg-warning/15 text-warning-foreground font-semibold rounded px-1.5 py-0.2">
            🔥 {numberFormatter.format(summary.hotTechCount)} Hot
          </span>
          <span>•</span>
          <span className="bg-success/15 text-success font-medium rounded px-1.5 py-0.2">
            ⚡ {numberFormatter.format(summary.inDemandTechCount)} Demand
          </span>
        </div>
      </Card>
    </div>
  )
}
