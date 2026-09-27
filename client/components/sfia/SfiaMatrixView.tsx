'use client'

import React, { useMemo, memo } from 'react'
import {
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Briefcase,
  SearchX,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip'
import {
  type SfiaCategory,
  type SfiaSkillSummary,
  type SfiaMatrixCellData,
  type SfiaMatrixDisplayMode,
} from './types'
import {
  SFIA_CATEGORY_THEMES,
  SFIA_LEVEL_DEFINITIONS,
  getCategoryTheme,
  getLevelTheme,
} from './sfia-theme'

export interface SfiaMatrixViewProps {
  skills: SfiaSkillSummary[]
  categories: SfiaCategory[]
  cells: Record<string, SfiaMatrixCellData>
  displayMode?: SfiaMatrixDisplayMode
  blindSpotsOnly?: boolean
  inspectedCell?: { skillCode: string; levelId: number } | null
  onSelectCell: (skillCode: string, levelId: number) => void
  onClearFilters?: () => void
  className?: string
}

interface SfiaMatrixCellProps {
  skill: SfiaSkillSummary
  levelId: number
  cellData?: SfiaMatrixCellData
  displayMode: SfiaMatrixDisplayMode
  isInspected: boolean
  onSelect: (skillCode: string, levelId: number) => void
}

const SfiaMatrixCell = memo(function SfiaMatrixCell({
  skill,
  levelId,
  cellData,
  displayMode,
  isInspected,
  onSelect,
}: SfiaMatrixCellProps) {
  const isAvailable = levelId >= skill.minLevel && levelId <= skill.maxLevel
  const levelInfo = getLevelTheme(levelId)
  const theme = getCategoryTheme(skill.categoryCode)

  if (!isAvailable) {
    return (
      <div
        data-testid={`cell-${skill.code}-L${levelId}-inactive`}
        className="h-14 flex items-center justify-center bg-surface-inset/30 text-ink-muted/30 select-none text-xs transition-colors"
      >
        <span aria-hidden="true">—</span>
        <span className="sr-only">Không khả dụng ở Level {levelId}</span>
      </div>
    )
  }

  const questionCount = cellData?.questionCount ?? 0
  const onetCount = cellData?.onetCount ?? 0
  const isBlindSpot = questionCount === 0

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-testid={`cell-${skill.code}-L${levelId}`}
          onClick={() => onSelect(skill.code, levelId)}
          aria-label={`${skill.code} Level ${levelId} (${levelInfo.name}), ${questionCount} câu hỏi, ${onetCount} nghề O*NET`}
          className={cn(
            'group relative flex h-14 w-full flex-col items-center justify-center rounded-lg border p-1 transition-all duration-150',
            'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            theme.cellActive,
            isInspected && 'ring-2 ring-brand shadow-md z-10 border-brand',
            isBlindSpot &&
              'ring-2 ring-rose-500/70 dark:ring-rose-400/70 border-rose-500/50 bg-rose-500/10 dark:bg-rose-500/20'
          )}
        >
          {/* Main Level Label */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs font-bold tracking-tight">
              L{levelId}
            </span>
            {isBlindSpot && (
              <span
                title="Điểm mù: Chưa có câu hỏi phỏng vấn"
                className="size-1.5 rounded-full bg-rose-500 animate-pulse"
              />
            )}
          </div>

          {/* Sub-badge depending on display mode */}
          <div className="mt-0.5 text-[10px] leading-tight">
            {displayMode === 'questions' && (
              isBlindSpot ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                  <AlertCircle className="size-2.5" />
                  0 Q
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                  {questionCount} Qs
                </span>
              )
            )}

            {displayMode === 'onet' && (
              <span className="text-ink-muted font-medium flex items-center gap-0.5">
                <Briefcase className="size-2.5" />
                {onetCount} SOC
              </span>
            )}

            {displayMode === 'level' && (
              <span className="text-ink-muted/80 text-[9px] truncate max-w-[70px]">
                {levelInfo.name}
              </span>
            )}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs p-2.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1 font-semibold">
            <span className="text-brand-foreground font-mono">{skill.code}</span>
            <span className="text-[10px]">{levelInfo.shortName}</span>
          </div>
          <p className="text-[11px] font-medium leading-snug">
            {skill.name}
          </p>
          <div className="text-[10px] text-muted-foreground flex items-center justify-between gap-3 pt-1 border-t border-border/30">
            <span className={cn(isBlindSpot && 'text-rose-400 font-bold')}>
              Câu hỏi: {questionCount}
            </span>
            <span>Nghề O*NET: {onetCount}</span>
          </div>
          <p className="text-[9px] text-muted-foreground/80 italic mt-0.5">
            Nhấp để mở chi tiết & tạo câu hỏi
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
})

interface SfiaMatrixRowProps {
  skill: SfiaSkillSummary
  cells: Record<string, SfiaMatrixCellData>
  displayMode: SfiaMatrixDisplayMode
  inspectedCell?: { skillCode: string; levelId: number } | null
  onSelectCell: (skillCode: string, levelId: number) => void
}

const SfiaMatrixRow = memo(function SfiaMatrixRow({
  skill,
  cells,
  displayMode,
  inspectedCell,
  onSelectCell,
}: SfiaMatrixRowProps) {
  const theme = getCategoryTheme(skill.categoryCode)

  return (
    <tr
      data-testid={`matrix-row-${skill.code}`}
      className="group hover:bg-surface-raised/40 transition-colors border-b border-border/50"
    >
      {/* Sticky Skill Info Column (Left) */}
      <th
        scope="row"
        className="sticky left-0 z-10 bg-card group-hover:bg-surface-raised/80 min-w-[220px] max-w-[260px] p-2.5 text-left border-r border-border/80 transition-colors"
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'rounded px-1.5 py-0.5 font-mono text-[11px] font-bold border',
                theme.badge
              )}
            >
              {skill.code}
            </span>
            <span className="font-mono text-[10px] text-ink-muted">
              L{skill.minLevel}-{skill.maxLevel}
            </span>
          </div>
          <span
            className="text-xs font-medium text-ink truncate max-w-[220px]"
            title={skill.name}
          >
            {skill.name}
          </span>
        </div>
      </th>

      {/* 7 Level Columns (L1 -> L7) */}
      {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
        const cellKey = `${skill.code}_L${lvl}`
        const cellData = cells[cellKey]
        const isInspected =
          inspectedCell?.skillCode === skill.code && inspectedCell?.levelId === lvl

        return (
          <td key={lvl} className="p-1 min-w-[90px] text-center align-middle">
            <SfiaMatrixCell
              skill={skill}
              levelId={lvl}
              cellData={cellData}
              displayMode={displayMode}
              isInspected={isInspected}
              onSelect={onSelectCell}
            />
          </td>
        )
      })}
    </tr>
  )
})

