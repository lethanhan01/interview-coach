'use client'

import React, { useState, useMemo } from 'react'
import {
  Compass,
  Users,
  Cpu,
  Briefcase,
  BookOpen,
  Search,
  X,
  Download,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from '@/types'
import { getAttributeTheme } from './sfia-theme'
import { downloadSfiaAttributesProgressionCsv } from './sfia-attributes-export'

export interface SfiaAttributesProgressionMatrixProps {
  levels: SfiaLevelResponsibility[]
  attributes: SfiaGenericAttribute[]
  selectedLevel: number
  onSelectLevel: (levelId: number) => void
  className?: string
}

// Icon mapper for attributes per Safe Dynamic Styling
const ATTRIBUTE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  AUTONOMY: Compass,
  INFLUENCE: Users,
  COMPLEXITY: Cpu,
  BUSINESS_SKILLS: Briefcase,
  KNOWLEDGE: BookOpen,
}

export function SfiaAttributesProgressionMatrix({
  levels,
  attributes,
  selectedLevel,
  onSelectLevel,
  className,
}: SfiaAttributesProgressionMatrixProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Lọc thuộc tính theo từ khóa tìm kiếm (tìm trong tên thuộc tính hoặc nội dung tiêu chuẩn bất kỳ level nào)
  const filteredAttributes = useMemo(() => {
    if (!searchQuery.trim()) return attributes
    const q = searchQuery.toLowerCase().trim()

    return attributes.filter((attr) => {
      const matchName =
        attr.name.toLowerCase().includes(q) ||
        attr.nameVi.toLowerCase().includes(q) ||
        attr.code.toLowerCase().includes(q) ||
        attr.description.toLowerCase().includes(q)

      if (matchName) return true

      // Tìm trong các phát biểu của 7 level
      return Object.values(attr.levels).some((statement) =>
        statement.toLowerCase().includes(q)
      )
    })
  }, [attributes, searchQuery])

  // Export CSV handler
  const handleExportCsv = () => {
    try {
      setIsExporting(true)
      const success = downloadSfiaAttributesProgressionCsv(levels, attributes)
      if (success) {
        toast.success('Attributes Progression Matrix exported successfully!', {
          description:
            'UTF-8 CSV file containing the 5 attributes x 7 levels matrix has been downloaded.',
        })
      } else {
        toast.error('Failed to generate CSV file')
      }
    } catch {
      toast.error('An error occurred while exporting progression matrix')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      className={cn(
        'border-border/80 bg-card shadow-xs flex h-full min-h-0 flex-col overflow-hidden rounded-xl border',
        className
      )}
    >
      {/* 1. Matrix Top Control Toolbar */}
      <div className="border-border/80 bg-surface-raised flex shrink-0 flex-col gap-2.5 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Layers className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-ink text-sm font-bold leading-tight">
                5 Core Generic Attributes Progression Matrix
              </h2>
              <span className="bg-brand/10 text-brand border-brand/20 py-0.2 rounded-md border px-1.5 text-[10px] font-semibold">
                SFIA 9
              </span>
            </div>
            <p className="text-ink-muted mt-0.5 text-[11px] leading-tight">
              Comparing behavioral competency progression across 7 levels of
              responsibility (Follow ➔ Strategy)
            </p>
          </div>
        </div>

        {/* Toolbar Actions: Search & Export CSV */}
        <div className="flex items-center gap-2">
          {/* Quick Search Input */}
          <div className="relative w-48 sm:w-64">
            <Search className="text-ink-muted absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search attribute criteria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card h-8 pl-8 pr-7 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-ink-muted hover:text-ink absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Export CSV Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="h-8 shrink-0 gap-1.5 text-xs font-semibold"
            title="Download 5x7 progression matrix in UTF-8 CSV format"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export Matrix CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </div>
      </div>

      {/* 2. 2D Progression Matrix Table with Sticky Headers */}
      <div className="scrollbar-thin relative min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          {/* Table Header (Sticky Top) */}
          <thead className="bg-surface-raised border-border/80 shadow-xs sticky top-0 z-30 border-b">
            <tr>
              {/* Top-Left Corner Intersection (Sticky Top + Left) */}
              <th className="bg-surface-raised border-border/80 text-ink sticky left-0 z-40 min-w-[220px] max-w-[240px] border-r p-3 text-xs font-bold">
                <div className="flex items-center justify-between">
                  <span>5 Core Attributes</span>
                  <span className="text-ink-muted bg-surface-inset rounded px-1.5 py-0.5 font-mono text-[10px]">
                    {filteredAttributes.length}/5
                  </span>
                </div>
              </th>

              {/* 7 Level Column Headers */}
              {levels.map((lvl) => {
                const isSelected = lvl.levelId === selectedLevel

                return (
                  <th
                    key={lvl.levelId}
                    aria-label={`Level ${lvl.levelId}: ${lvl.name}`}
                    className={cn(
                      'border-border/60 group min-w-[280px] max-w-[340px] cursor-pointer select-none border-r p-2.5 align-top transition-colors',
                      isSelected
                        ? 'bg-brand/10 dark:bg-brand/15 border-b-brand border-b-2'
                        : 'hover:bg-surface-inset'
                    )}
                    onClick={() => onSelectLevel(lvl.levelId)}
                    title={`Click to select and focus on Level ${lvl.levelId} (${lvl.name})`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold',
                            isSelected
                              ? 'bg-brand shadow-xs text-white'
                              : 'bg-surface-inset text-ink group-hover:bg-brand/10'
                          )}
                        >
                          L{lvl.levelId}
                        </span>
                        <span
                          className={cn(
                            'truncate text-xs font-bold',
                            isSelected ? 'text-brand' : 'text-ink'
                          )}
                        >
                          {lvl.name}
                        </span>
                      </div>
                      {isSelected && (
                        <span
                          className="bg-brand size-2 rounded-full"
                          title="Currently selected column"
                        />
                      )}
                    </div>

                    <p className="text-ink-muted/80 line-clamp-2 text-[10px] font-normal italic leading-tight">
                      &quot;{lvl.essence}&quot;
                    </p>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-border/60 divide-y">
            {filteredAttributes.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-ink-muted bg-surface-inset/40 p-8 text-center text-xs"
                >
                  No attributes found matching &quot;{searchQuery}&quot;.
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="text-brand ml-2 hover:underline"
                  >
                    Clear search
                  </Button>
                </td>
              </tr>
            ) : (
              filteredAttributes.map((attr) => {
                const theme = getAttributeTheme(attr.code)
                const Icon = ATTRIBUTE_ICONS[attr.code] || Compass

                return (
                  <tr
                    key={attr.code}
                    className="hover:bg-surface-inset/40 transition-colors"
                  >
                    {/* Sticky First Column: Attribute Identity */}
                    <td
                      className={cn(
                        'bg-card border-border/80 sticky left-0 z-20 min-w-[220px] max-w-[240px] border-r p-3 align-top shadow-[2px_0_4px_rgba(0,0,0,0.03)]',
                        theme.bgLight
                      )}
                    >
                      <div className="mb-1.5 flex items-center gap-2">
                        <div
                          className={cn(
                            'shadow-2xs flex size-6 shrink-0 items-center justify-center rounded-md border',
                            theme.badge
                          )}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        <div>
                          <div className="text-ink text-xs font-bold leading-tight">
                            {attr.name}
                          </div>
                        </div>
                      </div>

                      <span className="py-0.2 bg-surface-inset text-ink-muted border-border/60 mb-1.5 inline-block rounded border px-1 font-mono text-[9px]">
                        {attr.code}
                      </span>

                      <p className="text-ink-muted line-clamp-3 text-[10px] leading-tight">
                        {attr.description}
                      </p>
                    </td>

                    {/* 7 Level Statement Cells */}
                    {levels.map((lvl) => {
                      const statement = attr.levels[lvl.levelId] || '—'
                      const isSelected = lvl.levelId === selectedLevel
                      const isQueryMatched =
                        searchQuery.trim() !== '' &&
                        statement
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase().trim())

                      return (
                        <td
                          key={lvl.levelId}
                          onClick={() => onSelectLevel(lvl.levelId)}
                          className={cn(
                            'border-border/60 text-ink min-w-[280px] max-w-[340px] cursor-pointer border-r p-3 align-top text-xs leading-relaxed transition-colors',
                            isSelected
                              ? 'bg-brand/5 dark:bg-brand/10'
                              : 'hover:bg-surface-raised/60',
                            isQueryMatched &&
                              'bg-amber-500/10 ring-2 ring-amber-500/50'
                          )}
                          title={`Level ${lvl.levelId} - ${attr.name}: Click to select level`}
                        >
                          <div className="text-ink-muted mb-1 flex items-center justify-between gap-1 text-[10px]">
                            <span className="font-mono font-bold">
                              L{lvl.levelId}
                            </span>
                            {isSelected && (
                              <span className="text-brand text-[9px] font-semibold uppercase">
                                Selected
                              </span>
                            )}
                          </div>
                          <p
                            className={cn(
                              'text-ink text-xs leading-relaxed',
                              isSelected && 'font-medium'
                            )}
                          >
                            {statement}
                          </p>
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Bar */}
      <div className="border-border/80 bg-surface-raised text-ink-muted flex shrink-0 items-center justify-between border-t p-2 px-3 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>
            5 Generic Attributes x 7 Levels Progression Matrix - SFIA 9
            International Standard
          </span>
        </div>
        <div>
          <span>
            Selected Column:{' '}
            <strong className="text-ink font-semibold">
              Level {selectedLevel}
            </strong>
          </span>
        </div>
      </div>
    </div>
  )
}
