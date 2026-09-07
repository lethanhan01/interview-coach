'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  Network,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { SfiaSkillCoverageItem } from './types'

export interface SfiaSkillCoverageChartProps {
  data: SfiaSkillCoverageItem[]
  className?: string
}

const DEFAULT_VISIBLE_COUNT = 5

export function SfiaSkillCoverageChart({
  data,
  className,
}: SfiaSkillCoverageChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  // Danh sách categories duy nhất
  const categories = useMemo(() => {
    const set = new Set<string>()
    data.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return ['all', ...Array.from(set)]
  }, [data])

  // Lọc theo Category
  const filteredData = useMemo(() => {
    if (selectedCategory === 'all') return data
    return data.filter((item) => item.category === selectedCategory)
  }, [data, selectedCategory])

  // Danh sách hiển thị theo trạng thái mở rộng
  const displayData = useMemo(() => {
    if (isExpanded) return filteredData
    return filteredData.slice(0, DEFAULT_VISIBLE_COUNT)
  }, [filteredData, isExpanded])

  // Giá trị max để tính % chiều rộng thanh ngang
  const maxMapped = useMemo(() => {
    return Math.max(...data.map((d) => d.mappedOccupationsCount), 1)
  }, [data])

  return (
    <Card className={cn('p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden', className)}>
      {/* Header toolbar */}
      <div className="flex flex-col gap-1 pb-1 border-b border-border/60 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="bg-success/10 text-success flex size-5.5 shrink-0 items-center justify-center rounded-md">
              <Network className="size-3" />
            </div>
            <div>
              <h3 className="text-ink text-xs sm:text-sm font-bold tracking-tight">
                Độ phủ Kỹ năng SFIA 9 Phổ biến
              </h3>
              <p className="text-ink-muted text-[10px]">
                Tần suất xuất hiện của các kỹ năng số trong chuẩn nghề nghiệp
              </p>
            </div>
          </div>

          <Badge variant="outline" className="text-[10px] font-mono shrink-0 py-0 px-1.5">
            {filteredData.length} kỹ năng
          </Badge>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1 pt-0.5 overflow-x-auto">
          {categories.map((cat) => {
            const isAll = cat === 'all'
            const label = isAll ? 'Tất cả' : cat
            const isActive = selectedCategory === cat

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-1.5 py-0.2 text-[9px] font-medium rounded-full transition-all border whitespace-nowrap cursor-pointer leading-tight',
                  isActive
                    ? 'bg-brand text-brand-foreground border-brand shadow-xs font-semibold'
                    : 'bg-surface-raised text-ink-muted border-border/70 hover:text-ink hover:border-brand/40'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Ranked Horizontal Bars */}
      <div className="py-1 space-y-1 flex-1 overflow-y-auto min-h-0 pr-0.5">
        {displayData.map((item) => {
          const widthPercent = Math.max(
            Math.round((item.mappedOccupationsCount / maxMapped) * 100),
            12
          )

          return (
            <div
              key={item.code}
              className="group flex flex-col gap-0.5 p-0.5 px-1 rounded-md transition-colors hover:bg-surface-muted/50"
            >
              <div className="flex items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="bg-brand/10 text-brand font-mono font-bold text-[9px] px-1 py-0.2 rounded shrink-0 leading-none">
                    {item.code}
                  </span>
                  <span className="text-ink font-medium truncate text-[11px]">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-[10px]">
                  {/* Badge dải level */}
                  <span className="bg-surface-inset text-ink-muted px-1 py-0.2 rounded font-mono text-[9px]">
                    L{item.minTargetLevel}–L{item.maxTargetLevel}
                  </span>

                  {/* Core vs Secondary breakdown */}
                  <span className="text-success font-semibold text-[9px] bg-success/10 px-1 py-0.2 rounded">
                    Core: {item.coreCount}
                  </span>
                  {item.secondaryCount > 0 && (
                    <span className="text-ink-muted text-[9px] bg-surface-inset px-1 py-0.2 rounded">
                      Sec: {item.secondaryCount}
                    </span>
                  )}

                  {/* Số nghề */}
                  <span className="font-bold text-ink tabular-nums text-[10px] ml-0.5">
                    {item.mappedOccupationsCount} nghề
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-surface-raised border border-border/50 rounded-full overflow-hidden">
                <div
                  style={{ width: `${widthPercent}%` }}
                  className="h-full bg-brand rounded-full transition-all duration-500 ease-out group-hover:bg-brand/90"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Toggle Expand / Collapse */}
      {filteredData.length > DEFAULT_VISIBLE_COUNT && (
        <div className="pt-1 border-t border-border/50 flex justify-center shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-5 text-[10px] text-ink-muted hover:text-ink gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="size-2.5" />
                <span>Thu gọn về Top {DEFAULT_VISIBLE_COUNT}</span>
              </>
            ) : (
              <>
                <ChevronDown className="size-2.5" />
                <span>Xem tất cả {filteredData.length} kỹ năng SFIA</span>
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  )
}
