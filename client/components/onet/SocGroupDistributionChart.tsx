'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  BarChart2,
  Filter,
  X,
  Sparkles,
} from 'lucide-react'
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
import type { SocGroupDistributionItem } from './types'

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
      <Card className={cn('p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden', className)}>
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-border/60 shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="bg-brand/10 text-brand flex size-5.5 shrink-0 items-center justify-center rounded-md">
                <BarChart2 className="size-3" />
              </div>
              <h3 className="text-ink text-xs sm:text-sm font-bold tracking-tight">
                Phân bổ 23 Nhóm ngành SOC
              </h3>
              {selectedGroup && (
                <Badge variant="brand" className="gap-1 text-[10px] py-0 px-1.5 font-medium">
                  <Filter className="size-2" />
                  <span>Nhóm {selectedGroup}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectGroup(null)
                    }}
                    className="hover:bg-brand/20 rounded p-0.5 ml-0.5 inline-flex items-center"
                    aria-label="Bỏ lọc nhóm"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              )}
            </div>
            <p className="text-ink-muted text-[10px] mt-0.5">
              Nhấp vào cột bất kỳ để lọc danh sách nghề nghiệp ở bảng bên dưới
            </p>
          </div>

          {/* Metric Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-surface-inset p-0.5 rounded-lg shrink-0 self-start sm:self-auto border border-border/40">
            <button
              type="button"
              onClick={() => setMetricMode('occupations')}
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-semibold rounded-md transition-all',
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
                'px-1.5 py-0.5 text-[10px] font-semibold rounded-md transition-all',
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
        <div className="py-1 flex-1 flex flex-col justify-end min-h-0">
          {/* Bar container */}
          <div className="h-28 flex items-end justify-between gap-0.5 sm:gap-1 px-0.5">
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
                        'group relative flex-1 flex flex-col items-center justify-end h-full focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand rounded-t-sm transition-all duration-200 cursor-pointer',
                        isSelected && 'scale-y-105'
                      )}
                      aria-label={`Nhóm ${item.code} - ${item.name}`}
                    >
                      {/* Cột hiển thị */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={cn(
                          'w-full rounded-t-sm transition-all duration-300 relative',
                          isFocus
                            ? 'bg-brand shadow-xs group-hover:bg-brand/90'
                            : isSelected
                            ? 'bg-ink group-hover:bg-ink/90'
                            : 'bg-surface-raised border border-border/80 group-hover:bg-brand/30 group-hover:border-brand/40',
                          isSelected && 'ring-2 ring-brand ring-offset-1 ring-offset-card'
                        )}
                      >
                        {/* Chỉ dấu sao đặc biệt cho Nhóm 15 */}
                        {isFocus && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-brand">
                            <Sparkles className="size-2.5" />
                          </div>
                        )}
                      </div>

                      {/* Mã nhóm dưới chân cột */}
                      <span
                        className={cn(
                          'text-[9px] font-mono mt-1 transition-colors leading-none',
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
                    <div className="flex items-center justify-between gap-2 border-b border-primary-foreground/20 pb-1">
                      <span className="font-bold text-xs">
                        Nhóm {item.code}: {item.name}
                      </span>
                      {isFocus && (
                        <Badge variant="brand" className="text-[9px] py-0 px-1 font-semibold">
                          IT Focus
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-primary-foreground/80 italic">
                      {item.englishName}
                    </p>
                    <div className="text-[10px] space-y-0.5 pt-0.5">
                      <div className="flex justify-between">
                        <span>Tổng số nghề:</span>
                        <span className="font-semibold tabular-nums">{item.totalOccupations} nghề</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Đã ánh xạ SFIA:</span>
                        <span className="font-semibold tabular-nums">
                          {item.mappedOccupations} nghề ({item.mappingCoveragePercent}%)
                        </span>
                      </div>
                    </div>
                    <p className="text-[9px] text-primary-foreground/70 pt-0.5 border-t border-primary-foreground/20">
                      💡 Nhấp để {isSelected ? 'bỏ lọc' : 'lọc bảng bên dưới'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* Legend Footer */}
        <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-border/50 text-[10px] text-ink-muted shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-xs bg-brand shrink-0" />
              <span>Nhóm 15 (Máy tính & CNTT - Trọng tâm)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-xs bg-surface-raised border border-border/80 shrink-0" />
              <span>22 nhóm ngành khác</span>
            </div>
          </div>

          {activeGroupItem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectGroup(null)}
              className="h-5 text-[10px] px-1.5 text-ink-muted hover:text-ink gap-1"
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
