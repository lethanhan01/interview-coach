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
  type SfiaCategory,
  type SfiaSkillSummary,
  type SfiaCoverageStats,
  type SfiaCategoryMetric,
  type SfiaLevelMetric,
  type SfiaTopOnetMappedSkill,
} from './types'
import {
  getCategoryTheme,
  getLevelTheme,
} from './sfia-theme'

export interface SfiaAnalyticsViewProps {
  stats: SfiaCoverageStats | null
  categories: SfiaCategory[]
  skills?: SfiaSkillSummary[]
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Tổng kỹ năng SFIA 9 */}
      <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-sm hover:border-brand/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-muted">
            Tổng kỹ năng SFIA 9
          </span>
          <div className="rounded-lg bg-brand/10 p-2 text-brand">
            <Layers className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tabular-nums tracking-tight">
              {stats.totalSkills}
            </span>
            <span className="text-xs text-ink-muted font-medium">kỹ năng</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-muted">
            <Badge variant="outline" className="font-mono text-[10px]">
              6 Danh mục
            </Badge>
            <span>•</span>
            <span className="truncate">22 Phân nhóm chuyên môn</span>
          </div>
        </div>
      </div>

      {/* KPI 2: Tỷ lệ phủ câu hỏi */}
      <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-sm hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-muted">
            Độ phủ câu hỏi phỏng vấn
          </span>
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
              {questionCoverageRate}%
            </span>
            <span className="text-xs text-ink-muted font-medium tabular-nums">
              ({stats.skillsWithQuestions}/{stats.totalSkills})
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 w-full bg-surface-inset rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, questionCoverageRate)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-ink-muted flex items-center justify-between">
            <span>Tổng số câu hỏi:</span>
            <strong className="text-ink tabular-nums font-semibold">
              {stats.totalQuestions} Qs
            </strong>
          </p>
        </div>
      </div>

      {/* KPI 3: Tỷ lệ map với nghề O*NET */}
      <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-sm hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-muted">
            Ánh xạ nghề nghiệp O*NET
          </span>
          <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-600 dark:text-cyan-400">
            <Briefcase className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums tracking-tight">
              {onetMappingRate}%
            </span>
            <span className="text-xs text-ink-muted font-medium tabular-nums">
              ({stats.skillsWithOnet}/{stats.totalSkills})
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 w-full bg-surface-inset rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, onetMappingRate)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-ink-muted flex items-center justify-between">
            <span>Tiêu chuẩn tham chiếu:</span>
            <span className="text-ink font-medium text-[10px]">O*NET SOC 2020</span>
          </p>
        </div>
      </div>

      {/* KPI 4: Điểm mù cần hành động */}
      <div
        className={cn(
          'flex flex-col justify-between rounded-xl border p-4 shadow-sm transition-all cursor-pointer',
          stats.blindSpotsCount > 0
            ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60 hover:bg-rose-500/10'
            : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
        )}
        onClick={onScrollToBlindSpots}
        title="Nhấp để cuộn nhanh đến Bảng Điểm mù"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
            Điểm mù cần hành động
            {stats.blindSpotsCount > 0 && (
              <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </span>
          <div className="rounded-lg bg-rose-500/15 p-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
              {stats.blindSpotsCount}
            </span>
            <span className="text-xs text-rose-700/80 dark:text-rose-300/80 font-medium">
              kỹ năng (0 câu hỏi)
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-rose-700/90 dark:text-rose-300/90 font-medium">
            <span>Ưu tiên bổ sung ngay</span>
            <span className="inline-flex items-center gap-0.5 text-xs text-rose-600 font-semibold group-hover:translate-x-0.5 transition-transform">
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
const SfiaCategoryDistributionChart = memo(function SfiaCategoryDistributionChart({
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
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-brand/10 p-1.5 text-brand">
              <FolderTree className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">
                Phân bổ & Độ phủ theo 6 Danh mục SFIA
              </h3>
              <p className="text-[11px] text-ink-muted">
                So sánh số lượng kỹ năng và số câu hỏi phỏng vấn trong từng nhóm
              </p>
            </div>
          </div>

          {selectedCategory && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectCategory?.(null)}
              className="h-7 text-xs gap-1 border-brand/40 text-brand hover:bg-brand/10"
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
            const questionRatio = Math.round((cat.questionCount / maxQuestions) * 100)

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
                  'group relative w-full text-left rounded-lg p-2.5 border transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  isSelected
                    ? 'border-brand bg-brand/5 ring-1 ring-brand shadow-sm'
                    : 'border-border/60 bg-surface-inset/40 hover:bg-surface-inset hover:border-border'
                )}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'size-2.5 rounded-full shrink-0',
                        theme.dot
                      )}
                    />
                    <span className="font-semibold text-ink truncate">
                      {cat.nameVi}
                    </span>
                    <span className="text-[10px] text-ink-muted hidden sm:inline">
                      ({cat.code})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-ink-muted text-[11px]">
                      <strong className="text-ink tabular-nums font-semibold">
                        {cat.skillCount}
                      </strong>{' '}
                      kỹ năng
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {cat.questionCount} Qs
                    </span>
                  </div>
                </div>

                {/* Progress Visual Bar */}
                <div className="relative w-full bg-surface-inset rounded-full h-2 overflow-hidden">
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

      <p className="mt-4 text-[11px] text-ink-muted flex items-center gap-1.5 italic border-t border-border/40 pt-3">
        <Info className="size-3.5 shrink-0 text-brand" />
        <span>Nhấp vào danh mục bất kỳ để lọc nhanh danh sách Điểm mù bên dưới.</span>
      </p>
    </div>
  )
})

