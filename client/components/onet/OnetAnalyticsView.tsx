'use client'

import * as React from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, RotateCcw, AlertCircle, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { onetAdminQueries } from '@/lib/query-client'
import { OnetSummaryCards } from './OnetSummaryCards'
import { SocGroupDistributionChart } from './SocGroupDistributionChart'
import { SfiaSkillCoverageChart } from './SfiaSkillCoverageChart'
import { OnetTopOccupations } from './OnetTopOccupations'
import type { OnetDetailSubTab } from '@/types'
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
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const summaryQuery = useQuery(onetAdminQueries.summary())
  const distributionQuery = useQuery(onetAdminQueries.majorGroupsDistribution())
  const sfiaCoverageQuery = useQuery(onetAdminQueries.sfiaCoverage())
  const topOccupationsQuery = useQuery(onetAdminQueries.topOccupations())

  const summary = summaryQuery.data ?? null
  const distribution = distributionQuery.data ?? []
  const sfiaCoverage = sfiaCoverageQuery.data ?? []
  const topOccupations = topOccupationsQuery.data ?? []

  const isLoading =
    summaryQuery.isLoading ||
    distributionQuery.isLoading ||
    sfiaCoverageQuery.isLoading ||
    topOccupationsQuery.isLoading

  const isRefreshing =
    !isLoading &&
    (summaryQuery.isFetching ||
      distributionQuery.isFetching ||
      sfiaCoverageQuery.isFetching ||
      topOccupationsQuery.isFetching)

  const queryError =
    summaryQuery.error ||
    distributionQuery.error ||
    sfiaCoverageQuery.error ||
    topOccupationsQuery.error

  const error = queryError
    ? 'Không thể tải số liệu phân tích O*NET từ database. Vui lòng thử lại.'
    : null

  const latestUpdatedAt = Math.max(
    summaryQuery.dataUpdatedAt,
    distributionQuery.dataUpdatedAt,
    sfiaCoverageQuery.dataUpdatedAt,
    topOccupationsQuery.dataUpdatedAt
  )
  const lastRefreshedAt = latestUpdatedAt > 0 ? new Date(latestUpdatedAt) : null

  // Xử lý làm mới dữ liệu
  const handleRefresh = async () => {
    await Promise.all([
      summaryQuery.refetch(),
      distributionQuery.refetch(),
      sfiaCoverageQuery.refetch(),
      topOccupationsQuery.refetch(),
    ])
  }

  const handleNavigateToExplorer = (
    socCode: string,
    subTab: OnetDetailSubTab = 'overview'
  ) => {
    if (onSelectOccupation) {
      onSelectOccupation(socCode, subTab)
    } else {
      onSwitchToExplorer()
    }
  }

  // Loading State (3-tier skeleton)
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex h-full flex-col space-y-2 overflow-y-auto p-0.5',
          className
        )}
      >
        {/* Banner Skeleton */}
        <div className="bg-surface-raised h-7 w-full animate-pulse rounded-lg" />

        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-18 bg-surface-raised animate-pulse rounded-xl"
            />
          ))}
        </div>

        {/* 2 Charts Skeleton */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <div className="bg-surface-raised h-[250px] animate-pulse rounded-xl" />
          <div className="bg-surface-raised h-[250px] animate-pulse rounded-xl" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-surface-raised h-80 animate-pulse rounded-xl" />
      </div>
    )
  }

  // Error State
  if (error || !summary) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md space-y-3 p-6 text-center">
          <div className="bg-destructive/10 text-destructive mx-auto flex size-10 items-center justify-center rounded-full">
            <AlertCircle className="size-5" />
          </div>
          <h3 className="text-ink text-base font-bold">
            Không thể tải dữ liệu phân tích
          </h3>
          <p className="text-ink-muted text-xs leading-relaxed">
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
        'text-card-foreground flex h-full flex-col space-y-2 overflow-y-auto p-0.5 pr-1',
        className
      )}
    >
      {/* Top Banner: Sleek 28px Inline Toolbar */}
      <div className="flex shrink-0 flex-col items-start justify-between gap-1.5 px-0.5 py-0.5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="bg-brand/10 text-brand shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            Thống kê & Phân tích
          </span>
          <span className="bg-success/10 text-success flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
            <Sparkles className="size-2.5" />
            <span>O*NET 29.1 & SFIA 9</span>
          </span>
          <span className="text-ink hidden truncate text-xs font-semibold md:inline">
            Tổng quan Phân bổ Nghề nghiệp & Khung Kỹ năng
          </span>
          <span className="text-ink-muted hidden text-[10px] xl:inline">
            • Cập nhật:{' '}
            {lastRefreshedAt
              ? lastRefreshedAt.toLocaleTimeString('vi-VN')
              : '—'}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 gap-1 px-2 text-xs font-medium"
            title="Làm mới lại dữ liệu từ cơ sở dữ liệu"
          >
            <RotateCcw
              className={cn('size-3', isRefreshing && 'animate-spin')}
            />
            <span>Làm mới</span>
          </Button>

          <Button
            size="sm"
            onClick={onSwitchToExplorer}
            className="h-6 gap-1 whitespace-nowrap px-2 text-xs font-medium"
          >
            <span>Khám phá Nghề nghiệp</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>

      {/* Tầng 1: 4 Thẻ KPI Summary Cards */}
      <OnetSummaryCards summary={summary} />

      {/* Tầng 2: Lưới 2 Cột Biểu đồ Trực quan (Cao cố định h-[250px]) */}
      <div className="grid shrink-0 grid-cols-1 gap-2 lg:grid-cols-2">
        {/* Biểu đồ 1: Phân bổ 23 Major Groups */}
        <SocGroupDistributionChart
          data={distribution}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          className="h-[250px]"
        />

        {/* Biểu đồ 2: Độ phủ Kỹ năng SFIA 9 */}
        <SfiaSkillCoverageChart data={sfiaCoverage} className="h-[250px]" />
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
