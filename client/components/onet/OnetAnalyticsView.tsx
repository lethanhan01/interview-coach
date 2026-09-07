'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import {
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { onetMockService } from '@/services/onet.mock'
import { OnetSummaryCards } from './OnetSummaryCards'
import { SocGroupDistributionChart } from './SocGroupDistributionChart'
import { SfiaSkillCoverageChart } from './SfiaSkillCoverageChart'
import { OnetTopOccupations } from './OnetTopOccupations'
import type {
  OnetAnalyticsSummary,
  SocGroupDistributionItem,
  SfiaSkillCoverageItem,
  OnetTopOccupationItem,
  OnetDetailSubTab,
} from './types'
import { cn } from '@/lib/utils'

export interface OnetAnalyticsViewProps {
  onSwitchToExplorer: () => void
  onSelectOccupation?: (socCode: string, subTab?: OnetDetailSubTab) => void
  className?: string
}

export function OnetAnalyticsView({
  onSwitchToExplorer,
  onSelectOccupation,
  className,
}: OnetAnalyticsViewProps) {
  const [summary, setSummary] = useState<OnetAnalyticsSummary | null>(null)
  const [distribution, setDistribution] = useState<SocGroupDistributionItem[]>([])
  const [sfiaCoverage, setSfiaCoverage] = useState<SfiaSkillCoverageItem[]>([])
  const [topOccupations, setTopOccupations] = useState<OnetTopOccupationItem[]>([])

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date())

  // Nạp dữ liệu ban đầu
  useEffect(() => {
    let isMounted = true

    Promise.all([
      onetMockService.getAnalyticsSummary(),
      onetMockService.getSocGroupDistribution(),
      onetMockService.getSfiaSkillCoverage(),
      onetMockService.getTopOccupations(),
    ])
      .then(([sum, dist, sfia, occs]) => {
        if (!isMounted) return
        setSummary(sum)
        setDistribution(dist)
        setSfiaCoverage(sfia)
        setTopOccupations(occs)
        setLastRefreshedAt(new Date())
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Lỗi khi tải dữ liệu Analytics:', err)
        setError('Không thể tải số liệu phân tích O*NET. Vui lòng thử lại.')
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Xử lý làm mới dữ liệu
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      setError(null)

      const [sum, dist, sfia, occs] = await Promise.all([
        onetMockService.getAnalyticsSummary(),
        onetMockService.getSocGroupDistribution(),
        onetMockService.getSfiaSkillCoverage(),
        onetMockService.getTopOccupations(),
      ])

      setSummary(sum)
      setDistribution(dist)
      setSfiaCoverage(sfia)
      setTopOccupations(occs)
      setLastRefreshedAt(new Date())
    } catch (err) {
      console.error('Lỗi khi làm mới dữ liệu:', err)
      setError('Không thể làm mới số liệu O*NET.')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleNavigateToExplorer = (socCode: string, subTab: OnetDetailSubTab = 'overview') => {
    if (onSelectOccupation) {
      onSelectOccupation(socCode, subTab)
    } else {
      onSwitchToExplorer()
    }
  }

  // Loading State (3-tier skeleton)
  if (isLoading) {
    return (
      <div className={cn('flex h-full flex-col overflow-y-auto space-y-2 p-0.5', className)}>
        {/* Banner Skeleton */}
        <div className="h-7 w-full rounded-lg bg-surface-raised animate-pulse" />

        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-18 rounded-xl bg-surface-raised animate-pulse" />
          ))}
        </div>

        {/* 2 Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <div className="h-[250px] rounded-xl bg-surface-raised animate-pulse" />
          <div className="h-[250px] rounded-xl bg-surface-raised animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <div className="h-80 rounded-xl bg-surface-raised animate-pulse" />
      </div>
    )
  }

  // Error State
  if (error || !summary) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md p-6 text-center space-y-3">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </div>
          <h3 className="text-base font-bold text-ink">Không thể tải dữ liệu phân tích</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            {error || 'Đã có lỗi xảy ra trong quá trình nạp số liệu O*NET.'}
          </p>
          <Button
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5 text-xs font-semibold"
          >
            <RotateCcw className="size-3.5" />
            <span>Thử lại</span>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-y-auto space-y-2 pr-1 p-0.5 text-card-foreground',
        className
      )}
    >
      {/* Top Banner: Sleek 28px Inline Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 px-0.5 py-0.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0">
            Thống kê & Phân tích
          </span>
          <span className="bg-success/10 text-success rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-1 shrink-0">
            <Sparkles className="size-2.5" />
            <span>O*NET 29.1 & SFIA 9</span>
          </span>
          <span className="text-ink text-xs font-semibold truncate hidden md:inline">
            Tổng quan Phân bổ Nghề nghiệp & Khung Kỹ năng
          </span>
          <span className="text-ink-muted text-[10px] hidden xl:inline">
            • Cập nhật: {lastRefreshedAt.toLocaleTimeString('vi-VN')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1 text-xs font-medium h-6 px-2"
            title="Làm mới lại dữ liệu từ mock store"
          >
            <RotateCcw className={cn('size-3', isRefreshing && 'animate-spin')} />
            <span>Làm mới</span>
          </Button>

          <Button
            size="sm"
            onClick={onSwitchToExplorer}
            className="gap-1 text-xs font-medium h-6 px-2 whitespace-nowrap"
          >
            <span>Khám phá Nghề nghiệp</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>

      {/* Tầng 1: 4 Thẻ KPI Summary Cards */}
      <OnetSummaryCards summary={summary} />

      {/* Tầng 2: Lưới 2 Cột Biểu đồ Trực quan (Cao cố định h-[250px]) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 shrink-0">
        {/* Biểu đồ 1: Phân bổ 23 Major Groups */}
        <SocGroupDistributionChart
          data={distribution}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          className="h-[250px]"
        />

        {/* Biểu đồ 2: Độ phủ Kỹ năng SFIA 9 */}
        <SfiaSkillCoverageChart
          data={sfiaCoverage}
          className="h-[250px]"
        />
      </div>

      {/* Tầng 3: Bảng Dữ liệu Top Nghề Quan tâm nhất */}
      <OnetTopOccupations
        data={topOccupations}
        activeGroupFilter={selectedGroup}
        onClearGroupFilter={() => setSelectedGroup(null)}
        onNavigateToExplorer={handleNavigateToExplorer}
      />
    </div>
  )
}
