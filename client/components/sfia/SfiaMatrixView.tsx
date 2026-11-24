'use client'

import React, { useMemo, memo } from 'react'
import { AlertCircle, Briefcase, SearchX } from 'lucide-react'
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
} from '@/types'
import { getCategoryTheme, getLevelTheme } from './sfia-theme'

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
        className="bg-surface-inset/30 text-ink-muted/30 flex h-14 select-none items-center justify-center text-xs transition-colors"
      >
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not available at Level {levelId}</span>
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
          aria-label={`${skill.code} Level ${levelId} (${levelInfo.name}), ${questionCount} questions, ${onetCount} O*NET occupations`}
          className={cn(
            'group relative flex h-14 w-full flex-col items-center justify-center rounded-lg border p-1 transition-all duration-150',
            'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            theme.cellActive,
            isInspected && 'ring-brand border-brand z-10 shadow-md ring-2',
            isBlindSpot &&
              'border-rose-500/50 bg-rose-500/10 ring-2 ring-rose-500/70 dark:bg-rose-500/20 dark:ring-rose-400/70'
          )}
        >
          {/* Main Level Label */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs font-bold tracking-tight">
              L{levelId}
            </span>
            {isBlindSpot && (
              <span
                title="Blind spot: No interview questions"
                className="size-1.5 animate-pulse rounded-full bg-rose-500"
              />
            )}
          </div>

          {/* Sub-badge depending on display mode */}
          <div className="mt-0.5 text-[10px] leading-tight">
            {displayMode === 'questions' &&
              (isBlindSpot ? (
                <span className="flex items-center gap-0.5 font-bold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="size-2.5" />0 Q
                </span>
              ) : (
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {questionCount} Qs
                </span>
              ))}

            {displayMode === 'onet' && (
              <span className="text-ink-muted flex items-center gap-0.5 font-medium">
                <Briefcase className="size-2.5" />
                {onetCount} SOC
              </span>
            )}

            {displayMode === 'level' && (
              <span className="text-ink-muted/80 max-w-[70px] truncate text-[9px]">
                {levelInfo.name}
              </span>
            )}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-2.5 text-xs">
        <div className="flex flex-col gap-1">
          <div className="border-border/40 flex items-center justify-between gap-2 border-b pb-1 font-semibold">
            <span className="text-brand-foreground font-mono">
              {skill.code}
            </span>
            <span className="text-[10px]">{levelInfo.shortName}</span>
          </div>
          <p className="text-[11px] font-medium leading-snug">{skill.name}</p>
          <div className="text-muted-foreground border-border/30 flex items-center justify-between gap-3 border-t pt-1 text-[10px]">
            <span className={cn(isBlindSpot && 'font-bold text-rose-400')}>
              Questions: {questionCount}
            </span>
            <span>O*NET Occupations: {onetCount}</span>
          </div>
          <p className="text-muted-foreground/80 mt-0.5 text-[9px] italic">
            Click to view details & create question
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
      className="hover:bg-surface-raised/40 border-border/50 group border-b transition-colors"
    >
      {/* Sticky Skill Info Column (Left) */}
      <th
        scope="row"
        className="bg-card group-hover:bg-surface-raised/80 border-border/80 sticky left-0 z-10 min-w-[220px] max-w-[260px] border-r p-2.5 text-left transition-colors"
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold',
                theme.badge
              )}
            >
              {skill.code}
            </span>
            <span className="text-ink-muted font-mono text-[10px]">
              L{skill.minLevel}-{skill.maxLevel}
            </span>
          </div>
          <span
            className="text-ink max-w-[220px] truncate text-xs font-medium"
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
          inspectedCell?.skillCode === skill.code &&
          inspectedCell?.levelId === lvl

        return (
          <td key={lvl} className="min-w-[90px] p-1 text-center align-middle">
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

  // Empty State when no skills match filters
  if (filteredSkills.length === 0) {
    return (
      <div
        data-testid="matrix-empty-state"
        className={cn(
          'bg-card border-border/80 flex min-h-[360px] flex-col items-center justify-center rounded-xl border p-12 text-center',
          className
        )}
      >
        <div className="bg-surface-inset text-ink-muted border-border mb-3 rounded-full border p-3.5">
          <SearchX className="size-8" />
        </div>
        <h3 className="text-ink mb-1 text-sm font-bold">
          {blindSpotsOnly
            ? 'No blind spots detected in the selected filter group'
            : 'No matching SFIA skills found'}
        </h3>
        <p className="text-ink-muted mb-4 max-w-sm text-xs leading-relaxed">
          {blindSpotsOnly
            ? 'All capability cells in the visible range already have at least one interview question in the repository.'
            : 'Try adjusting your search query or selecting another category to see results.'}
        </p>
        {onClearFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            Clear filters
          </Button>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          'border-border/80 bg-card relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm',
          className
        )}
      >
        {/* Single-Viewport Scrollable Container */}
        <div className="h-full min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs">
            {/* Sticky Table Header */}
            <thead>
              <tr className="border-border bg-surface-raised/95 border-b backdrop-blur">
                {/* Sticky Top-Left Corner Header */}
                <th
                  scope="col"
                  className="bg-surface-raised text-ink border-border shadow-xs sticky left-0 top-0 z-30 min-w-[220px] max-w-[260px] border-r p-3 text-left font-bold"
                >
                  <div className="flex items-center justify-between">
                    <span>SFIA 9 Skills</span>
                    <span className="text-ink-muted text-[10px] font-normal">
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
                      className="bg-surface-raised border-border/40 shadow-xs sticky top-0 z-20 min-w-[90px] border-r p-2 text-center font-bold last:border-r-0"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-ink font-mono text-xs font-bold">
                          L{lvl}
                        </span>
                        <span className="text-ink-muted max-w-[80px] truncate text-[10px] font-normal">
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
                      className="bg-surface-raised/70 border-border border-y"
                    >
                      <td
                        colSpan={8}
                        className={cn(
                          'text-ink border-l-4 p-2 pl-3 text-xs font-semibold',
                          theme.border,
                          theme.bgLight
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'size-2 shrink-0 rounded-full',
                              theme.dot
                            )}
                          />
                          <span className="text-ink font-bold">
                            {category.name || category.nameVi}
                          </span>
                          <span className="text-ink-muted font-mono text-[10px] font-normal">
                            ({categorySkills.length} skills)
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
