'use client'

import * as React from 'react'
import { useState } from 'react'
import { BarChart2, Filter, X, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'
import type { SocGroupDistributionItem } from '@/types'

export interface SocGroupDistributionChartProps {
  data: SocGroupDistributionItem[]
  selectedGroup: string | null
  onSelectGroup: (groupCode: string | null) => void
  className?: string
}

type MetricMode = 'occupations' | 'coverage'

export function SocGroupDistributionChart({
  data,
  selectedGroup,
  onSelectGroup,
  className,
}: SocGroupDistributionChartProps) {
  const [metricMode, setMetricMode] = useState<MetricMode>('occupations')

  // Tìm giá trị max để tính % chiều cao
  const maxOccupations = React.useMemo(() => {
    return Math.max(...data.map((d) => d.totalOccupations), 100)
  }, [data])

  const activeGroupItem = React.useMemo(() => {
    return data.find((d) => d.code === selectedGroup)
  }, [data, selectedGroup])

  return (
    <TooltipProvider delayDuration={150}>
      <Card
        className={cn(
          'flex flex-col justify-between overflow-hidden p-2 sm:p-2.5',
          className
        )}
      >
        {/* Header toolbar */}
        <div className="border-border/60 flex shrink-0 flex-col justify-between gap-1 border-b pb-1 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="bg-brand/10 text-brand size-5.5 flex shrink-0 items-center justify-center rounded-md">
                <BarChart2 className="size-3" />
              </div>
              <h3 className="text-ink text-xs font-bold tracking-tight sm:text-sm">
                Phân bổ 23 Nhóm ngành SOC
              </h3>
              {selectedGroup && (
                <Badge
                  variant="brand"
                  className="gap-1 px-1.5 py-0 text-[10px] font-medium"
                >
                  <Filter className="size-2" />
                  <span>Nhóm {selectedGroup}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectGroup(null)
                    }}
                    className="hover:bg-brand/20 ml-0.5 inline-flex items-center rounded p-0.5"
                    aria-label="Bỏ lọc nhóm"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )}
            </div>
            <p className="text-ink-muted mt-0.5 text-[10px]">
              Nhấp vào cột bất kỳ để lọc danh sách nghề nghiệp ở bảng bên dưới
            </p>
          </div>

          {/* Metric Mode Toggle */}
          <div className="bg-surface-inset border-border/40 flex shrink-0 items-center gap-0.5 self-start rounded-lg border p-0.5 sm:self-auto">
            <button
              type="button"
              onClick={() => setMetricMode('occupations')}
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-all',
                metricMode === 'occupations'
                  ? 'bg-card text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              Số lượng nghề
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('coverage')}
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-all',
                metricMode === 'coverage'
                  ? 'bg-card text-ink shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              Tỷ lệ mapped (%)
            </button>
          </div>
        </div>

        {/* Visual Chart Area */}
        <div className="flex min-h-0 flex-1 flex-col justify-end py-1">
          {/* Bar container */}
          <div className="flex h-28 items-end justify-between gap-0.5 px-0.5 sm:gap-1">
            {data.map((item) => {
              const isSelected = selectedGroup === item.code
              const isFocus = item.isFocusGroup // Group 15
              const val =
                metricMode === 'occupations'
                  ? item.totalOccupations
                  : item.mappingCoveragePercent
              const maxVal = metricMode === 'occupations' ? maxOccupations : 100

              // Tính chiều cao tối thiểu 8% để cột luôn có thể tương tác
              const rawPercent = (val / maxVal) * 100
              const heightPercent = Math.max(rawPercent, 8)

              return (
                <Tooltip key={item.code}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() =>
                        onSelectGroup(isSelected ? null : item.code)
                      }
                      className={cn(
                        'focus-visible:outline-hidden focus-visible:ring-brand group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end rounded-t-sm transition-all duration-200 focus-visible:ring-2',
                        isSelected && 'scale-y-105'
                      )}
                      aria-label={`Nhóm ${item.code} - ${item.name}`}
                    >
                      {/* Cột hiển thị */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={cn(
                          'relative w-full rounded-t-sm transition-all duration-300',
                          isFocus
                            ? 'bg-brand shadow-xs group-hover:bg-brand/90'
                            : isSelected
                              ? 'bg-ink group-hover:bg-ink/90'
                              : 'bg-surface-raised border-border/80 group-hover:bg-brand/30 group-hover:border-brand/40 border',
                          isSelected &&
                            'ring-brand ring-offset-card ring-2 ring-offset-1'
                        )}
                      >
                        {/* Chỉ dấu sao đặc biệt cho Nhóm 15 */}
                        {isFocus && (
                          <div className="text-brand absolute -top-3 left-1/2 -translate-x-1/2">
                            <Sparkles className="size-2.5" />
                          </div>
                        )}
                      </div>

                      {/* Mã nhóm dưới chân cột */}
                      <span
                        className={cn(
                          'mt-1 font-mono text-[9px] leading-none transition-colors',
                          isSelected
                            ? 'text-ink font-bold'
                            : isFocus
                              ? 'text-brand font-bold'
                              : 'text-ink-muted group-hover:text-ink'
                        )}
                      >
                        {item.code}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs space-y-1 p-2">
                    <div className="border-primary-foreground/20 flex items-center justify-between gap-2 border-b pb-1">
                      <span className="text-xs font-bold">
                        Nhóm {item.code}: {item.name}
                      </span>
                      {isFocus && (
                        <Badge
                          variant="brand"
                          className="px-1 py-0 text-[9px] font-semibold"
                        >
                          IT Focus
                        </Badge>
                      )}
                    </div>
                    <p className="text-primary-foreground/80 text-[11px] italic">
                      {item.englishName}
                    </p>
                    <div className="space-y-0.5 pt-0.5 text-[10px]">
                      <div className="flex justify-between">
                        <span>Tổng số nghề:</span>
                        <span className="font-semibold tabular-nums">
                          {item.totalOccupations} nghề
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Đã ánh xạ SFIA:</span>
                        <span className="font-semibold tabular-nums">
                          {item.mappedOccupations} nghề (
                          {item.mappingCoveragePercent}%)
                        </span>
                      </div>
                    </div>
                    <p className="text-primary-foreground/70 border-primary-foreground/20 border-t pt-0.5 text-[9px]">
                      💡 Nhấp để {isSelected ? 'bỏ lọc' : 'lọc bảng bên dưới'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* Legend Footer */}
        <div className="border-border/50 text-ink-muted flex shrink-0 flex-wrap items-center justify-between gap-1 border-t pt-1 text-[10px]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <span className="rounded-xs bg-brand size-2 shrink-0" />
              <span>Nhóm 15 (Máy tính & CNTT - Trọng tâm)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="rounded-xs bg-surface-raised border-border/80 size-2 shrink-0 border" />
              <span>22 nhóm ngành khác</span>
            </div>
          </div>

          {activeGroupItem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectGroup(null)}
              className="text-ink-muted hover:text-ink h-5 gap-1 px-1.5 text-[10px]"
            >
              <X className="size-2.5" />
              <span>Xóa lọc</span>
            </Button>
          )}
        </div>
      </Card>
    </TooltipProvider>
  )
}