/**
 * 3. Khối Biểu Đồ Phân Bổ Theo 7 Cấp Độ Trách Nhiệm (Level Distribution Meter)
 */
const SfiaLevelDistributionChart = memo(function SfiaLevelDistributionChart({
  levelDistribution,
  selectedLevel,
  onSelectLevel,
}: {
  levelDistribution: SfiaLevelMetric[]
  selectedLevel?: number | null
  onSelectLevel?: (level: number | null) => void
}) {
  const maxQuestions = Math.max(
    ...levelDistribution.map((l) => l.questionCount),
    1
  )

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-brand/10 p-1.5 text-brand">
              <SlidersHorizontal className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">
                Phân bổ câu hỏi theo 7 Cấp độ SFIA
              </h3>
              <p className="text-[11px] text-ink-muted">
                Tỷ lệ phủ câu hỏi từ Level 1 (Follow) đến Level 7 (Set strategy)
              </p>
            </div>
          </div>

          {selectedLevel !== null && selectedLevel !== undefined && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectLevel?.(null)}
              className="h-7 text-xs gap-1 border-brand/40 text-brand hover:bg-brand/10"
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
            const barWidth = Math.round((lvl.questionCount / maxQuestions) * 100)

            return (
              <button
                key={lvl.level}
                type="button"
                onClick={() =>
                  onSelectLevel?.(isSelected ? null : lvl.level)
                }
                aria-pressed={isSelected}
                aria-label={`Lọc theo Level ${lvl.level} (${levelInfo.name})`}
                className={cn(
                  'group relative w-full text-left rounded-lg p-2 border transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  isSelected
                    ? 'border-brand bg-brand/5 ring-1 ring-brand shadow-sm'
                    : 'border-border/60 bg-surface-inset/40 hover:bg-surface-inset hover:border-border'
                )}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-surface-raised border border-border text-ink">
                      L{lvl.level}
                    </span>
                    <span className="font-medium text-ink truncate">
                      {levelInfo.name}
                    </span>
                    <span className="text-[10px] text-ink-muted hidden sm:inline">
                      ({levelInfo.nameVi})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-ink-muted text-[11px] tabular-nums">
                      {lvl.activeCellCount} ô khả dụng
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {lvl.questionCount} Qs
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative w-full bg-surface-inset rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      lvl.level >= 5
                        ? 'bg-brand'
                        : lvl.level >= 3
                        ? 'bg-emerald-500'
                        : 'bg-cyan-500'
                    )}
                    style={{ width: `${Math.max(6, barWidth)}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-4 text-[11px] text-ink-muted flex items-center gap-1.5 italic border-t border-border/40 pt-3">
        <Info className="size-3.5 shrink-0 text-brand" />
        <span>Nhấp vào cấp độ để lọc kỹ năng có dải level tương ứng trong Bảng Điểm mù.</span>
      </p>
    </div>
  )
})

/**
 * 4. Khối Bảng Xếp Hạng Top 10 Kỹ Năng SFIA Phổ Biến Nhất trong O*NET
 */
const SfiaTopOnetLeaderboard = memo(function SfiaTopOnetLeaderboard({
  topSkills,
  onSelectSkill,
}: {
  topSkills: SfiaTopOnetMappedSkill[]
  onSelectSkill?: (skillCode: string) => void
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
            <Trophy className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">
              Top 10 Kỹ Năng SFIA Phổ Biến Nhất trong O*NET
            </h3>
            <p className="text-[11px] text-ink-muted">
              Xếp hạng theo số lượng vị trí nghề nghiệp O*NET SOC đang tích hợp
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/60">
        {topSkills.map((item, index) => {
          const theme = getCategoryTheme(item.categoryCode)
          const rank = index + 1

          return (
            <div
              key={item.skillCode}
              className="py-2.5 flex items-center justify-between gap-3 hover:bg-surface-inset/50 rounded-lg px-2 -mx-2 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank Badge */}
                <span
                  className={cn(
                    'size-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 tabular-nums',
                    rank === 1
                      ? 'bg-amber-500 text-white shadow-sm'
                      : rank === 2
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                      : rank === 3
                      ? 'bg-amber-700/80 text-white'
                      : 'bg-surface-inset text-ink-muted font-mono'
                  )}
                >
                  {rank}
                </span>

                {/* Skill Title & Badges */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink">
                      {item.skillCode}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] py-0 px-1.5', theme.badge)}
                    >
                      {item.categoryCode}
                    </Badge>
                  </div>
                  <p
                    className="text-xs text-ink-muted truncate max-w-[200px] sm:max-w-xs md:max-w-md"
                    title={item.skillName}
                  >
                    {item.skillName}
                  </p>
                </div>
              </div>

              {/* Stats & Jump Action */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right text-xs">
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {item.onetCount} nghề
                  </span>
                  <span className="text-[10px] text-ink-muted block tabular-nums">
                    ({item.coreCount} cốt lõi)
                  </span>
                </div>

                <div className="text-right text-xs hidden sm:block">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {item.questionCount} Qs
                  </span>
                  <span className="text-[10px] text-ink-muted block">
                    ngân hàng
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectSkill?.(item.skillCode)}
                  className="h-7 w-7 p-0 text-ink-muted hover:text-brand"
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
}: SfiaAnalyticsViewProps) {
  // 1. Trạng thái Loading Skeleton
  if (loading) {
    return (
      <div className={cn('flex flex-col gap-6 p-4 max-w-7xl mx-auto w-full animate-pulse', className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-inset border border-border" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="h-96 rounded-xl bg-surface-inset border border-border" />
          <div className="h-96 rounded-xl bg-surface-inset border border-border" />
        </div>
        <div className="h-72 rounded-xl bg-surface-inset border border-border" />
      </div>
    )
  }

  // 2. Trạng thái Báo lỗi
  if (error || !stats) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-12 text-center rounded-xl border border-destructive/30 bg-destructive/5 max-w-2xl mx-auto my-8', className)}>
        <AlertTriangle className="size-10 text-destructive mb-3" />
        <h3 className="text-base font-bold text-ink mb-1">
          Không thể tải dữ liệu Thống kê Phân tích SFIA
        </h3>
        <p className="text-xs text-ink-muted mb-4 max-w-md">
          {error || 'Dữ liệu thống kê độ phủ chưa sẵn sàng hoặc không thể kết nối tới nguồn dữ liệu.'}
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
    <div className={cn('flex flex-col gap-6 max-w-7xl mx-auto w-full', className)}>
      {/* 4 Thẻ KPI Đầu Trang */}
      <SfiaKpiCards
        stats={stats}
        onScrollToBlindSpots={onScrollToBlindSpots}
      />

      {/* Lưới 2 Biểu Đồ Phân Bổ (Danh Mục vs Cấp Độ) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
