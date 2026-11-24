'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Search,
  X,
  SearchX,
  ChevronDown,
  ChevronRight,
  Folder,
  Layers,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { SfiaCategory, SfiaSubcategory, SfiaSkillSummary } from '@/types'
import { getCategoryTheme } from './sfia-theme'

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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => {
      const initial = new Set<string>()
      if (currentSkillInfo) initial.add(currentSkillInfo.categoryCode)
      return initial
    }
  )
  const [expandedSubcategories, setExpandedSubcategories] = useState<
    Set<string>
  >(() => {
    const initial = new Set<string>()
    if (currentSkillInfo) initial.add(currentSkillInfo.subcategoryCode)
    return initial
  })

  // Synchronously update expansion when selected skill changes or loads during render (React 19 pattern)
  const currentSkillKey = currentSkillInfo
    ? `${currentSkillInfo.code}:${currentSkillInfo.categoryCode}:${currentSkillInfo.subcategoryCode}`
    : ''
  const [prevSkillKey, setPrevSkillKey] = useState(currentSkillKey)
  if (prevSkillKey !== currentSkillKey) {
    setPrevSkillKey(currentSkillKey)
    if (currentSkillInfo) {
      setExpandedCategories((prev) =>
        new Set(prev).add(currentSkillInfo.categoryCode)
      )
      setExpandedSubcategories((prev) =>
        new Set(prev).add(currentSkillInfo.subcategoryCode)
      )
    }
  }

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll selected skill into view smoothly on mount or skill change
  useEffect(() => {
    if (!selectedSkill) return
    const timer = setTimeout(() => {
      const el = document.getElementById(`sfia-tree-skill-${selectedSkill}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [selectedSkill, expandedSubcategories])

  // Global keyboard shortcut to focus search: Ctrl+K, Cmd+K or "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
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
  const { filteredSkills, matchedCategoryCodes, matchedSubcategoryCodes } =
    useMemo(() => {
      const q = searchQuery.trim().toLowerCase()
      const isLevelActive = levelFilter !== 'all'

      const matchedSkills = skills.filter((skill) => {
        // Level check
        if (
          isLevelActive &&
          (skill.minLevel > levelFilter || skill.maxLevel < levelFilter)
        ) {
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
      map[cat.code] = subcategories.filter(
        (sub) => sub.categoryCode === cat.code
      )
    })
    return map
  }, [categories, subcategories])

  // Pre-index filtered skills by subcategory
  const skillsBySubcategory = useMemo(() => {
    const map: Record<string, SfiaSkillSummary[]> = {}
    subcategories.forEach((sub) => {
      map[sub.code] = filteredSkills.filter(
        (s) => s.subcategoryCode === sub.code
      )
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
        'bg-card border-border/80 flex h-full flex-col overflow-hidden rounded-xl border shadow-sm',
        className
      )}
    >
      {/* Top Toolbar: Search & Level Filter */}
      <div className="border-border/60 bg-surface-raised/20 flex shrink-0 flex-col gap-2.5 border-b p-3">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code (PROG) or skill name..."
            leadingIcon={<Search className="text-ink-muted size-4" />}
            trailingAction={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:bg-surface text-ink-muted hover:text-ink mr-2 flex size-6 items-center justify-center rounded-md transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <span className="text-ink-muted border-border/60 bg-surface mr-2 hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
                  Ctrl+K
                </span>
              )
            }
            className="bg-surface h-9 text-xs"
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
              className="bg-surface border-border/70 text-ink focus:ring-brand h-8 w-full rounded-lg border px-2.5 py-1 text-xs focus:outline-none focus:ring-1"
              aria-label="Filter by SFIA Level"
            >
              <option value="all">⚡ All Levels (L1 - L7)</option>
              <option value="1">Level 1 — Follow</option>
              <option value="2">Level 2 — Assist</option>
              <option value="3">Level 3 — Apply</option>
              <option value="4">Level 4 — Enable</option>
              <option value="5">Level 5 — Ensure / Advise</option>
              <option value="6">Level 6 — Initiate / Influence</option>
              <option value="7">Level 7 — Set strategy / Inspire</option>
            </select>
          </div>

          {/* Expand / Collapse All Toggle */}
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExpandAll}
              className="h-8 px-2 text-[11px] font-medium"
              title="Expand all branches"
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCollapseAll}
              className="h-8 px-2 text-[11px] font-medium"
              title="Collapse all branches"
            >
              Collapse All
            </Button>
          </div>
        </div>

        {/* Live Filter Result Bar */}
        <div className="text-ink-muted flex items-center justify-between pt-0.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Layers className="text-brand size-3" />
            <span>
              {isFilterActive ? (
                <span>
                  Matched{' '}
                  <strong className="text-ink font-semibold">
                    {filteredSkills.length}
                  </strong>{' '}
                  of {skills.length} skills
                </span>
              ) : (
                <span>
                  Total{' '}
                  <strong className="text-ink font-semibold">
                    {skills.length}
                  </strong>{' '}
                  SFIA 9 skills
                </span>
              )}
            </span>
          </div>

          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="text-brand flex items-center gap-1 text-[10px] font-semibold hover:underline"
            >
              <RotateCcw className="size-2.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Tree Content (Independent Scrollable Container) */}
      <div className="divide-border/40 flex-1 space-y-1.5 divide-y overflow-y-auto p-2">
        {/* Empty State when no matches */}
        {filteredSkills.length === 0 ? (
          <div className="my-4 flex flex-col items-center justify-center gap-2.5 p-6 text-center">
            <div className="bg-surface-raised text-ink-muted flex size-10 items-center justify-center rounded-full">
              <SearchX className="size-5" />
            </div>
            <div>
              <p className="text-ink text-xs font-bold">No skills found</p>
              <p className="text-ink-muted mt-0.5 max-w-[200px] text-[11px] leading-relaxed">
                No skills match your current search query and level filter.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-1 h-8 gap-1.5 text-xs"
            >
              <RotateCcw className="size-3" />
              Reset Filters
            </Button>
          </div>
        ) : (
          categories.map((cat) => {
            const isCatMatched = matchedCategoryCodes.has(cat.code)
            // If filtering and this category has 0 matches, hide it
            if (isFilterActive && !isCatMatched) return null

            const isCatExpanded = isFilterActive
              ? isCatMatched
              : expandedCategories.has(cat.code)
            const theme = getCategoryTheme(cat.code)
            const subList = subcategoriesByCategory[cat.code] || []

            // Matched skills count in this category
            const matchedSkillsInCat = filteredSkills.filter(
              (s) => s.categoryCode === cat.code
            ).length
            const totalSkillsInCat =
              totalSkillsCountMap.catMap[cat.code] || cat.skillCount

            return (
              <div key={cat.code} className="pt-1.5 first:pt-0">
                {/* Tier 1: Category Header (Collapsible Accordion) */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.code)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors',
                    'hover:bg-surface-raised/80 group',
                    isCatExpanded ? 'bg-surface-raised/50' : 'bg-surface/40'
                  )}
                  aria-expanded={isCatExpanded}
                >
                  <div className="flex min-w-0 items-center gap-2 pr-1">
                    <span
                      className={cn('size-2 shrink-0 rounded-full', theme.dot)}
                    />
                    <span className="text-ink group-hover:text-brand truncate text-xs font-bold transition-colors">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-ink-muted bg-surface border-border/50 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium">
                      {isFilterActive
                        ? `${matchedSkillsInCat}/${totalSkillsInCat}`
                        : totalSkillsInCat}
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
                  <div className="border-border/60 ml-2.5 mt-1 space-y-1 border-l pl-2">
                    {subList.map((sub) => {
                      const isSubMatched = matchedSubcategoryCodes.has(sub.code)
                      if (isFilterActive && !isSubMatched) return null

                      const isSubExpanded = isFilterActive
                        ? isSubMatched
                        : expandedSubcategories.has(sub.code)
                      const subSkills = skillsBySubcategory[sub.code] || []
                      const totalSkillsInSub =
                        totalSkillsCountMap.subMap[sub.code] || sub.skillCount

                      return (
                        <div key={sub.code} className="space-y-1">
                          {/* Subcategory Header */}
                          <button
                            type="button"
                            onClick={() => toggleSubcategory(sub.code)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors',
                              'hover:bg-surface-raised/60 group/sub',
                              isSubExpanded
                                ? 'text-ink font-semibold'
                                : 'text-ink-muted'
                            )}
                            aria-expanded={isSubExpanded}
                          >
                            <div className="flex min-w-0 items-center gap-1.5 pr-1">
                              <Folder className="text-ink-muted group-hover/sub:text-brand size-3 shrink-0" />
                              <span className="truncate text-[11px]">
                                {sub.name}
                              </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <span className="text-ink-muted bg-surface-inset py-0.2 rounded px-1 font-mono text-[9px]">
                                {isFilterActive
                                  ? `${subSkills.length}/${totalSkillsInSub}`
                                  : totalSkillsInSub}
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
                            <div className="border-border/40 ml-2 space-y-0.5 border-l pb-1 pl-2">
                              {subSkills.map((skill) => {
                                const isSelected = skill.code === selectedSkill

                                return (
                                  <button
                                    id={`sfia-tree-skill-${skill.code}`}
                                    key={skill.code}
                                    type="button"
                                    onClick={() => handleSkillClick(skill)}
                                    className={cn(
                                      'group/skill flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-all',
                                      isSelected
                                        ? cn(
                                            'shadow-xs border font-semibold',
                                            theme.cellActive
                                          )
                                        : 'hover:bg-surface-raised/80 text-ink-muted hover:text-ink'
                                    )}
                                  >
                                    <div className="flex min-w-0 items-center gap-2 pr-1">
                                      <span
                                        className={cn(
                                          'shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold',
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
                                          isSelected
                                            ? 'text-ink font-semibold'
                                            : 'text-ink-muted group-hover/skill:text-ink'
                                        )}
                                        title={skill.name}
                                      >
                                        {skill.name}
                                      </span>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                      <span
                                        className={cn(
                                          'rounded px-1 font-mono text-[10px] font-medium',
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
                                          title={`${skill.questionCount} interview questions`}
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
