'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  Wrench,
  Sparkles,
  FileCheck2,
  Layers,
  GraduationCap,
  Briefcase,
  Clock,
  Copy,
  Check,
  ArrowRight,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type {
  OnetOccupationDetail,
  OnetDetailSubTab,
} from './types'

export interface OnetOverviewTabProps {
  detail: OnetOccupationDetail
  onSelectDetailTab: (tab: OnetDetailSubTab) => void
  className?: string
}

const JOB_ZONE_LABELS = [
  '1: Ít / Không cần chuẩn bị',
  '2: Chuẩn bị cơ bản',
  '3: Chuẩn bị trung bình',
  '4: Chuẩn bị đáng kể',
  '5: Chuẩn bị chuyên sâu',
]

export function OnetOverviewTab({
  detail,
  onSelectDetailTab,
  className,
}: OnetOverviewTabProps) {
  const [copiedDesc, setCopiedDesc] = useState(false)

  const handleCopyDescription = async () => {
    try {
      await navigator.clipboard.writeText(detail.description)
      setCopiedDesc(true)
      setTimeout(() => setCopiedDesc(false), 2000)
    } catch {
      // Clipboard fallback
    }
  }

  return (
    <div className={cn('space-y-3.5', className)}>
      {/* 4 Interactive KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* Tool Count Card */}
        <Card
          onClick={() => onSelectDetailTab('tech')}
          className="group pressable cursor-pointer p-3 transition-all hover:border-brand/50 hover:shadow-elevation-2"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectDetailTab('tech')
            }
          }}
          aria-label="Xem kỹ năng phần mềm của nghề này"
        >
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              Công nghệ
            </span>
            <Wrench className="text-brand size-3.5 transition-transform group-hover:scale-110" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-ink text-xl font-bold tabular-nums">
                {detail.stats.toolCount}
              </span>
              <span className="text-ink-faint text-xs">tools</span>
            </div>
            <ArrowRight className="text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 size-3" />
          </div>
        </Card>

        {/* SFIA Count Card */}
        <Card
          onClick={() => onSelectDetailTab('sfia')}
          className="group pressable cursor-pointer p-3 transition-all hover:border-success/50 hover:shadow-elevation-2"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectDetailTab('sfia')
            }
          }}
          aria-label="Xem ánh xạ SFIA của nghề này"
        >
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              SFIA 9
            </span>
            <Sparkles className="text-success size-3.5 transition-transform group-hover:scale-110" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-ink text-xl font-bold tabular-nums">
                {detail.stats.mappingCount}
              </span>
              <span className="text-ink-faint text-xs">kỹ năng</span>
            </div>
            <ArrowRight className="text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 size-3" />
          </div>
        </Card>

        {/* Tasks Count Card */}
        <Card
          onClick={() => onSelectDetailTab('tasks')}
          className="group pressable cursor-pointer p-3 transition-all hover:border-brand/50 hover:shadow-elevation-2"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectDetailTab('tasks')
            }
          }}
          aria-label="Xem danh sách nhiệm vụ công việc của nghề này"
        >
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              Nhiệm vụ
            </span>
            <FileCheck2 className="text-brand size-3.5 transition-transform group-hover:scale-110" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-ink text-xl font-bold tabular-nums">
                {detail.stats.taskCount}
              </span>
              <span className="text-ink-faint text-xs">tasks</span>
            </div>
            <ArrowRight className="text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 size-3" />
          </div>
        </Card>

        {/* Alternate Titles Count Card */}
        <Card
          onClick={() => onSelectDetailTab('titles')}
          className="group pressable cursor-pointer p-3 transition-all hover:border-brand/50 hover:shadow-elevation-2"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectDetailTab('titles')
            }
          }}
          aria-label="Xem danh sách chức danh thị trường của nghề này"
        >
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              Chức danh
            </span>
            <Layers className="text-ink-muted size-3.5 transition-transform group-hover:scale-110" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-ink text-xl font-bold tabular-nums">
                {detail.stats.alternateTitleCount}
              </span>
              <span className="text-ink-faint text-xs">titles</span>
            </div>
            <ArrowRight className="text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 size-3" />
          </div>
        </Card>
      </div>

      {/* Role Description Card */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between border-b pb-2.5">
          <h2 className="text-ink text-xs font-semibold uppercase tracking-wider">
            Mô tả Vai trò Nghề nghiệp (O*NET Content Model)
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyDescription}
            className="h-7 gap-1.5 px-2 text-xs text-ink-muted hover:text-ink"
            aria-label="Sao chép mô tả vai trò nghề nghiệp"
          >
            {copiedDesc ? (
              <>
                <Check className="text-success size-3" />
                <span className="text-success text-[11px]">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span className="text-[11px]">Sao chép</span>
              </>
            )}
          </Button>
        </div>
        <p className="text-ink/90 mt-2.5 text-xs sm:text-sm leading-relaxed">
          {detail.description}
        </p>
      </Card>

      {/* Job Zone Card with 5-Step Visual Stepper */}
      <Card className="p-3.5 sm:p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-brand size-4" />
            <h2 className="text-ink text-xs sm:text-sm font-semibold">
              Job Zone {detail.jobZone.zone}: {detail.jobZone.name}
            </h2>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono tabular-nums">
            Cấp độ {detail.jobZone.zone} / 5
          </Badge>
        </div>

        {/* 5-Step Visual Gauge Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-ink-muted">
            <span>Mức độ đào tạo & yêu cầu kinh nghiệm</span>
            <span className="font-semibold text-brand">
              {JOB_ZONE_LABELS[detail.jobZone.zone - 1]}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((step) => {
              const isActive = step <= detail.jobZone.zone
              const isCurrent = step === detail.jobZone.zone

              return (
                <div key={step} className="flex flex-col gap-1">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all',
                      isActive
                        ? isCurrent
                          ? 'bg-brand ring-2 ring-brand/30'
                          : 'bg-brand/70'
                        : 'bg-surface-inset border border-border/80'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px] text-center font-mono tabular-nums',
                      isCurrent
                        ? 'font-bold text-brand'
                        : isActive
                          ? 'text-ink-muted'
                          : 'text-ink-faint'
                    )}
                  >
                    Zone {step}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 3 Job Zone Specific Requirements */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1 border-t border-border/60">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-ink-muted text-[11px]">
              <GraduationCap className="size-3" />
              <span>Trình độ học vấn</span>
            </div>
            <p className="text-ink text-xs font-medium leading-normal">
              {detail.jobZone.education}
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-ink-muted text-[11px]">
              <Briefcase className="size-3" />
              <span>Kinh nghiệm yêu cầu</span>
            </div>
            <p className="text-ink text-xs font-medium leading-normal">
              {detail.jobZone.experience}
            </p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-ink-muted text-[11px]">
              <Clock className="size-3" />
              <span>Đào tạo tại chỗ</span>
            </div>
            <p className="text-ink text-xs font-medium leading-normal">
              {detail.jobZone.jobTraining}
            </p>
          </div>
        </div>
      </Card>

      {/* Integration Note Banner */}
      <div className="border-brand/30 bg-brand/5 flex items-start gap-2.5 rounded-xl border p-3">
        <Info className="text-brand mt-0.5 size-4 shrink-0" />
        <div className="space-y-0.5 text-xs leading-relaxed">
          <p className="text-brand font-semibold text-[11px]">
            Chuẩn hóa Đánh giá Phỏng vấn AI
          </p>
          <p className="text-ink-muted text-[11px]">
            Dữ liệu O*NET được AI Interview Coach đối chiếu để phân tích JD thực tế, tự động sinh ngân hàng câu hỏi tình huống phù hợp với cấp độ Job Zone {detail.jobZone.zone}, và đánh giá năng lực ứng viên theo các kỹ năng SFIA đã ánh xạ.
          </p>
        </div>
      </div>
    </div>
  )
}