export function SfiaMatrixView({
  skills,
  categories,
  cells,
  displayMode = 'level',
  blindSpotsOnly = false,
  inspectedCell = null,
  onSelectCell,
  onClearFilters,
  className,
}: SfiaMatrixViewProps) {
  // Lọc danh sách kỹ năng theo điều kiện:
  // Nếu bật blindSpotsOnly: Chỉ giữ các kỹ năng có ít nhất 1 ô khả dụng mà questionCount === 0
  const filteredSkills = useMemo(() => {
    if (!blindSpotsOnly) return skills

    return skills.filter((skill) => {
      for (let lvl = skill.minLevel; lvl <= skill.maxLevel; lvl++) {
        const cell = cells[`${skill.code}_L${lvl}`]
        if (!cell || cell.questionCount === 0) {
          return true
        }
      }
      return false
    })
  }, [skills, cells, blindSpotsOnly])

  // Nhóm các kỹ năng theo Danh mục
  const groupedSkills = useMemo(() => {
    const map = new Map<string, SfiaSkillSummary[]>()
    for (const cat of categories) {
      map.set(cat.code, [])
    }

    for (const skill of filteredSkills) {
      const list = map.get(skill.categoryCode)
      if (list) {
        list.push(skill)
      } else {
        map.set(skill.categoryCode, [skill])
      }
    }

    return map
  }, [categories, filteredSkills])

  // Trạng thái trống (Empty State khi không có kỹ năng nào phù hợp)
  if (filteredSkills.length === 0) {
    return (
      <div
        data-testid="matrix-empty-state"
        className={cn(
          'flex flex-col items-center justify-center p-12 text-center bg-card border border-border/80 rounded-xl min-h-[360px]',
          className
        )}
      >
        <div className="bg-surface-inset text-ink-muted p-3.5 rounded-full mb-3 border border-border">
          <SearchX className="size-8" />
        </div>
        <h3 className="text-sm font-bold text-ink mb-1">
          {blindSpotsOnly
            ? 'Không phát hiện điểm mù nào trong nhóm kỹ năng đã chọn'
            : 'Không tìm thấy kỹ năng SFIA nào phù hợp'}
        </h3>
        <p className="text-xs text-ink-muted max-w-sm mb-4 leading-relaxed">
          {blindSpotsOnly
            ? 'Toàn bộ các ô năng lực trong dải hiển thị đều đã có ít nhất một câu hỏi phỏng vấn trong ngân hàng dữ liệu.'
            : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác để xem kết quả.'}
        </p>
        {onClearFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          'relative flex flex-col flex-1 h-full min-h-0 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm',
          className
        )}
      >
        {/* Single-Viewport Scrollable Container */}
        <div className="overflow-auto flex-1 h-full min-h-0">
          <table className="w-full border-collapse text-xs">
            {/* Sticky Table Header */}
            <thead>
              <tr className="border-b border-border bg-surface-raised/95 backdrop-blur">
                {/* Sticky Top-Left Corner Header */}
                <th
                  scope="col"
                  className="sticky left-0 top-0 z-30 bg-surface-raised min-w-[220px] max-w-[260px] p-3 text-left font-bold text-ink border-r border-border shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span>Kỹ Năng SFIA 9</span>
                    <span className="text-[10px] text-ink-muted font-normal">
                      ({filteredSkills.length})
                    </span>
                  </div>
                </th>

                {/* 7 Level Headers (Sticky Top) */}
                {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
                  const def = getLevelTheme(lvl)
                  return (
                    <th
                      key={lvl}
                      scope="col"
                      className="sticky top-0 z-20 bg-surface-raised min-w-[90px] p-2 text-center font-bold border-r border-border/40 last:border-r-0 shadow-xs"
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-xs font-bold text-ink">
                          L{lvl}
                        </span>
                        <span className="text-[10px] font-normal text-ink-muted truncate max-w-[80px]">
                          {def.name}
                        </span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            {/* Table Body Grouped by Categories */}
            <tbody>
              {categories.map((category) => {
                const categorySkills = groupedSkills.get(category.code) || []
                if (categorySkills.length === 0) return null

                const theme = getCategoryTheme(category.code)

                return (
                  <React.Fragment key={category.code}>
                    {/* Category Separator Banner Row */}
                    <tr
                      data-testid={`category-header-${category.code}`}
                      className="bg-surface-raised/70 border-y border-border"
                    >
                      <td
                        colSpan={8}
                        className={cn(
                          'p-2 pl-3 font-semibold text-xs text-ink border-l-4',
                          theme.border,
                          theme.bgLight
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn('size-2 rounded-full shrink-0', theme.dot)}
                          />
                          <span className="font-bold text-ink">
                            {category.nameVi || category.name}
                          </span>
                          <span className="font-mono text-[10px] text-ink-muted font-normal">
                            ({categorySkills.length} kỹ năng)
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Skill Rows */}
                    {categorySkills.map((skill) => (
                      <SfiaMatrixRow
                        key={skill.code}
                        skill={skill}
                        cells={cells}
                        displayMode={displayMode}
                        inspectedCell={inspectedCell}
                        onSelectCell={onSelectCell}
                      />
                    ))}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  )
}
