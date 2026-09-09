'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  Search,
  X,
  Flame,
  Zap,
  LayoutGrid,
  Cloud,
  Check,
  Copy,
  FolderCode,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/patterns/FeedbackPatterns'
import type { OnetSoftwareSkill } from './types'

export interface OnetTechSkillsTabProps {
  skills: OnetSoftwareSkill[]
  className?: string
}

type FilterType = 'all' | 'hot' | 'demand'
type ViewMode = 'category' | 'cloud'

export function OnetTechSkillsTab({
  skills,
  className,
}: OnetTechSkillsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('category')
  const [copiedSkill, setCopiedSkill] = useState<string | null>(null)

  // Metrics for filter chips
  const totalCount = skills.length
  const hotCount = useMemo(
    () => skills.filter((s) => s.isHotTechnology).length,
    [skills]
  )
  const demandCount = useMemo(
    () => skills.filter((s) => s.inDemand).length,
    [skills]
  )

  // Filter skills based on search query and active filter
  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return skills.filter((skill) => {
      // Filter chip matching
      if (activeFilter === 'hot' && !skill.isHotTechnology) return false
      if (activeFilter === 'demand' && !skill.inDemand) return false

      // Search matching
      if (!q) return true
      return (
        skill.name.toLowerCase().includes(q) ||
        skill.category.toLowerCase().includes(q)
      )
    })
  }, [skills, searchQuery, activeFilter])

  // Group filtered skills by category for Categorized View
  const groupedSkills = useMemo(() => {
    const map = new Map<string, OnetSoftwareSkill[]>()
    for (const skill of filteredSkills) {
      const cat = skill.category || 'Công cụ chuyên ngành'
      if (!map.has(cat)) {
        map.set(cat, [])
      }
      map.get(cat)!.push(skill)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [filteredSkills])

  const handleCopySkill = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name)
      setCopiedSkill(name)
      setTimeout(() => setCopiedSkill(null), 1800)
    } catch {
      // Fallback
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setActiveFilter('all')
  }

  return (
    <div className={cn('space-y-3.5', className)}>
      {/* Control Header: Search & View Switcher */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="text-ink-muted absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm công nghệ, framework, công cụ..."
            className="bg-surface-inset h-9 pl-9 pr-8 text-xs sm:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-ink-muted hover:text-ink absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded focus-ring"
              title="Xóa từ khóa tìm kiếm"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Switcher Toggle */}
        <div className="bg-surface-inset flex items-center rounded-lg p-0.5 border border-border/70 shrink-0 self-start sm:self-auto">
          <Button
            variant={viewMode === 'category' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('category')}
            className={cn(
              'h-7 px-2.5 gap-1.5 text-xs font-medium',
              viewMode === 'category' && 'bg-card shadow-sm text-ink'
            )}
            title="Chế độ xem nhóm theo danh mục"
          >
            <LayoutGrid className="size-3.5" />
            <span>Danh mục</span>
          </Button>

          <Button
            variant={viewMode === 'cloud' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cloud')}
            className={cn(
              'h-7 px-2.5 gap-1.5 text-xs font-medium',
              viewMode === 'cloud' && 'bg-card shadow-sm text-ink'
            )}
            title="Chế độ xem đám mây từ khóa"
          >
            <Cloud className="size-3.5" />
            <span>Đám mây</span>
          </Button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors focus-ring',
            activeFilter === 'all'
              ? 'bg-brand text-brand-foreground border-brand'
              : 'bg-surface-1 border-border/80 text-ink-muted hover:text-ink hover:border-brand/40'
          )}
        >
          <span>Tất cả</span>
          <span className="font-mono text-[11px] tabular-nums">({totalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('hot')}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors focus-ring',
            activeFilter === 'hot'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
          )}
        >
          <Flame className="size-3" />
          <span>Hot Tech</span>
          <span className="font-mono text-[11px] tabular-nums">({hotCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('demand')}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors focus-ring',
            activeFilter === 'demand'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
          )}
        >
          <Zap className="size-3" />
          <span>In Demand</span>
          <span className="font-mono text-[11px] tabular-nums">({demandCount})</span>
        </button>

        {(searchQuery || activeFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-7 px-2 text-xs text-ink-muted hover:text-ink ml-auto"
          >
            <span>Đặt lại</span>
          </Button>
        )}
      </div>

      {/* Empty State */}
      {filteredSkills.length === 0 && (
        <Card className="p-8">
          <EmptyState
            icon={<Wrench className="text-ink-muted size-10" />}
            title="Không tìm thấy công nghệ phù hợp"
            description={
              searchQuery
                ? `Không có công cụ nào khớp với từ khóa "${searchQuery}" và bộ lọc hiện tại.`
                : 'Không có công nghệ nào thuộc tiêu chí lọc đã chọn.'
            }
            action={{
              label: 'Xóa bộ lọc tìm kiếm',
              onClick: handleClearFilters,
            }}
          />
        </Card>
      )}

      {/* Mode 1: Categorized Grid View */}
      {filteredSkills.length > 0 && viewMode === 'category' && (
        <div className="space-y-3">
          {groupedSkills.map(([category, items]) => (
            <Card key={category} className="p-3.5 space-y-2.5">
              {/* Category Header */}
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <FolderCode className="text-brand size-4" />
                  <h3 className="text-ink text-xs sm:text-sm font-semibold">
                    {category}
                  </h3>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono tabular-nums">
                  {items.length} công nghệ
                </Badge>
              </div>

              {/* Skills Badges Grid */}
              <div className="flex flex-wrap gap-2 pt-0.5">
                {items.map((skill, idx) => {
                  const isCopied = copiedSkill === skill.name

                  return (
                    <button
                      key={`${category}-${skill.name}-${idx}`}
                      type="button"
                      onClick={() => handleCopySkill(skill.name)}
                      className={cn(
                        'group pressable relative inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all text-left focus-ring',
                        skill.isHotTechnology
                          ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
                          : skill.inDemand
                            ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
                            : 'border-border/80 bg-surface-1 hover:border-brand/40'
                      )}
                      title="Nhấn để sao chép tên công nghệ"
                    >
                      <span className="text-ink font-semibold">{skill.name}</span>

                      {/* Hot Tag */}
                      {skill.isHotTechnology && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.2 rounded">
                          <Flame className="size-2.5" />
                          <span>Hot</span>
                        </span>
                      )}

                      {/* In Demand Tag */}
                      {skill.inDemand && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                          <Zap className="size-2.5" />
                          <span>Demand</span>
                        </span>
                      )}

                      {/* Copy Indicator */}
                      <span className="text-ink-muted ml-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {isCopied ? (
                          <Check className="text-success size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </span>

                      {/* Tooltip feedback badge when copied */}
                      {isCopied && (
                        <span className="bg-ink text-surface-0 absolute -top-7 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-medium shadow-elevation-2 animate-in fade-in zoom-in-95 pointer-events-none">
                          Đã sao chép!
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Mode 2: Fluid Tag Cloud View */}
      {filteredSkills.length > 0 && viewMode === 'cloud' && (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            {filteredSkills.map((skill, idx) => {
              const isCopied = copiedSkill === skill.name

              return (
                <button
                  key={`cloud-${skill.name}-${idx}`}
                  type="button"
                  onClick={() => handleCopySkill(skill.name)}
                  className={cn(
                    'group pressable relative inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all text-left focus-ring',
                    skill.isHotTechnology
                      ? 'border-amber-500/40 bg-amber-500/10 hover:border-amber-500/80 shadow-sm'
                      : skill.inDemand
                        ? 'border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-500/80 shadow-sm'
                        : 'border-border/80 bg-surface-inset hover:border-brand/40'
                  )}
                  title="Nhấn để sao chép tên công nghệ"
                >
                  <span className="text-ink font-semibold">{skill.name}</span>

                  {skill.isHotTechnology && (
                    <Flame className="text-amber-600 dark:text-amber-400 size-3" />
                  )}

                  {skill.inDemand && (
                    <Zap className="text-emerald-600 dark:text-emerald-400 size-3" />
                  )}

                  <span className="text-ink-muted text-[10px] opacity-75">
                    ({skill.category})
                  </span>

                  {isCopied ? (
                    <Check className="text-success size-3" />
                  ) : (
                    <Copy className="text-ink-muted opacity-0 group-hover:opacity-100 size-3" />
                  )}

                  {isCopied && (
                    <span className="bg-ink text-surface-0 absolute -top-7 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-medium shadow-elevation-2 animate-in fade-in zoom-in-95 pointer-events-none">
                      Đã sao chép!
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
