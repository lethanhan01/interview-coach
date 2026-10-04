'use client'

import * as React from 'react'
import {
  BarChart3,
  BookOpen,
  Layers,
  Wrench,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface OnetAnalyticsPlaceholderProps {
  onSwitchToExplorer: () => void
  className?: string
}

export function OnetAnalyticsPlaceholder({
  onSwitchToExplorer,
  className,
}: OnetAnalyticsPlaceholderProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-y-auto space-y-3 p-1 sm:p-2 text-card-foreground',
        className
      )}
    >
      {/* Analytics Banner */}
      <Card className="border-brand/30 bg-surface-raised p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-brand/10 text-brand rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
                Thống kê & Báo cáo
              </span>
              <span className="bg-success/10 text-success rounded-full px-2 py-0.5 text-[11px] font-medium">
                Phase 4 Roadmap
              </span>
            </div>
            <h2 className="text-ink text-lg sm:text-xl font-bold tracking-tight">
              Phân tích Dữ liệu Chuẩn O*NET & SFIA 9
            </h2>
            <p className="text-ink-muted text-xs leading-relaxed max-w-3xl">
              Theo dõi độ bao phủ của 23 nhóm ngành SOC, tỷ lệ gán nhãn khung năng lực SFIA 9, và các xu hướng công nghệ nóng (Hot Tech) được ứng dụng trong các bài mock interview.
            </p>
          </div>

          <Button
            size="sm"
            onClick={onSwitchToExplorer}
            className="shrink-0 gap-1.5 text-xs font-semibold whitespace-nowrap"
          >
            <span>Khám phá Nghề nghiệp</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </Card>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              Nghề nghiệp SOC
            </span>
            <div className="bg-brand/10 text-brand flex size-8 items-center justify-center rounded-lg">
              <BookOpen className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-ink text-2xl font-bold tabular-nums">1.016</span>
            <span className="text-ink-faint text-xs">mã chuẩn</span>
          </div>
          <p className="text-ink-muted mt-0.5 text-[11px]">
            Phân bổ trên 23 nhóm ngành lớn
          </p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              Nhóm ngành lớn
            </span>
            <div className="bg-success/10 text-success flex size-8 items-center justify-center rounded-lg">
              <Layers className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-ink text-2xl font-bold tabular-nums">23</span>
            <span className="text-ink-faint text-xs">Major Groups</span>
          </div>
          <p className="text-ink-muted mt-0.5 text-[11px]">
            Nhóm 15 (IT & Toán) làm trọng tâm
          </p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              Công nghệ & Phần mềm
            </span>
            <div className="bg-warning/10 text-warning flex size-8 items-center justify-center rounded-lg">
              <Wrench className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-ink text-2xl font-bold tabular-nums">31.821</span>
            <span className="text-ink-faint text-xs">kỹ năng</span>
          </div>
          <p className="text-ink-muted mt-0.5 text-[11px]">
            Bao gồm Hot Tech & In Demand
          </p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
              Chức danh Thị trường
            </span>
            <div className="bg-brand/10 text-brand flex size-8 items-center justify-center rounded-lg">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-ink text-2xl font-bold tabular-nums">54.269</span>
            <span className="text-ink-faint text-xs">titles</span>
          </div>
          <p className="text-ink-muted mt-0.5 text-[11px]">
            Index GIN Trigram tối ưu tìm kiếm
          </p>
        </Card>
      </div>

      {/* Phase 4 Notice Placeholder */}
      <Card className="flex flex-col items-center justify-center p-4 sm:p-5 text-center border-dashed border-border/80">
        <div className="bg-surface-inset text-brand flex size-10 items-center justify-center rounded-xl">
          <BarChart3 className="size-5" />
        </div>
        <h3 className="text-ink mt-2 text-sm sm:text-base font-bold">
          Analytics Dashboard Đang Sẵn Sàng cho Phase 4
        </h3>
        <p className="text-ink-muted mt-1 max-w-xl text-xs leading-relaxed">
          Màn hình này sẽ được trang bị hệ thống biểu đồ SVG phân bổ 23 Major Groups, biểu đồ thanh ngang đo lường độ phủ kỹ năng SFIA 9, và danh sách các nghề nghiệp được ứng viên quan tâm nhất trong <strong>Phase 4</strong>.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onSwitchToExplorer}
          className="mt-3 gap-1.5 text-xs"
        >
          <BookOpen className="size-3.5" />
          <span>Chuyển sang chế độ Explorer để tra cứu nghề</span>
        </Button>
      </Card>
    </div>
  )
}
