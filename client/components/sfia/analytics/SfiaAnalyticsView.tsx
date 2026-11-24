'use client'

import React, { memo } from 'react'

import {
  Layers,
  CheckCircle2,
  Briefcase,
  AlertTriangle,
  FolderTree,
  SlidersHorizontal,
  Trophy,
  ArrowUpRight,
  X,
  ExternalLink,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  type SfiaCoverageStats,
  type SfiaCategoryMetric,
  type SfiaLevelMetric,
  type SfiaTopOnetMappedSkill,
} from '@/types'
import { getCategoryTheme, getLevelTheme } from '@/components/sfia/sfia-theme'

export interface SfiaAnalyticsViewProps {
  stats: SfiaCoverageStats | null
  selectedCategoryFilter?: string | null
  selectedLevelFilter?: number | null
  onSelectCategory?: (categoryCode: string | null) => void
  onSelectLevel?: (level: number | null) => void
  onSelectSkill?: (skillCode: string) => void
  onScrollToBlindSpots?: () => void
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
}

/**
 * 1. Khối 4 Thẻ KPI Điều Hành Cấp Cao
 */
const SfiaKpiCards = memo(function SfiaKpiCards({
  stats,
  onScrollToBlindSpots,
}: {
  stats: SfiaCoverageStats
  onScrollToBlindSpots?: () => void
}) {
  const questionCoverageRate =
    stats.totalSkills > 0
      ? Math.round((stats.skillsWithQuestions / stats.totalSkills) * 1000) / 10
      : 0
  const onetMappingRate =
    stats.totalSkills > 0
      ? Math.round((stats.skillsWithOnet / stats.totalSkills) * 1000) / 10
      : 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* KPI 1: Tổng kỹ năng SFIA 9 */}
      <div className="border-border/80 bg-card hover:border-brand/40 flex flex-col justify-between rounded-xl border p-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted text-xs font-semibold">
            Tổng kỹ năng SFIA 9
          </span>
          <div className="bg-brand/10 text-brand rounded-lg p-2">
            <Layers className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-ink text-3xl font-extrabold tabular-nums tracking-tight">
              {stats.totalSkills}
            </span>
            <span className="text-ink-muted text-xs font-medium">kỹ năng</span>
          </div>
          <div className="text-ink-muted mt-2 flex items-center gap-1.5 text-[11px]">
            <Badge variant="outline" className="font-mono text-[10px]">
              6 Danh mục
            </Badge>
            <span>•</span>
            <span className="truncate">22 Phân nhóm chuyên môn</span>
          </div>
        </div>
      </div>

      {/* KPI 2: Tỷ lệ phủ câu hỏi */}
      <div className="border-border/80 bg-card flex flex-col justify-between rounded-xl border p-4 shadow-sm transition-colors hover:border-emerald-500/40">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted text-xs font-semibold">
            Độ phủ câu hỏi phỏng vấn
          </span>
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
              {questionCoverageRate}%
            </span>
            <span className="text-ink-muted text-xs font-medium tabular-nums">
              ({stats.skillsWithQuestions}/{stats.totalSkills})
            </span>
          </div>
          {/* Progress bar */}
          <div className="bg-surface-inset mt-2.5 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, questionCoverageRate)}%` }}
            />
          </div>
          <p className="text-ink-muted mt-1.5 flex items-center justify-between text-[11px]">
            <span>Tổng số câu hỏi:</span>
            <strong className="text-ink font-semibold tabular-nums">
              {stats.totalQuestions} Qs
            </strong>
          </p>
        </div>
      </div>

      {/* KPI 3: Tỷ lệ map với nghề O*NET */}
      <div className="border-border/80 bg-card flex flex-col justify-between rounded-xl border p-4 shadow-sm transition-colors hover:border-cyan-500/40">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted text-xs font-semibold">
            Ánh xạ nghề nghiệp O*NET
          </span>
          <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-600 dark:text-cyan-400">
            <Briefcase className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-cyan-600 dark:text-cyan-400">
              {onetMappingRate}%
            </span>
            <span className="text-ink-muted text-xs font-medium tabular-nums">
              ({stats.skillsWithOnet}/{stats.totalSkills})
            </span>
          </div>
          {/* Progress bar */}
          <div className="bg-surface-inset mt-2.5 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${Math.min(100, onetMappingRate)}%` }}
            />
          </div>
          <p className="text-ink-muted mt-1.5 flex items-center justify-between text-[11px]">
            <span>Tiêu chuẩn tham chiếu:</span>
            <span className="text-ink text-[10px] font-medium">
              O*NET SOC 2020
            </span>
          </p>
        </div>
      </div>

      {/* KPI 4: Điểm mù cần hành động */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flex cursor-pointer flex-col justify-between rounded-xl border p-4 shadow-sm transition-all',
          stats.blindSpotsCount > 0
            ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60 hover:bg-rose-500/10'
            : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
        )}
        onClick={onScrollToBlindSpots}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onScrollToBlindSpots?.()
          }
        }}
        title="Nhấp để cuộn nhanh đến Bảng Điểm mù"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
            Điểm mù cần hành động
            {stats.blindSpotsCount > 0 && (
              <span className="size-2 animate-pulse rounded-full bg-rose-500" />
            )}
          </span>
          <div className="rounded-lg bg-rose-500/15 p-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-rose-600 dark:text-rose-400">
              {stats.blindSpotsCount}
            </span>
            <span className="text-xs font-medium text-rose-700/80 dark:text-rose-300/80">
              kỹ năng (0 câu hỏi)
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-rose-700/90 dark:text-rose-300/90">
            <span>Ưu tiên bổ sung ngay</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-600 transition-transform group-hover:translate-x-0.5">
              Xem bảng <ArrowUpRight className="size-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

