'use client'

import React from 'react'
import {
  SlidersHorizontal,
  Grid3X3,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from './types'
import type { SfiaAttributesViewMode } from './useSfiaParams'
import { SfiaLevelAttributesView } from './SfiaLevelAttributesView'
import { SfiaAttributesProgressionMatrix } from './SfiaAttributesProgressionMatrix'

export interface SfiaGenericAttributesViewProps {
  levels: SfiaLevelResponsibility[]
  attributes: SfiaGenericAttribute[]
  selectedLevel: number
  onSelectLevel: (levelId: number) => void
  viewMode: SfiaAttributesViewMode
  onViewModeChange: (mode: SfiaAttributesViewMode) => void
  onNavigateToMatrixWithLevel?: (levelId: number) => void
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
}

export function SfiaGenericAttributesView({
  levels,
  attributes,
  selectedLevel,
  onSelectLevel,
  viewMode,
  onViewModeChange,
  onNavigateToMatrixWithLevel,
  loading = false,
  error = null,
  onRetry,
  className,
}: SfiaGenericAttributesViewProps) {
  // Loading Skeleton State
  if (loading) {
    return (
      <div className={cn('flex flex-col gap-4 animate-pulse', className)}>
        {/* Skeleton Top Bar */}
        <div className="h-14 bg-card border border-border/80 rounded-xl" />
        {/* Skeleton Stepper */}
        <div className="h-20 bg-card border border-border/80 rounded-xl" />
        {/* Skeleton Hero */}
        <div className="h-44 bg-card border border-border/80 rounded-xl" />
        {/* Skeleton 5 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 bg-card border border-border/80 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // Error Fallback State
  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 bg-card border border-rose-500/30 rounded-xl text-center',
          className
        )}
      >
        <div className="size-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="text-base font-bold text-ink mb-1">
          Failed to load SFIA Levels & Generic Attributes
        </h3>
        <p className="text-xs text-ink-muted max-w-md mb-4">{error}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2 text-xs font-semibold"
          >
            <RefreshCw className="size-3.5" />
            <span>Try Again</span>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 min-h-0',
        viewMode === 'matrix' ? 'h-full flex-1 overflow-hidden' : '',
        className
      )}
    >
      {/* Top Header Controls: Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3 bg-card border border-border/80 rounded-xl shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/20">
            <SlidersHorizontal className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-ink leading-tight">
                7 Levels of Responsibility & 5 Core Generic Attributes
              </h2>
              <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded-md px-1.5 py-0.2 text-[10px] font-semibold">
                SFIA 9
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-ink-muted mt-0.5">
              <span>Multi-dimensional evaluation standards for AI evaluation</span>
              <span>•</span>
              <span className="font-medium text-ink">7 Levels</span>
              <span>•</span>
              <span className="font-medium text-ink">5 Core Pillars</span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher: Level-Centric vs Progression Matrix */}
        <div className="shrink-0">
          <Tabs
            value={viewMode}
            onValueChange={(val) => onViewModeChange(val as SfiaAttributesViewMode)}
          >
            <TabsList className="bg-surface-inset h-8 p-0.5">
              <TabsTrigger
                value="level"
                className="gap-1.5 text-xs font-semibold px-3 py-1"
                aria-label="Level-Centric View"
              >
                <SlidersHorizontal className="size-3.5" />
                <span>By Level</span>
              </TabsTrigger>
              <TabsTrigger
                value="matrix"
                className="gap-1.5 text-xs font-semibold px-3 py-1"
                aria-label="Progression Matrix View"
              >
                <Grid3X3 className="size-3.5" />
                <span>Progression Matrix</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'level' ? (
        <SfiaLevelAttributesView
          levels={levels}
          attributes={attributes}
          selectedLevel={selectedLevel}
          onSelectLevel={onSelectLevel}
          onNavigateToMatrixWithLevel={onNavigateToMatrixWithLevel}
        />
      ) : (
        <SfiaAttributesProgressionMatrix
          levels={levels}
          attributes={attributes}
          selectedLevel={selectedLevel}
          onSelectLevel={onSelectLevel}
          className="flex-1 min-h-0"
        />
      )}
    </div>
  )
}
