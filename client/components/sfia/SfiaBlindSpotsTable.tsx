'use client'

import React, { useState, useMemo, useEffect, memo } from 'react'
import {
  Search,
  X,
  Download,
  AlertTriangle,
  Plus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  SearchX,
  Flame,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip'
import {
  type SfiaCategory,
  type SfiaSkillSummary,
} from './types'
import {
  SFIA_CATEGORY_THEMES,
  getCategoryTheme,
  getLevelTheme,
} from './sfia-theme'
import { getBlindSpotPriority } from './sfia-analytics-export'

export interface SfiaBlindSpotsTableProps {
  skills: SfiaSkillSummary[]
  categories: SfiaCategory[]
  selectedCategoryFilter?: string | null
  selectedLevelFilter?: number | null
  onSelectCategoryFilter?: (categoryCode: string | null) => void
  onSelectLevelFilter?: (level: number | null) => void
  onCreateQuestion: (skill: SfiaSkillSummary) => void
  onSelectSkill: (skillCode: string) => void
  onExportCsv?: () => void
  isExportingCsv?: boolean
  className?: string
}

const PAGE_SIZE = 10

export function SfiaBlindSpotsTable({
  skills,
  categories,
  selectedCategoryFilter = null,
  selectedLevelFilter = null,
  onSelectCategoryFilter,
  onSelectLevelFilter,
  onCreateQuestion,
  onSelectSkill,
  onExportCsv,
  isExportingCsv = false,
  className,
}: SfiaBlindSpotsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // 1. Lọc tất cả kỹ năng Điểm mù (questionCount === 0)
  const allBlindSpots = useMemo(() => {
    return skills.filter((s) => s.questionCount === 0)
  }, [skills])

  // 2. Lọc kỹ năng theo tìm kiếm, danh mục và cấp độ
  const filteredSkills = useMemo(() => {
    let result = allBlindSpots

    // Lọc theo Danh mục
    if (selectedCategoryFilter) {
      result = result.filter((s) => s.categoryCode === selectedCategoryFilter)
    }

    // Lọc theo Cấp độ
    if (selectedLevelFilter !== null && selectedLevelFilter !== undefined) {
      result = result.filter(
        (s) =>
          s.minLevel <= selectedLevelFilter && selectedLevelFilter <= s.maxLevel
      )
    }

    // Lọc theo Từ khóa tìm kiếm (Mã code hoặc Tên kỹ năng)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (s) =>
          s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      )
    }

    return result
  }, [allBlindSpots, selectedCategoryFilter, selectedLevelFilter, searchQuery])

  // Tự động chuyển về trang 1 khi thay đổi điều kiện lọc
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategoryFilter, selectedLevelFilter, searchQuery])

  // 3. Tính toán phân trang Client-side (10 items / trang)
  const totalItems = filteredSkills.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(totalItems, startIndex + PAGE_SIZE)
  const paginatedSkills = useMemo(() => {
    return filteredSkills.slice(startIndex, endIndex)
  }, [filteredSkills, startIndex, endIndex])

  // Trạng thái có đang kích hoạt bộ lọc nào không
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedCategoryFilter ||
      (selectedLevelFilter !== null && selectedLevelFilter !== undefined)
  )

  const handleClearAllFilters = () => {
    setSearchQuery('')
    onSelectCategoryFilter?.(null)
    onSelectLevelFilter?.(null)
  }

  // All skills covered state
  if (allBlindSpots.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center',
          className
        )}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
          <CheckCircle2 className="size-6" />
        </div>
        <h3 className="text-base font-bold text-ink mb-1">
          Outstanding! No skill blind spots remaining
        </h3>
        <p className="text-xs text-ink-muted max-w-md mx-auto">
          100% of SFIA 9 skills have at least one sample interview question in the Question Bank.
        </p>
      </div>
    )
  }

  return (
    <div
      id="sfia-blind-spots-table-container"
      className={cn(
        'rounded-xl border border-border/80 bg-card shadow-sm flex flex-col',
        className
      )}
    >
      {/* 1. Header & Toolbar Controls */}
      <div className="p-4 border-b border-border/80 flex flex-col gap-3">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink">
                  Blind Spots Warning Table
                </h3>
                <Badge
                  variant="outline"
                  className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 tabular-nums text-[10px] font-semibold"
                >
                  {allBlindSpots.length} blind spots
                </Badge>
              </div>
              <p className="text-[11px] text-ink-muted">
                SFIA skills without interview questions in the Question Bank
              </p>
            </div>
          </div>

          {/* Export CSV Button */}
          {onExportCsv && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              disabled={isExportingCsv}
              className="gap-1.5 text-xs h-8 shrink-0 self-start sm:self-auto"
            >
              <Download className="size-3.5" />
              <span>{isExportingCsv ? 'Exporting CSV...' : 'Export Blind Spots CSV'}</span>
            </Button>
          )}
        </div>

        {/* Filters Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* Search Input */}
          <div className="sm:col-span-6 lg:col-span-5 relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code (PROG) or skill name..."
              leadingIcon={<Search className="size-4 text-ink-muted" />}
              trailingAction={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search query"
                    className="text-ink-muted hover:text-ink absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null
              }
              className="h-8 text-xs"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="sm:col-span-3 lg:col-span-4">
            <Select
              value={selectedCategoryFilter || 'ALL'}
              onValueChange={(val) =>
                onSelectCategoryFilter?.(val === 'ALL' ? null : val)
              }
            >
              <SelectTrigger
                aria-label="Filter by SFIA category"
                className="h-8 text-xs"
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <span className="font-medium">All Categories (6)</span>
                </SelectItem>
                {categories.map((cat) => {
                  const theme = getCategoryTheme(cat.code)
                  return (
                    <SelectItem key={cat.code} value={cat.code}>
                      <div className="flex items-center gap-2">
                        <span className={cn('size-2 rounded-full shrink-0', theme.dot)} />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Level Dropdown Filter */}
          <div className="sm:col-span-3 lg:col-span-3">
            <Select
              value={
                selectedLevelFilter !== null && selectedLevelFilter !== undefined
                  ? String(selectedLevelFilter)
                  : 'ALL'
              }
              onValueChange={(val) =>
                onSelectLevelFilter?.(val === 'ALL' ? null : Number(val))
              }
            >
              <SelectTrigger
                aria-label="Filter by SFIA level"
                className="h-8 text-xs"
              >
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <span className="font-medium">All Levels (1-7)</span>
                </SelectItem>
                {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
                  const info = getLevelTheme(lvl)
                  return (
                    <SelectItem key={lvl} value={String(lvl)}>
                      <span>
                        L{lvl} — {info.name}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[11px] text-ink-muted flex items-center gap-1">
              <Filter className="size-3" /> Filtering by:
            </span>

            {searchQuery && (
              <Badge
                variant="outline"
                className="gap-1 bg-surface-inset text-ink text-[11px]"
              >
                <span>Keyword: &quot;{searchQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear keyword filter"
                  className="hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}

            {selectedCategoryFilter && (
              <Badge
                variant="outline"
                className="gap-1 bg-surface-inset text-ink text-[11px]"
              >
                <span>
                  Category:{' '}
                  {categories.find((c) => c.code === selectedCategoryFilter)?.name ||
                    selectedCategoryFilter}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectCategoryFilter?.(null)}
                  aria-label="Clear category filter"
                  className="hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}

            {selectedLevelFilter !== null && selectedLevelFilter !== undefined && (
              <Badge
                variant="outline"
                className="gap-1 bg-surface-inset text-ink text-[11px]"
              >
                <span>Level {selectedLevelFilter}</span>
                <button
                  type="button"
                  onClick={() => onSelectLevelFilter?.(null)}
                  aria-label="Clear level filter"
                  className="hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="h-6 text-[11px] text-ink-muted hover:text-ink px-1.5"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* 2. Table Data Body */}
      {filteredSkills.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center">
          <SearchX className="size-8 text-ink-muted mb-2" />
          <h4 className="text-sm font-semibold text-ink">
            No matching blind spots found
          </h4>
          <p className="text-xs text-ink-muted max-w-sm mt-1 mb-3">
            Try adjusting search keywords or reset category and level filters.
          </p>
          <Button variant="outline" size="sm" onClick={handleClearAllFilters}>
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-inset/50 text-ink-muted text-[11px] font-semibold">
                <th className="py-2.5 px-3">Skill Code</th>
                <th className="py-2.5 px-3">Skill Name</th>
                <th className="py-2.5 px-3">SFIA Category</th>
                <th className="py-2.5 px-3 text-center">Level Span</th>
                <th className="py-2.5 px-3 text-center">O*NET Demand</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedSkills.map((skill) => {
                const theme = getCategoryTheme(skill.categoryCode)
                const priority = getBlindSpotPriority(skill.onetCount)

                return (
                  <tr
                    key={skill.code}
                    className="hover:bg-surface-inset/50 transition-colors group"
                  >
                    {/* Code Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectSkill(skill.code)}
                        data-testid={`skill-code-${skill.code}`}
                        aria-label={`Skill code ${skill.code}`}
                        className="font-mono font-bold text-xs text-brand hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                        title={`View details for ${skill.code} in Taxonomy Tree`}
                      >
                        <span>{skill.code}</span>
                        <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>

                    {/* Skill Name */}
                    <td className="py-2.5 px-3 max-w-xs sm:max-w-sm">
                      <div className="font-medium text-ink truncate" title={skill.name}>
                        {skill.name}
                      </div>
                      <span className="text-[10px] text-ink-muted font-mono">
                        {skill.subcategoryCode}
                      </span>
                    </td>

                    {/* Category Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] py-0 px-2 font-medium', theme.badge)}
                      >
                        {skill.categoryCode}
                      </Badge>
                    </td>

                    {/* Level Range */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="font-mono text-xs text-ink-muted font-medium bg-surface-inset px-2 py-0.5 rounded border border-border/60 tabular-nums">
                        L{skill.minLevel} — L{skill.maxLevel}
                      </span>
                    </td>

                    {/* O*NET Demand Count */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">
                        {skill.onetCount >= 8 && (
                           <Flame className="size-3 text-rose-500 fill-rose-500" />
                        )}
                        <span>{skill.onetCount} occupations</span>
                      </span>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-semibold py-0.5',
                          priority.level === 'HIGH' &&
                            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
                          priority.level === 'MEDIUM' &&
                            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
                          priority.level === 'STANDARD' &&
                            'bg-surface-inset text-ink-muted border-border'
                        )}
                      >
                        {priority.labelVi}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCreateQuestion(skill)}
                          className="h-7 text-xs gap-1 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50"
                        >
                          <Plus className="size-3" />
                          <span>Create Question</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectSkill(skill.code)}
                          className="h-7 w-7 p-0 text-ink-muted hover:text-brand"
                          title="View full skill definition in SFIA Tree"
                        >
                          <ExternalLink className="size-3.5" />
                          <span className="sr-only">View details for {skill.code}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Pagination Controls Footer */}
      {filteredSkills.length > 0 && (
        <div className="p-3 border-t border-border/80 bg-surface-inset/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div data-testid="pagination-summary" className="text-ink-muted text-[11px] tabular-nums">
            Showing <strong className="text-ink">{startIndex + 1}</strong> -{' '}
            <strong className="text-ink">{endIndex}</strong> of{' '}
            <strong className="text-ink">{totalItems}</strong> blind spots
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                aria-label="Previous page"
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="size-3.5" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>

              <div className="flex items-center gap-1 mx-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === safeCurrentPage ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      aria-label={`Page ${pageNum}`}
                      className="h-7 w-7 p-0 text-xs tabular-nums"
                    >
                      {pageNum}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                aria-label="Next page"
                className="h-7 px-2 text-xs"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
