'use client'

import * as React from 'react'
import { Briefcase, Search, ExternalLink, X, Compass } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table'
import type { SfiaOnetMappingItem } from '@/types'

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
          'bg-card border-border/80 space-y-4 rounded-xl border p-8 text-center',
          className
        )}
      >
        <div className="bg-surface-inset text-ink-muted border-border mx-auto flex size-12 items-center justify-center rounded-full border">
          <Briefcase className="size-6" />
        </div>
        <div className="mx-auto max-w-md space-y-1.5">
          <h4 className="text-ink text-base font-bold">
            No mapped O*NET occupations
          </h4>
          <p className="text-ink-muted text-xs leading-relaxed">
            Skill{' '}
            <span className="text-ink font-mono font-semibold">
              {skillCode}
            </span>{' '}
            ({skillName}) is currently not mapped to any O*NET SOC occupation in
            the database (`public.onet_sfia_mappings`).
          </p>
        </div>
        <div>
          <Link
            href="/admin/onet"
            className="bg-surface-inset hover:bg-surface-raised border-border text-ink shadow-xs inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors"
          >
            <Compass className="text-brand size-3.5" />
            <span>Explore O*NET Browser</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3.5', className)}>
      {/* 1. Header Toolbar: Search & Classification Filter */}
      <div className="bg-surface-inset/60 border-border/60 flex flex-col gap-2.5 rounded-xl border p-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative max-w-sm flex-1">
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
                  className="text-ink-muted hover:text-ink flex size-5 items-center justify-center rounded transition-colors"
                >
                  <X className="size-3" />
                </button>
              ) : undefined
            }
            className="bg-background h-8 text-xs"
          />
        </div>

        {/* Filter Segmented Controls */}
        <div className="bg-surface-raised border-border/60 flex items-center gap-1 self-start rounded-lg border p-0.5 sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={cn(
              'select-none rounded-md px-2.5 py-1 text-xs font-medium transition-all',
              filterType === 'all'
                ? 'bg-background text-ink shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <span>All</span>
            <span className="ml-1 font-mono text-[10px] tabular-nums opacity-70">
              ({onetMappings.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('core')}
            className={cn(
              'select-none rounded-md px-2.5 py-1 text-xs font-medium transition-all',
              filterType === 'core'
                ? 'bg-background shadow-xs font-semibold text-emerald-600 dark:text-emerald-400'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <span>Core</span>
            <span className="ml-1 font-mono text-[10px] tabular-nums opacity-70">
              ({coreCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('supplemental')}
            className={cn(
              'select-none rounded-md px-2.5 py-1 text-xs font-medium transition-all',
              filterType === 'supplemental'
                ? 'bg-background text-ink shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <span>Supplemental</span>
            <span className="ml-1 font-mono text-[10px] tabular-nums opacity-70">
              ({supplementalCount})
            </span>
          </button>
        </div>
      </div>

      {/* 2. Filter Results View */}
      {filteredAndSortedMappings.length === 0 ? (
        <div className="bg-card border-border/80 space-y-2 rounded-xl border p-8 text-center">
          <Search className="text-ink-muted mx-auto size-7 opacity-60" />
          <h5 className="text-ink text-sm font-semibold">
            No matching occupations found
          </h5>
          <p className="text-ink-muted text-xs">
            No O*NET occupations match your search query &quot;{searchQuery}
            &quot;.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setFilterType('all')
            }}
            className="mt-2 h-7 text-xs"
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <>
          {/* A. Desktop / Tablet Table View (>= 640px) */}
          <div className="border-border/80 bg-card shadow-xs hidden overflow-hidden rounded-xl border sm:block">
            <div className="scrollbar-thin overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-inset/40 hover:bg-surface-inset/40 border-border/80 border-b">
                    <TableHead className="text-ink w-28 text-xs font-semibold">
                      SOC Code
                    </TableHead>
                    <TableHead className="text-ink min-w-[220px] text-xs font-semibold">
                      O*NET Occupation Title
                    </TableHead>
                    <TableHead className="text-ink w-28 text-center text-xs font-semibold">
                      Target Level
                    </TableHead>
                    <TableHead className="text-ink w-36 text-xs font-semibold">
                      Assessment Weight
                    </TableHead>
                    <TableHead className="text-ink w-28 text-center text-xs font-semibold">
                      Classification
                    </TableHead>
                    <TableHead className="text-ink w-28 text-right text-xs font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedMappings.map((mapping) => {
                    const weightPct = Math.min(
                      100,
                      Math.round((mapping.weight / 2.5) * 100)
                    )
                    const targetBadgeStyle =
                      TARGET_LEVEL_BADGES[mapping.targetLevel] ||
                      'bg-surface-raised text-ink-muted border-border'

                    return (
                      <TableRow
                        key={mapping.socCode}
                        className="hover:bg-surface-inset/30 border-border/50 border-b transition-colors last:border-b-0"
                      >
                        {/* Column 1: SOC Code */}
                        <TableCell className="text-brand w-28 font-mono text-xs font-semibold">
                          {mapping.socCode}
                        </TableCell>

                        {/* Column 2: Occupation Title */}
                        <TableCell className="min-w-[220px]">
                          <span className="text-ink block text-xs font-medium leading-snug sm:text-sm">
                            {mapping.occupationTitle}
                          </span>
                        </TableCell>

                        {/* Column 3: Target Level */}
                        <TableCell className="w-28 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold',
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
                              <span className="text-ink font-mono font-semibold tabular-nums">
                                x{mapping.weight.toFixed(1)}
                              </span>
                              <span className="text-ink-muted text-[10px]">
                                {mapping.weight >= 2.0
                                  ? 'Very High'
                                  : mapping.weight >= 1.5
                                    ? 'High'
                                    : 'Standard'}
                              </span>
                            </div>
                            {/* Mini visual indicator bar */}
                            <div className="bg-surface-inset border-border/40 h-1.5 w-full overflow-hidden rounded-full border">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  mapping.isCore
                                    ? 'bg-brand'
                                    : 'bg-ink-muted/50'
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
                              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]',
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
                            className="text-brand hover:text-brand-hover inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
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
          <div className="block space-y-2 sm:hidden">
            {filteredAndSortedMappings.map((mapping) => {
              const targetBadgeStyle =
                TARGET_LEVEL_BADGES[mapping.targetLevel] ||
                'bg-surface-raised text-ink-muted border-border'

              return (
                <div
                  key={mapping.socCode}
                  className="bg-card border-border/80 shadow-xs space-y-2.5 rounded-xl border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-brand block font-mono text-xs font-bold">
                        {mapping.socCode}
                      </span>
                      <h6 className="text-ink mt-0.5 text-xs font-semibold leading-snug">
                        {mapping.occupationTitle}
                      </h6>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2 py-0.5 text-[10px]',
                        mapping.isCore
                          ? ONET_CORE_BADGES.core
                          : ONET_CORE_BADGES.supplemental
                      )}
                    >
                      {mapping.isCore ? 'Core' : 'Supplemental'}
                    </span>
                  </div>

                  <div className="border-border/50 flex items-center justify-between border-t pt-1 text-xs">
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold',
                        targetBadgeStyle
                      )}
                    >
                      Target L{mapping.targetLevel}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-ink-muted text-[11px]">
                        Weight:
                      </span>
                      <span className="text-ink font-mono text-xs font-bold tabular-nums">
                        x{mapping.weight.toFixed(1)}
                      </span>
                    </div>

                    <a
                      href={`/admin/onet?soc=${encodeURIComponent(mapping.socCode)}&detail=sfia`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand inline-flex items-center gap-1 text-xs font-semibold hover:underline"
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
