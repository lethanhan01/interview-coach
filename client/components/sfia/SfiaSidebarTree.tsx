'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Search,
  X,
  SearchX,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Folder,
  Layers,
  Filter,
  ChevronsUpDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  type SfiaCategory,
  type SfiaSubcategory,
  type SfiaSkillSummary,
  SFIA_CATEGORY_THEMES,
  SFIA_LEVEL_DEFINITIONS,
  getCategoryTheme,
} from './index'

export interface SfiaSidebarTreeProps {
  categories: SfiaCategory[]
  subcategories: SfiaSubcategory[]
  skills: SfiaSkillSummary[]
  selectedSkill: string
  selectedLevel: number
  onSelectSkill: (skillCode: string, targetLevel?: number) => void
  className?: string
}

export function SfiaSidebarTree({
  categories,
  subcategories,
  skills,
  selectedSkill,
  selectedLevel,
  onSelectSkill,
  className,
}: SfiaSidebarTreeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all')

  // Find the category and subcategory of the selected skill
  const currentSkillInfo = useMemo(() => {
    return skills.find((s) => s.code === selectedSkill)
  }, [skills, selectedSkill])

  // Expanded categories & subcategories sets
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set())

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Initialize expansion with selected skill's category & subcategory on mount or skill change
  useEffect(() => {
    if (currentSkillInfo) {
      setExpandedCategories((prev) => {
        const next = new Set(prev)
        next.add(currentSkillInfo.categoryCode)
        return next
      })
      setExpandedSubcategories((prev) => {
        const next = new Set(prev)
        next.add(currentSkillInfo.subcategoryCode)
        return next
      })
    }
  }, [currentSkillInfo])

  // Global keyboard shortcut to focus search: Ctrl+K, Cmd+K or "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      if (isInput) return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === '/' && !isInput) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filter skills based on search query and level
  const { filteredSkills, matchedCategoryCodes, matchedSubcategoryCodes } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const isLevelActive = levelFilter !== 'all'

    const matchedSkills = skills.filter((skill) => {
      // Level check
      if (isLevelActive && (skill.minLevel > levelFilter || skill.maxLevel < levelFilter)) {
        return false
      }

      // Search query check
      if (!q) return true

      const matchCode = skill.code.toLowerCase().includes(q)
      const matchName = skill.name.toLowerCase().includes(q)
      return matchCode || matchName
    })

    const catCodes = new Set<string>()
    const subCodes = new Set<string>()

    matchedSkills.forEach((s) => {
      catCodes.add(s.categoryCode)
      subCodes.add(s.subcategoryCode)
    })

    return {
      filteredSkills: matchedSkills,
      matchedCategoryCodes: catCodes,
      matchedSubcategoryCodes: subCodes,
    }
  }, [skills, searchQuery, levelFilter])

  // Auto-expand branches when searching or filtering
  useEffect(() => {
    const isSearching = searchQuery.trim().length > 0 || levelFilter !== 'all'
    if (isSearching) {
      setExpandedCategories(new Set(matchedCategoryCodes))
      setExpandedSubcategories(new Set(matchedSubcategoryCodes))
    }
  }, [searchQuery, levelFilter, matchedCategoryCodes, matchedSubcategoryCodes])

  // Expand / Collapse all handlers
  const handleExpandAll = useCallback(() => {
    setExpandedCategories(new Set(categories.map((c) => c.code)))
    setExpandedSubcategories(new Set(subcategories.map((s) => s.code)))
  }, [categories, subcategories])

  const handleCollapseAll = useCallback(() => {
    setExpandedCategories(new Set())
    setExpandedSubcategories(new Set())
  }, [])

  // Toggle category
  const toggleCategory = useCallback((catCode: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catCode)) {
        next.delete(catCode)
      } else {
        next.add(catCode)
      }
      return next
    })
  }, [])

  // Toggle subcategory
  const toggleSubcategory = useCallback((subCode: string) => {
    setExpandedSubcategories((prev) => {
      const next = new Set(prev)
      if (next.has(subCode)) {
        next.delete(subCode)
      } else {
        next.add(subCode)
      }
      return next
    })
  }, [])

  // Handle skill selection with Level Clamping
  const handleSkillClick = useCallback(
    (skill: SfiaSkillSummary) => {
      let targetLevel = selectedLevel
      if (selectedLevel < skill.minLevel || selectedLevel > skill.maxLevel) {
        targetLevel = skill.minLevel
      }
      onSelectSkill(skill.code, targetLevel)
    },
    [selectedLevel, onSelectSkill]
  )

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery('')
    setLevelFilter('all')
    searchInputRef.current?.focus()
  }, [])

  // Pre-index subcategories by category
  const subcategoriesByCategory = useMemo(() => {
    const map: Record<string, SfiaSubcategory[]> = {}
    categories.forEach((cat) => {
      map[cat.code] = subcategories.filter((sub) => sub.categoryCode === cat.code)
    })
    return map
  }, [categories, subcategories])

  // Pre-index filtered skills by subcategory
  const skillsBySubcategory = useMemo(() => {
    const map: Record<string, SfiaSkillSummary[]> = {}
    subcategories.forEach((sub) => {
      map[sub.code] = filteredSkills.filter((s) => s.subcategoryCode === sub.code)
    })
    return map
  }, [subcategories, filteredSkills])

  // Total count of all skills by category & subcategory (for count badge x/total)
  const totalSkillsCountMap = useMemo(() => {
    const catMap: Record<string, number> = {}
    const subMap: Record<string, number> = {}

    skills.forEach((s) => {
      catMap[s.categoryCode] = (catMap[s.categoryCode] || 0) + 1
      subMap[s.subcategoryCode] = (subMap[s.subcategoryCode] || 0) + 1
    })

    return { catMap, subMap }
  }, [skills])

  const isFilterActive = searchQuery.trim().length > 0 || levelFilter !== 'all'

  return (
    <div
      className={cn(
        'bg-card border border-border/80 rounded-xl flex flex-col h-full overflow-hidden shadow-sm',
        className
      )}
    >
      {/* Top Toolbar: Search & Level Filter */}
      <div className="p-3 border-b border-border/60 flex flex-col gap-2.5 bg-surface-raised/20 shrink-0">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã (PROG) hoặc tên kỹ năng..."
            leadingIcon={<Search className="size-4 text-ink-muted" />}
            trailingAction={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="size-6 flex items-center justify-center rounded-md hover:bg-surface text-ink-muted hover:text-ink mr-2 transition-colors"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <span className="text-[10px] font-mono text-ink-muted border border-border/60 bg-surface px-1.5 py-0.5 rounded mr-2 hidden sm:inline-block">
                  Ctrl+K
                </span>
              )
            }
            className="h-9 text-xs bg-surface"
          />
        </div>

        {/* Filter Row: Level Dropdown & Expand/Collapse */}
        <div className="flex items-center gap-2">
          {/* Level Filter Selector */}
          <div className="relative flex-1">
            <select
              value={levelFilter}
              onChange={(e) => {
                const val = e.target.value
                setLevelFilter(val === 'all' ? 'all' : Number(val))
              }}
              className="w-full h-8 text-xs bg-surface border border-border/70 rounded-lg px-2.5 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-brand"
              aria-label="Lọc theo cấp độ SFIA"
            >
              <option value="all">⚡ Tất cả cấp độ (L1 - L7)</option>
              <option value="1">Level 1 — Follow (Theo dõi)</option>
              <option value="2">Level 2 — Assist (Hỗ trợ)</option>
              <option value="3">Level 3 — Apply (Áp dụng độc lập)</option>
              <option value="4">Level 4 — Enable (Chủ động & Tạo điều kiện)</option>
              <option value="5">Level 5 — Ensure (Đảm bảo & Quản lý)</option>
              <option value="6">Level 6 — Initiate (Khởi xướng & Lãnh đạo)</option>
              <option value="7">Level 7 — Strategy (Định hình chiến lược)</option>
            </select>
          </div>

          {/* Expand / Collapse All Toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpandAll}
              className="h-8 px-2 text-[11px] font-medium"
              title="Mở rộng tất cả các nhánh"
            >
              Mở hết
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCollapseAll}
              className="h-8 px-2 text-[11px] font-medium"
              title="Thu gọn tất cả các nhánh"
            >
              Gập lại
            </Button>
          </div>
        </div>

        {/* Live Filter Result Bar */}
        <div className="flex items-center justify-between text-[11px] text-ink-muted pt-0.5">
          <div className="flex items-center gap-1.5">
            <Layers className="size-3 text-brand" />
            <span>
              {isFilterActive ? (
                <span>
                  Khớp <strong className="text-ink font-semibold">{filteredSkills.length}</strong> / {skills.length} kỹ năng
                </span>
              ) : (
                <span>
                  Tổng số <strong className="text-ink font-semibold">{skills.length}</strong> kỹ năng SFIA 9
                </span>
              )}
            </span>
          </div>

          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="text-brand hover:underline flex items-center gap-1 text-[10px] font-semibold"
            >
              <RotateCcw className="size-2.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Tree Content (Independent Scrollable Container) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-border/40">
        {/* Empty State when no matches */}
        {filteredSkills.length === 0 ? (
          <div className="p-6 text-center flex flex-col items-center justify-center gap-2.5 my-4">
            <div className="size-10 rounded-full bg-surface-raised flex items-center justify-center text-ink-muted">
              <SearchX className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Không tìm thấy kỹ năng</p>
              <p className="text-[11px] text-ink-muted mt-0.5 max-w-[200px] leading-relaxed">
                Không có kỹ năng nào khớp với từ khóa & cấp độ đã chọn.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs gap-1.5 h-8 mt-1"
            >
              <RotateCcw className="size-3" />
              Đặt lại bộ lọc
            </Button>
          </div>
        ) : (
          categories.map((cat) => {
            const isCatMatched = matchedCategoryCodes.has(cat.code)
            // If filtering and this category has 0 matches, hide it
            if (isFilterActive && !isCatMatched) return null

            const isCatExpanded = expandedCategories.has(cat.code)
            const theme = getCategoryTheme(cat.code)
            const subList = subcategoriesByCategory[cat.code] || []

            // Matched skills count in this category
            const matchedSkillsInCat = filteredSkills.filter((s) => s.categoryCode === cat.code).length
            const totalSkillsInCat = totalSkillsCountMap.catMap[cat.code] || cat.skillCount

            return (
              <div key={cat.code} className="pt-1.5 first:pt-0">
                {/* Tier 1: Category Header (Collapsible Accordion) */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.code)}
                  className={cn(
                    'w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors',
                    'hover:bg-surface-raised/80 group',
                    isCatExpanded ? 'bg-surface-raised/50' : 'bg-surface/40'
                  )}
                  aria-expanded={isCatExpanded}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <span className={cn('size-2 rounded-full shrink-0', theme.dot)} />
                    <span className="text-xs font-bold text-ink truncate group-hover:text-brand transition-colors">
                      {cat.nameVi}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-ink-muted font-medium bg-surface px-1.5 py-0.5 rounded border border-border/50">
                      {isFilterActive ? `${matchedSkillsInCat}/${totalSkillsInCat}` : totalSkillsInCat}
                    </span>
                    <span className="text-ink-muted group-hover:text-ink transition-transform duration-150">
                      {isCatExpanded ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronRight className="size-3.5" />
                      )}
                    </span>
                  </div>
                </button>

                {/* Tier 2: Subcategories (Indented branch) */}
                {isCatExpanded && (
                  <div className="mt-1 space-y-1 ml-2.5 pl-2 border-l border-border/60">
                    {subList.map((sub) => {
                      const isSubMatched = matchedSubcategoryCodes.has(sub.code)
                      if (isFilterActive && !isSubMatched) return null

                      const isSubExpanded = expandedSubcategories.has(sub.code)
                      const subSkills = skillsBySubcategory[sub.code] || []
                      const totalSkillsInSub = totalSkillsCountMap.subMap[sub.code] || sub.skillCount

                      return (
                        <div key={sub.code} className="space-y-1">
                          {/* Subcategory Header */}
                          <button
                            type="button"
                            onClick={() => toggleSubcategory(sub.code)}
                            className={cn(
                              'w-full flex items-center justify-between py-1.5 px-2 rounded-md text-left transition-colors',
                              'hover:bg-surface-raised/60 group/sub',
                              isSubExpanded ? 'text-ink font-semibold' : 'text-ink-muted'
                            )}
                            aria-expanded={isSubExpanded}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 pr-1">
                              <Folder className="size-3 text-ink-muted group-hover/sub:text-brand shrink-0" />
                              <span className="text-[11px] truncate">
                                {sub.nameVi || sub.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[9px] font-mono text-ink-muted bg-surface-inset px-1 py-0.2 rounded">
                                {isFilterActive ? `${subSkills.length}/${totalSkillsInSub}` : totalSkillsInSub}
                              </span>
                              <span className="text-ink-muted">
                                {isSubExpanded ? (
                                  <ChevronDown className="size-3" />
                                ) : (
                                  <ChevronRight className="size-3" />
                                )}
                              </span>
                            </div>
                          </button>

                          {/* Tier 3: Skills List (Indented under Subcategory) */}
                          {isSubExpanded && (
                            <div className="ml-2 pl-2 border-l border-border/40 space-y-0.5 pb-1">
                              {subSkills.map((skill) => {
                                const isSelected = skill.code === selectedSkill

                                return (
                                  <button
                                    key={skill.code}
                                    type="button"
                                    onClick={() => handleSkillClick(skill)}
                                    className={cn(
                                      'w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-left transition-all text-xs group/skill',
                                      isSelected
                                        ? cn(
                                            'font-semibold border shadow-xs',
                                            theme.cellActive
                                          )
                                        : 'hover:bg-surface-raised/80 text-ink-muted hover:text-ink'
                                    )}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 pr-1">
                                      <span
                                        className={cn(
                                          'font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border shrink-0',
                                          isSelected
                                            ? theme.badge
                                            : 'bg-surface-inset text-ink-muted border-border/60 group-hover/skill:border-border'
                                        )}
                                      >
                                        {skill.code}
                                      </span>
                                      <span
                                        className={cn(
                                          'truncate text-[11px]',
                                          isSelected ? 'text-ink font-semibold' : 'text-ink-muted group-hover/skill:text-ink'
                                        )}
                                        title={skill.name}
                                      >
                                        {skill.name}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <span
                                        className={cn(
                                          'text-[10px] font-mono font-medium px-1 rounded',
                                          isSelected
                                            ? 'bg-card/80 text-ink'
                                            : 'text-ink-muted/80'
                                        )}
                                      >
                                        L{skill.minLevel}-{skill.maxLevel}
                                      </span>
                                      {skill.questionCount > 0 && (
                                        <span
                                          className="size-1.5 rounded-full bg-emerald-500"
                                          title={`${skill.questionCount} câu hỏi phỏng vấn`}
                                        />
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
