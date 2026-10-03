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
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from './types'
import {
  getAttributeTheme,
} from './sfia-theme'
import { downloadSfiaAttributesProgressionCsv } from './sfia-attributes-export'

export interface SfiaAttributesProgressionMatrixProps {
  levels: SfiaLevelResponsibility[]
  attributes: SfiaGenericAttribute[]
  selectedLevel: number
  onSelectLevel: (levelId: number) => void
  className?: string
}

// Icon mapper for attributes per Safe Dynamic Styling
const ATTRIBUTE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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
          description: 'UTF-8 CSV file containing the 5 attributes x 7 levels matrix has been downloaded.',
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
        'flex flex-col h-full min-h-0 border border-border/80 rounded-xl bg-card shadow-xs overflow-hidden',
        className
      )}
    >
      {/* 1. Matrix Top Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3 border-b border-border/80 bg-surface-raised shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Layers className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-ink leading-tight">
                5 Core Generic Attributes Progression Matrix
              </h2>
              <span className="bg-brand/10 text-brand border border-brand/20 rounded-md px-1.5 py-0.2 text-[10px] font-semibold">
                SFIA 9
              </span>
            </div>
            <p className="text-[11px] text-ink-muted leading-tight mt-0.5">
              Comparing behavioral competency progression across 7 levels of responsibility (Follow ➔ Strategy)
            </p>
          </div>
        </div>

        {/* Toolbar Actions: Search & Export CSV */}
        <div className="flex items-center gap-2">
          {/* Quick Search Input */}
          <div className="relative w-48 sm:w-64">
            <Search className="size-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search attribute criteria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 h-8 text-xs bg-card"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
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
            className="h-8 gap-1.5 text-xs font-semibold shrink-0"
            title="Download 5x7 progression matrix in UTF-8 CSV format"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export Matrix CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </div>
      </div>

      {/* 2. 2D Progression Matrix Table with Sticky Headers */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-thin relative">
        <table className="w-full border-collapse text-left text-xs">
          {/* Table Header (Sticky Top) */}
          <thead className="sticky top-0 z-30 bg-surface-raised border-b border-border/80 shadow-xs">
            <tr>
              {/* Top-Left Corner Intersection (Sticky Top + Left) */}
              <th className="sticky left-0 z-40 bg-surface-raised border-r border-border/80 p-3 min-w-[220px] max-w-[240px] text-xs font-bold text-ink">
                <div className="flex items-center justify-between">
                  <span>5 Core Attributes</span>
                  <span className="text-[10px] font-mono text-ink-muted bg-surface-inset px-1.5 py-0.5 rounded">
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
                      'p-2.5 min-w-[280px] max-w-[340px] border-r border-border/60 transition-colors align-top cursor-pointer select-none group',
                      isSelected
                        ? 'bg-brand/10 dark:bg-brand/15 border-b-2 border-b-brand'
                        : 'hover:bg-surface-inset'
                    )}
                    onClick={() => onSelectLevel(lvl.levelId)}
                    title={`Click to select and focus on Level ${lvl.levelId} (${lvl.name})`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded font-mono',
                            isSelected
                              ? 'bg-brand text-white shadow-xs'
                              : 'bg-surface-inset text-ink group-hover:bg-brand/10'
                          )}
                        >
                          L{lvl.levelId}
                        </span>
                        <span
                          className={cn(
                            'font-bold text-xs truncate',
                            isSelected ? 'text-brand' : 'text-ink'
                          )}
                        >
                          {lvl.name}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="size-2 rounded-full bg-brand" title="Currently selected column" />
                      )}
                    </div>

                    <p className="text-[10px] text-ink-muted/80 line-clamp-2 leading-tight italic font-normal">
                      &quot;{lvl.essence}&quot;
                    </p>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border/60">
            {filteredAttributes.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-8 text-center text-ink-muted text-xs bg-surface-inset/40"
                >
                  No attributes found matching &quot;{searchQuery}&quot;.
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="ml-2 text-brand hover:underline"
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
                  <tr key={attr.code} className="hover:bg-surface-inset/40 transition-colors">
                    {/* Sticky First Column: Attribute Identity */}
                    <td
                      className={cn(
                        'sticky left-0 z-20 bg-card border-r border-border/80 p-3 min-w-[220px] max-w-[240px] align-top shadow-[2px_0_4px_rgba(0,0,0,0.03)]',
                        theme.bgLight
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className={cn(
                            'size-6 rounded-md flex items-center justify-center border shadow-2xs shrink-0',
                            theme.badge
                          )}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-ink leading-tight">
                            {attr.name}
                          </div>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-surface-inset text-ink-muted border border-border/60 inline-block mb-1.5">
                        {attr.code}
                      </span>

                      <p className="text-[10px] text-ink-muted leading-tight line-clamp-3">
                        {attr.description}
                      </p>
                    </td>

                    {/* 7 Level Statement Cells */}
                    {levels.map((lvl) => {
                      const statement = attr.levels[lvl.levelId] || '—'
                      const isSelected = lvl.levelId === selectedLevel
                      const isQueryMatched =
                        searchQuery.trim() !== '' &&
                        statement.toLowerCase().includes(searchQuery.toLowerCase().trim())

                      return (
                        <td
                          key={lvl.levelId}
                          onClick={() => onSelectLevel(lvl.levelId)}
                          className={cn(
                            'p-3 min-w-[280px] max-w-[340px] border-r border-border/60 align-top transition-colors cursor-pointer text-ink text-xs leading-relaxed',
                            isSelected
                              ? 'bg-brand/5 dark:bg-brand/10'
                              : 'hover:bg-surface-raised/60',
                            isQueryMatched && 'ring-2 ring-amber-500/50 bg-amber-500/10'
                          )}
                          title={`Level ${lvl.levelId} - ${attr.name}: Click to select level`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1 text-[10px] text-ink-muted">
                            <span className="font-mono font-bold">L{lvl.levelId}</span>
                            {isSelected && (
                              <span className="text-[9px] text-brand font-semibold uppercase">
                                Selected
                              </span>
                            )}
                          </div>
                          <p
                            className={cn(
                              'text-xs text-ink leading-relaxed',
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
      <div className="p-2 px-3 border-t border-border/80 bg-surface-raised flex items-center justify-between text-[11px] text-ink-muted shrink-0">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>5 Generic Attributes x 7 Levels Progression Matrix - SFIA 9 International Standard</span>
        </div>
        <div>
          <span>Selected Column: <strong className="text-ink font-semibold">Level {selectedLevel}</strong></span>
        </div>
      </div>
    </div>
  )
}
