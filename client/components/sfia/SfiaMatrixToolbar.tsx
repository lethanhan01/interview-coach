'use client'

import React from 'react'
import {
  Search,
  X,
  Download,
  AlertTriangle,
  Layers,
  HelpCircle,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  type SfiaCategory,
  type SfiaMatrixDisplayMode,
} from './types'
import { getCategoryTheme } from './sfia-theme'

export interface SfiaMatrixToolbarProps {
  categories: SfiaCategory[]
  selectedCategory: string
  onCategoryChange: (categoryCode: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  displayMode: SfiaMatrixDisplayMode
  onDisplayModeChange: (mode: SfiaMatrixDisplayMode) => void
  blindSpotsOnly: boolean
  onBlindSpotsOnlyChange: (enabled: boolean) => void
  onExportCsv: () => void
  totalSkillsCount: number
  displayedSkillsCount: number
  blindSpotsCount?: number
  isExporting?: boolean
  className?: string
}

export function SfiaMatrixToolbar({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  displayMode,
  onDisplayModeChange,
  blindSpotsOnly,
  onBlindSpotsOnlyChange,
  onExportCsv,
  totalSkillsCount,
  displayedSkillsCount,
  blindSpotsCount,
  isExporting = false,
  className,
}: SfiaMatrixToolbarProps) {
  return (
    <div
      className={cn(
        'bg-card border-border/80 flex flex-col gap-2.5 rounded-xl border p-3 shadow-sm',
        className
      )}
    >
      {/* Top Row: Search, Category Filter, and Export CSV */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Quick Search Input */}
          <div className="relative w-full sm:w-64 lg:w-72">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search code (PROG) or skill name..."
              leadingIcon={<Search className="size-4 text-ink-muted" />}
              trailingAction={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                    className="text-ink-muted hover:text-ink absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null
              }
              className="h-9 text-xs"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="w-full sm:w-56">
            <Select
              value={selectedCategory || 'ALL'}
              onValueChange={(val) => onCategoryChange(val === 'ALL' ? '' : val)}
            >
              <SelectTrigger
                aria-label="Filter by category"
                className="h-9 text-xs"
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <span className="font-medium">All Categories ({categories.length})</span>
                </SelectItem>
                {categories.map((cat) => {
                  const theme = getCategoryTheme(cat.code)
                  return (
                    <SelectItem key={cat.code} value={cat.code}>
                      <div className="flex items-center gap-2">
                        <span className={cn('size-2 rounded-full shrink-0', theme.dot)} />
                        <span className="truncate">{cat.name}</span>
                        <span className="text-[10px] text-ink-muted ml-auto font-mono">
                          ({cat.skillCount})
                        </span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Action: CSV Export Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            disabled={isExporting}
            className="h-9 gap-1.5 text-xs font-semibold px-3"
            title="Export matrix data to UTF-8 CSV"
          >
            <Download className="size-3.5" />
            <span>{isExporting ? 'Exporting CSV...' : 'Export Matrix CSV'}</span>
          </Button>
        </div>
      </div>

      {/* Bottom Controls Row: Display Mode Selector, Blind Spots Toggle, and Active Counts */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Display Mode Segmented Controls */}
          <div className="flex items-center gap-1 text-xs text-ink-muted">
            <span className="text-[11px] font-medium mr-1 text-ink-muted">Cell display:</span>
            <div className="bg-surface-inset p-0.5 rounded-lg flex items-center border border-border/60">
              <button
                type="button"
                onClick={() => onDisplayModeChange('level')}
                className={cn(
                  'px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1',
                  displayMode === 'level'
                    ? 'bg-card text-ink shadow-xs font-semibold'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <Layers className="size-3" />
                <span>Level</span>
              </button>
              <button
                type="button"
                onClick={() => onDisplayModeChange('questions')}
                className={cn(
                  'px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1',
                  displayMode === 'questions'
                    ? 'bg-card text-ink shadow-xs font-semibold'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <HelpCircle className="size-3" />
                <span>Questions</span>
              </button>
              <button
                type="button"
                onClick={() => onDisplayModeChange('onet')}
                className={cn(
                  'px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1',
                  displayMode === 'onet'
                    ? 'bg-card text-ink shadow-xs font-semibold'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <Briefcase className="size-3" />
                <span>O*NET</span>
              </button>
            </div>
          </div>

          {/* Blind Spots Only Toggle Switch */}
          <div
            className={cn(
              'flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition-colors',
              blindSpotsOnly
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-surface-inset border-border/60 text-ink'
            )}
          >
            <Switch
              id="sfia-blind-spots-toggle"
              checked={blindSpotsOnly}
              onCheckedChange={onBlindSpotsOnlyChange}
              className="scale-75"
            />
            <label
              htmlFor="sfia-blind-spots-toggle"
              className="cursor-pointer font-medium text-[11px] flex items-center gap-1.5 select-none"
            >
              <AlertTriangle
                className={cn(
                  'size-3.5',
                  blindSpotsOnly ? 'text-amber-600 dark:text-amber-400' : 'text-ink-muted'
                )}
              />
              <span>Blind spots only (0 questions)</span>
              {blindSpotsCount !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                    blindSpotsOnly
                      ? 'bg-amber-500 text-white'
                      : 'bg-surface-raised text-ink-muted border border-border'
                  )}
                >
                  {blindSpotsCount}
                </span>
              )}
            </label>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-ink-muted">
          <span className="text-[11px]">
            Showing: <strong className="text-ink">{displayedSkillsCount}</strong> /{' '}
            <span>{totalSkillsCount} skills</span>
          </span>
        </div>
      </div>
    </div>
  )
}
