'use client'

import * as React from 'react'
import {
  Briefcase,
  Search,
  ExternalLink,
  SlidersHorizontal,
  X,
  Compass,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table'
import type { SfiaOnetMappingItem } from './types'

export interface SfiaOnetMappingsTabProps {
  skillCode: string
  skillName: string
  onetMappings: SfiaOnetMappingItem[]
  className?: string
}

type OnetFilterType = 'all' | 'core' | 'supplemental'

// Lookup table an toàn cho badges phân loại O*NET
const ONET_CORE_BADGES = {
  core: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold',
  supplemental: 'bg-surface-muted text-ink-muted border-border font-normal',
} as const

// Lookup table cho level target badges
const TARGET_LEVEL_BADGES: Record<number, string> = {
  1: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  2: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  3: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  4: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  5: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  6: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  7: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
}

export function SfiaOnetMappingsTab({
  skillCode,
  skillName,
  onetMappings = [],
  className,
}: SfiaOnetMappingsTabProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterType, setFilterType] = React.useState<OnetFilterType>('all')

  // Đếm số lượng theo loại
  const coreCount = React.useMemo(
    () => onetMappings.filter((m) => m.isCore).length,
    [onetMappings]
  )
  const supplementalCount = onetMappings.length - coreCount

  // Lọc và sắp xếp: Nghề Cốt lõi lên đầu, tiếp đến Weight giảm dần
  const filteredAndSortedMappings = React.useMemo(() => {
    let result = [...onetMappings]

    // 1. Lọc theo search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (m) =>
          m.socCode.toLowerCase().includes(q) ||
          m.occupationTitle.toLowerCase().includes(q)
      )
    }

    // 2. Lọc theo loại Core / Supplemental
    if (filterType === 'core') {
      result = result.filter((m) => m.isCore)
    } else if (filterType === 'supplemental') {
      result = result.filter((m) => !m.isCore)
    }

    // 3. Sắp xếp ưu tiên: Core trước, sau đó Weight giảm dần, sau đó SOC code
    result.sort((a, b) => {
      if (a.isCore !== b.isCore) {
        return a.isCore ? -1 : 1
      }
      if (b.weight !== a.weight) {
        return b.weight - a.weight
      }
      return a.socCode.localeCompare(b.socCode)
    })

    return result
  }, [onetMappings, searchQuery, filterType])

  // Empty state when no mappings exist
  if (onetMappings.length === 0) {
    return (
      <div
        className={cn(
          'bg-card border border-border/80 rounded-xl p-8 text-center space-y-4',
          className
        )}
      >
        <div className="size-12 rounded-full bg-surface-inset text-ink-muted flex items-center justify-center mx-auto border border-border">
          <Briefcase className="size-6" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h4 className="text-base font-bold text-ink">
            No mapped O*NET occupations
          </h4>
          <p className="text-xs text-ink-muted leading-relaxed">
            Skill <span className="font-semibold text-ink font-mono">{skillCode}</span> ({skillName}) is currently not mapped to any O*NET SOC occupation in the database (`public.onet_sfia_mappings`).
          </p>
        </div>
        <div>
          <Link
            href="/admin/onet"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-inset hover:bg-surface-raised border border-border text-xs font-semibold text-ink transition-colors shadow-xs"
          >
            <Compass className="size-3.5 text-brand" />
            <span>Explore O*NET Browser</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3.5', className)}>
      {/* 1. Header Toolbar: Search & Classification Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-surface-inset/60 p-2.5 rounded-xl border border-border/60">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SOC code or occupation title..."
            leadingIcon={<Search className="size-3.5" />}
            trailingAction={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="size-5 rounded flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
                >
                  <X className="size-3" />
                </button>
              ) : undefined
            }
            className="h-8 text-xs bg-background"
          />
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1 bg-surface-raised p-0.5 rounded-lg border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-all select-none',
              filterType === 'all'
                ? 'bg-background text-ink shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <span>All</span>
            <span className="ml-1 text-[10px] opacity-70 tabular-nums font-mono">
              ({onetMappings.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('core')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-all select-none',
              filterType === 'core'
                ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <span>Core</span>
            <span className="ml-1 text-[10px] opacity-70 tabular-nums font-mono">
              ({coreCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('supplemental')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-all select-none',
              filterType === 'supplemental'
                ? 'bg-background text-ink shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <span>Supplemental</span>
            <span className="ml-1 text-[10px] opacity-70 tabular-nums font-mono">
              ({supplementalCount})
            </span>
          </button>
        </div>
      </div>

      {/* 2. Filter Results View */}
      {filteredAndSortedMappings.length === 0 ? (
        <div className="bg-card border border-border/80 rounded-xl p-8 text-center space-y-2">
          <Search className="size-7 text-ink-muted mx-auto opacity-60" />
          <h5 className="text-sm font-semibold text-ink">
            No matching occupations found
          </h5>
          <p className="text-xs text-ink-muted">
            No O*NET occupations match your search query &quot;{searchQuery}&quot;.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setFilterType('all')
            }}
            className="h-7 text-xs mt-2"
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <>
          {/* A. Desktop / Tablet Table View (>= 640px) */}
          <div className="hidden sm:block rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-inset/40 hover:bg-surface-inset/40 border-b border-border/80">
                    <TableHead className="w-28 text-xs font-semibold text-ink">SOC Code</TableHead>
                    <TableHead className="text-xs font-semibold text-ink min-w-[220px]">
                      O*NET Occupation Title
                    </TableHead>
                    <TableHead className="w-28 text-xs font-semibold text-ink text-center">
                      Target Level
                    </TableHead>
                    <TableHead className="w-36 text-xs font-semibold text-ink">
                      Assessment Weight
                    </TableHead>
                    <TableHead className="w-28 text-xs font-semibold text-ink text-center">
                      Classification
                    </TableHead>
                    <TableHead className="w-28 text-xs font-semibold text-ink text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedMappings.map((mapping) => {
                    const weightPct = Math.min(100, Math.round((mapping.weight / 2.5) * 100))
                    const targetBadgeStyle =
                      TARGET_LEVEL_BADGES[mapping.targetLevel] ||
                      'bg-surface-raised text-ink-muted border-border'

                    return (
                      <TableRow
                        key={mapping.socCode}
                        className="hover:bg-surface-inset/30 transition-colors border-b border-border/50 last:border-b-0"
                      >
                        {/* Column 1: SOC Code */}
                        <TableCell className="w-28 font-mono font-semibold text-xs text-brand">
                          {mapping.socCode}
                        </TableCell>

                        {/* Column 2: Occupation Title */}
                        <TableCell className="min-w-[220px]">
                          <span className="font-medium text-xs sm:text-sm text-ink block leading-snug">
                            {mapping.occupationTitle}
                          </span>
                        </TableCell>

                        {/* Column 3: Target Level */}
                        <TableCell className="w-28 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono border',
                              targetBadgeStyle
                            )}
                          >
                            Level {mapping.targetLevel}
                          </span>
                        </TableCell>

                        {/* Column 4: Assessment Weight */}
                        <TableCell className="w-36">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-ink font-semibold tabular-nums">
                                x{mapping.weight.toFixed(1)}
                              </span>
                              <span className="text-[10px] text-ink-muted">
                                {mapping.weight >= 2.0
                                  ? 'Very High'
                                  : mapping.weight >= 1.5
                                    ? 'High'
                                    : 'Standard'}
                              </span>
                            </div>
                            {/* Mini visual indicator bar */}
                            <div className="h-1.5 w-full bg-surface-inset rounded-full overflow-hidden border border-border/40">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  mapping.isCore ? 'bg-brand' : 'bg-ink-muted/50'
                                )}
                                style={{ width: `${weightPct}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Column 5: Classification Core/Supplemental */}
                        <TableCell className="w-28 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border',
                              mapping.isCore
                                ? ONET_CORE_BADGES.core
                                : ONET_CORE_BADGES.supplemental
                            )}
                          >
                            {mapping.isCore ? 'Core' : 'Supplemental'}
                          </span>
                        </TableCell>

                        {/* Column 6: Link to O*NET */}
                        <TableCell className="w-28 text-right">
                          <a
                            href={`/admin/onet?soc=${encodeURIComponent(mapping.socCode)}&detail=sfia`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-hover hover:underline font-medium transition-colors"
                            title={`View details for ${mapping.occupationTitle} on O*NET Browser`}
                          >
                            <span>Details</span>
                            <ExternalLink className="size-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* B. Mobile Compact Cards (< 640px) */}
          <div className="block sm:hidden space-y-2">
            {filteredAndSortedMappings.map((mapping) => {
              const weightPct = Math.min(100, Math.round((mapping.weight / 2.5) * 100))
              const targetBadgeStyle =
                TARGET_LEVEL_BADGES[mapping.targetLevel] ||
                'bg-surface-raised text-ink-muted border-border'

              return (
                <div
                  key={mapping.socCode}
                  className="bg-card border border-border/80 rounded-xl p-3 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-brand block">
                        {mapping.socCode}
                      </span>
                      <h6 className="text-xs font-semibold text-ink mt-0.5 leading-snug">
                        {mapping.occupationTitle}
                      </h6>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-[10px] px-2 py-0.5 rounded-full border',
                        mapping.isCore
                          ? ONET_CORE_BADGES.core
                          : ONET_CORE_BADGES.supplemental
                      )}
                    >
                      {mapping.isCore ? 'Core' : 'Supplemental'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border',
                        targetBadgeStyle
                      )}
                    >
                      Target L{mapping.targetLevel}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-ink-muted">Weight:</span>
                      <span className="font-mono font-bold text-xs text-ink tabular-nums">
                        x{mapping.weight.toFixed(1)}
                      </span>
                    </div>

                    <a
                      href={`/admin/onet?soc=${encodeURIComponent(mapping.socCode)}&detail=sfia`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
                    >
                      <span>View</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