/**
 * 2. Khối Biểu Đồ Phân Bổ Theo 6 Danh Mục (Category Distribution Bar Meter)
 */
const SfiaCategoryDistributionChart = memo(
  function SfiaCategoryDistributionChart({
    categoryDistribution,
    selectedCategory,
    onSelectCategory,
  }: {
    categoryDistribution: SfiaCategoryMetric[]
    selectedCategory?: string | null
    onSelectCategory?: (code: string | null) => void
  }) {
    // Tìm số câu hỏi lớn nhất để chuẩn hóa thanh đo
    const maxQuestions = Math.max(
      ...categoryDistribution.map((c) => c.questionCount),
      1
    )

    return (
      <div className="border-border/80 bg-card flex flex-col justify-between rounded-xl border p-5 shadow-sm">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-brand/10 text-brand rounded-md p-1.5">
                <FolderTree className="size-4" />
              </div>
              <div>
                <h3 className="text-ink text-sm font-bold">
                  Phân bổ & Độ phủ theo 6 Danh mục SFIA
                </h3>
                <p className="text-ink-muted text-[11px]">
                  So sánh số lượng kỹ năng và số câu hỏi phỏng vấn trong từng
                  nhóm
                </p>
              </div>
            </div>

            {selectedCategory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectCategory?.(null)}
                className="border-brand/40 text-brand hover:bg-brand/10 h-7 gap-1 text-xs"
              >
                <span>Bỏ lọc danh mục</span>
                <X className="size-3" />
              </Button>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {categoryDistribution.map((cat) => {
              const theme = getCategoryTheme(cat.code)
              const isSelected = selectedCategory === cat.code
              const questionRatio = Math.round(
                (cat.questionCount / maxQuestions) * 100
              )

              return (
                <button
                  key={cat.code}
                  type="button"
                  onClick={() =>
                    onSelectCategory?.(isSelected ? null : cat.code)
                  }
                  aria-pressed={isSelected}
                  aria-label={`Lọc theo danh mục ${cat.nameVi} (${cat.code})`}
                  className={cn(
                    'group relative w-full rounded-lg border p-2.5 text-left transition-all duration-150',
                    'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                    isSelected
                      ? 'border-brand bg-brand/5 ring-brand shadow-sm ring-1'
                      : 'border-border/60 bg-surface-inset/40 hover:bg-surface-inset hover:border-border'
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          'size-2.5 shrink-0 rounded-full',
                          theme.dot
                        )}
                      />
                      <span className="text-ink truncate font-semibold">
                        {cat.nameVi}
                      </span>
                      <span className="text-ink-muted hidden text-[10px] sm:inline">
                        ({cat.code})
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-xs">
                      <span className="text-ink-muted text-[11px]">
                        <strong className="text-ink font-semibold tabular-nums">
                          {cat.skillCount}
                        </strong>{' '}
                        kỹ năng
                      </span>
                      <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {cat.questionCount} Qs
                      </span>
                    </div>
                  </div>

                  {/* Progress Visual Bar */}
                  <div className="bg-surface-inset relative h-2 w-full overflow-hidden rounded-full">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        theme.dot
                      )}
                      style={{ width: `${Math.max(8, questionRatio)}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <p className="text-ink-muted border-border/40 mt-4 flex items-center gap-1.5 border-t pt-3 text-[11px] italic">
          <Info className="text-brand size-3.5 shrink-0" />
          <span>
            Nhấp vào danh mục bất kỳ để lọc nhanh danh sách Điểm mù bên dưới.
          </span>
        </p>
      </div>
    )
  }
)

function getLevelBarColor(level: number): string {
  if (level >= 5) return 'bg-brand'
  if (level >= 3) return 'bg-emerald-500'
  return 'bg-cyan-500'
}

/**
 * 3. Khối Biểu Đồ Phân Bổ Theo 7 Cấp Độ Trách Nhiệm (Level Distribution Meter)
 */
const SfiaLevelDistributionChart = memo(function SfiaLevelDistributionChart({
  levelDistribution,
  selectedLevel,
  onSelectLevel,
}: Readonly<{
  levelDistribution: SfiaLevelMetric[]
  selectedLevel?: number | null
  onSelectLevel?: (level: number | null) => void
}>) {
  const maxQuestions = Math.max(
    ...levelDistribution.map((l) => l.questionCount),
    1
  )

  return (
    <div className="border-border/80 bg-card flex flex-col justify-between rounded-xl border p-5 shadow-sm">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand/10 text-brand rounded-md p-1.5">
              <SlidersHorizontal className="size-4" />
            </div>
            <div>
              <h3 className="text-ink text-sm font-bold">
                Phân bổ câu hỏi theo 7 Cấp độ SFIA
              </h3>
              <p className="text-ink-muted text-[11px]">
                Tỷ lệ phủ câu hỏi từ Level 1 (Follow) đến Level 7 (Set strategy)
              </p>
            </div>
          </div>

          {selectedLevel !== null && selectedLevel !== undefined && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectLevel?.(null)}
              className="border-brand/40 text-brand hover:bg-brand/10 h-7 gap-1 text-xs"
            >
              <span>Bỏ lọc Level {selectedLevel}</span>
              <X className="size-3" />
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {levelDistribution.map((lvl) => {
            const levelInfo = getLevelTheme(lvl.level)
            const isSelected = selectedLevel === lvl.level
            const barWidth = Math.round(
              (lvl.questionCount / maxQuestions) * 100
            )

            return (
              <button
                key={lvl.level}
                type="button"
                onClick={() => onSelectLevel?.(isSelected ? null : lvl.level)}
                aria-pressed={isSelected}
                aria-label={`Lọc theo Level ${lvl.level} (${levelInfo.name})`}
                className={cn(
                  'group relative w-full rounded-lg border p-2 text-left transition-all duration-150',
                  'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                  isSelected
                    ? 'border-brand bg-brand/5 ring-brand shadow-sm ring-1'
                    : 'border-border/60 bg-surface-inset/40 hover:bg-surface-inset hover:border-border'
                )}
              >
                <div className="mb-1 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-surface-raised border-border text-ink rounded border px-1.5 py-0.5 font-mono text-xs font-bold">
                      L{lvl.level}
                    </span>
                    <span className="text-ink truncate font-medium">
                      {levelInfo.name}
                    </span>
                    <span className="text-ink-muted hidden text-[10px] sm:inline">
                      ({levelInfo.nameVi})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-ink-muted text-[11px] tabular-nums">
                      {lvl.activeCellCount} ô khả dụng
                    </span>
                    <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {lvl.questionCount} Qs
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bg-surface-inset relative h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      getLevelBarColor(lvl.level)
                    )}
                    style={{ width: `${Math.max(6, barWidth)}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-ink-muted border-border/40 mt-4 flex items-center gap-1.5 border-t pt-3 text-[11px] italic">
        <Info className="text-brand size-3.5 shrink-0" />
        <span>
          Nhấp vào cấp độ để lọc kỹ năng có dải level tương ứng trong Bảng Điểm
          mù.
        </span>
      </p>
    </div>
  )
})

const RANK_BADGE_STYLE: Record<number, string> = {
  1: 'bg-amber-500 text-white shadow-sm',
  2: 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100',
  3: 'bg-amber-700/80 text-white',
}

/**
 * 4. Khối Bảng Xếp Hạng Top 10 Kỹ Năng SFIA Phổ Biến Nhất trong O*NET
 */
const SfiaTopOnetLeaderboard = memo(function SfiaTopOnetLeaderboard({
  topSkills,
  onSelectSkill,
}: Readonly<{
  topSkills: SfiaTopOnetMappedSkill[]
  onSelectSkill?: (skillCode: string) => void
}>) {
  return (
    <div className="border-border/80 bg-card rounded-xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
            <Trophy className="size-4" />
          </div>
          <div>
            <h3 className="text-ink text-sm font-bold">
              Top 10 Kỹ Năng SFIA Phổ Biến Nhất trong O*NET
            </h3>
            <p className="text-ink-muted text-[11px]">
              Xếp hạng theo số lượng vị trí nghề nghiệp O*NET SOC đang tích hợp
            </p>
          </div>
        </div>
      </div>

      <div className="divide-border/60 divide-y">
        {topSkills.map((item, index) => {
          const theme = getCategoryTheme(item.categoryCode)
          const rank = index + 1

          return (
            <div
              key={item.skillCode}
              className="hover:bg-surface-inset/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors"
            >
              <div className="flex min-w-0 items-center gap-3">
                {/* Rank Badge */}
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                    RANK_BADGE_STYLE[rank] ??
                      'bg-surface-inset text-ink-muted font-mono'
                  )}
                >
                  {rank}
                </span>

                {/* Skill Title & Badges */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-ink font-mono text-xs font-bold">
                      {item.skillCode}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn('px-1.5 py-0 text-[10px]', theme.badge)}
                    >
                      {item.categoryCode}
                    </Badge>
                  </div>
                  <p
                    className="text-ink-muted max-w-[200px] truncate text-xs sm:max-w-xs md:max-w-md"
                    title={item.skillName}
                  >
                    {item.skillName}
                  </p>
                </div>
              </div>

              {/* Stats & Jump Action */}
              <div className="flex shrink-0 items-center gap-4">
                <div className="text-right text-xs">
                  <span className="font-bold tabular-nums text-cyan-600 dark:text-cyan-400">
                    {item.onetCount} nghề
                  </span>
                  <span className="text-ink-muted block text-[10px] tabular-nums">
                    ({item.coreCount} cốt lõi)
                  </span>
                </div>

                <div className="hidden text-right text-xs sm:block">
                  <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {item.questionCount} Qs
                  </span>
                  <span className="text-ink-muted block text-[10px]">
                    ngân hàng
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectSkill?.(item.skillCode)}
                  className="text-ink-muted hover:text-brand h-7 w-7 p-0"
                  title={`Mở chi tiết kỹ năng ${item.skillCode} trong Cây danh mục`}
                >
                  <ExternalLink className="size-3.5" />
                  <span className="sr-only">Xem chi tiết {item.skillCode}</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

/**
 * COMPONENT CHÍNH: SfiaAnalyticsView (Coverage Analytics Dashboard)
 */
export function SfiaAnalyticsView({
  stats,
  selectedCategoryFilter,
  selectedLevelFilter,
  onSelectCategory,
  onSelectLevel,
  onSelectSkill,
  onScrollToBlindSpots,
  loading = false,
  error = null,
  onRetry,
  className,
}: Readonly<SfiaAnalyticsViewProps>) {
  // 1. Trạng thái Loading Skeleton
  if (loading) {
    return (
      <div
        className={cn(
          'mx-auto flex w-full max-w-7xl animate-pulse flex-col gap-6 p-4',
          className
        )}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface-inset border-border h-28 rounded-xl border"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="bg-surface-inset border-border h-96 rounded-xl border" />
          <div className="bg-surface-inset border-border h-96 rounded-xl border" />
        </div>
        <div className="bg-surface-inset border-border h-72 rounded-xl border" />
      </div>
    )
  }

  // 2. Trạng thái Báo lỗi
  if (error || !stats) {
    return (
      <div
        className={cn(
          'border-destructive/30 bg-destructive/5 mx-auto my-8 flex max-w-2xl flex-col items-center justify-center rounded-xl border p-12 text-center',
          className
        )}
      >
        <AlertTriangle className="text-destructive mb-3 size-10" />
        <h3 className="text-ink mb-1 text-base font-bold">
          Không thể tải dữ liệu Thống kê Phân tích SFIA
        </h3>
        <p className="text-ink-muted mb-4 max-w-md text-xs">
          {error ||
            'Dữ liệu thống kê độ phủ chưa sẵn sàng hoặc không thể kết nối tới nguồn dữ liệu.'}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Thử tải lại dữ liệu
          </Button>
        )}
      </div>
    )
  }

  // 3. Render Dashboard hoàn chỉnh
  return (
    <div
      className={cn('mx-auto flex w-full max-w-7xl flex-col gap-6', className)}
    >
      {/* 4 Thẻ KPI Đầu Trang */}
      <SfiaKpiCards stats={stats} onScrollToBlindSpots={onScrollToBlindSpots} />

      {/* Lưới 2 Biểu Đồ Phân Bổ (Danh Mục vs Cấp Độ) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SfiaCategoryDistributionChart
          categoryDistribution={stats.categoryDistribution}
          selectedCategory={selectedCategoryFilter}
          onSelectCategory={onSelectCategory}
        />

        <SfiaLevelDistributionChart
          levelDistribution={stats.levelDistribution}
          selectedLevel={selectedLevelFilter}
          onSelectLevel={onSelectLevel}
        />
      </div>

      {/* Bảng Xếp Hạng Top 10 Kỹ Năng SFIA trong O*NET */}
      <SfiaTopOnetLeaderboard
        topSkills={stats.topOnetMappedSkills}
        onSelectSkill={onSelectSkill}
      />
    </div>
  )
}
