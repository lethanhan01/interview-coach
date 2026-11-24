'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { Network, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { SfiaSkillCoverageItem } from '@/types'

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
    <Card
      className={cn(
        'flex flex-col justify-between overflow-hidden p-2 sm:p-2.5',
        className
      )}
    >
      {/* Header toolbar */}
      <div className="border-border/60 flex shrink-0 flex-col gap-1 border-b pb-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="bg-success/10 text-success size-5.5 flex shrink-0 items-center justify-center rounded-md">
              <Network className="size-3" />
            </div>
            <div>
              <h3 className="text-ink text-xs font-bold tracking-tight sm:text-sm">
                Độ phủ Kỹ năng SFIA 9 Phổ biến
              </h3>
              <p className="text-ink-muted text-[10px]">
                Tần suất xuất hiện của các kỹ năng số trong chuẩn nghề nghiệp
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="shrink-0 px-1.5 py-0 font-mono text-[10px]"
          >
            {filteredData.length} kỹ năng
          </Badge>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto pt-0.5">
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
                  'py-0.2 cursor-pointer whitespace-nowrap rounded-full border px-1.5 text-[9px] font-medium leading-tight transition-all',
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
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto py-1 pr-0.5">
        {displayData.map((item) => {
          const widthPercent = Math.max(
            Math.round((item.mappedOccupationsCount / maxMapped) * 100),
            12
          )

          return (
            <div
              key={item.code}
              className="hover:bg-surface-muted/50 group flex flex-col gap-0.5 rounded-md p-0.5 px-1 transition-colors"
            >
              <div className="flex items-center justify-between gap-1.5 text-xs">
                <div className="flex min-w-0 items-center gap-1">
                  <span className="bg-brand/10 text-brand py-0.2 shrink-0 rounded px-1 font-mono text-[9px] font-bold leading-none">
                    {item.code}
                  </span>
                  <span className="text-ink truncate text-[11px] font-medium">
                    {item.name}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1 text-[10px]">
                  {/* Badge dải level */}
                  <span className="bg-surface-inset text-ink-muted py-0.2 rounded px-1 font-mono text-[9px]">
                    L{item.minTargetLevel}–L{item.maxTargetLevel}
                  </span>

                  {/* Core vs Secondary breakdown */}
                  <span className="text-success bg-success/10 py-0.2 rounded px-1 text-[9px] font-semibold">
                    Core: {item.coreCount}
                  </span>
                  {item.secondaryCount > 0 && (
                    <span className="text-ink-muted bg-surface-inset py-0.2 rounded px-1 text-[9px]">
                      Sec: {item.secondaryCount}
                    </span>
                  )}

                  {/* Số nghề */}
                  <span className="text-ink ml-0.5 text-[10px] font-bold tabular-nums">
                    {item.mappedOccupationsCount} nghề
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-surface-raised border-border/50 h-1.5 w-full overflow-hidden rounded-full border">
                <div
                  style={{ width: `${widthPercent}%` }}
                  className="bg-brand group-hover:bg-brand/90 h-full rounded-full transition-all duration-500 ease-out"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Toggle Expand / Collapse */}
      {filteredData.length > DEFAULT_VISIBLE_COUNT && (
        <div className="border-border/50 flex shrink-0 justify-center border-t pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-ink-muted hover:text-ink h-5 gap-1 text-[10px]"
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
