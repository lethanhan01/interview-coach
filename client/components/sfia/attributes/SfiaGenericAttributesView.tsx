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
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from '@/types'
import type { SfiaAttributesViewMode } from '@/components/sfia/useSfiaParams'
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
      <div className={cn('flex animate-pulse flex-col gap-4', className)}>
        {/* Skeleton Top Bar */}
        <div className="bg-card border-border/80 h-14 rounded-xl border" />
        {/* Skeleton Stepper */}
        <div className="bg-card border-border/80 h-20 rounded-xl border" />
        {/* Skeleton Hero */}
        <div className="bg-card border-border/80 h-44 rounded-xl border" />
        {/* Skeleton 5 Cards Grid */}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-card border-border/80 h-48 rounded-xl border"
            />
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
          'bg-card flex flex-col items-center justify-center rounded-xl border border-rose-500/30 p-8 text-center',
          className
        )}
      >
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="text-ink mb-1 text-base font-bold">
          Failed to load SFIA Levels & Generic Attributes
        </h3>
        <p className="text-ink-muted mb-4 max-w-md text-xs">{error}</p>
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
        'flex min-h-0 flex-col gap-3',
        viewMode === 'matrix' ? 'h-full flex-1 overflow-hidden' : '',
        className
      )}
    >
      {/* Top Header Controls: Title & View Switcher */}
      <div className="bg-card border-border/80 shadow-xs flex shrink-0 flex-col gap-2.5 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <SlidersHorizontal className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-ink text-sm font-bold leading-tight sm:text-base">
                7 Levels of Responsibility & 5 Core Generic Attributes
              </h2>
              <span className="py-0.2 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                SFIA 9
              </span>
            </div>
            <div className="text-ink-muted mt-0.5 flex items-center gap-2 text-[11px]">
              <span>
                Multi-dimensional evaluation standards for AI evaluation
              </span>
              <span>•</span>
              <span className="text-ink font-medium">7 Levels</span>
              <span>•</span>
              <span className="text-ink font-medium">5 Core Pillars</span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher: Level-Centric vs Progression Matrix */}
        <div className="shrink-0">
          <Tabs
            value={viewMode}
            onValueChange={(val) =>
              onViewModeChange(val as SfiaAttributesViewMode)
            }
          >
            <TabsList className="bg-surface-inset h-8 p-0.5">
              <TabsTrigger
                value="level"
                className="gap-1.5 px-3 py-1 text-xs font-semibold"
                aria-label="Level-Centric View"
              >
                <SlidersHorizontal className="size-3.5" />
                <span>By Level</span>
              </TabsTrigger>
              <TabsTrigger
                value="matrix"
                className="gap-1.5 px-3 py-1 text-xs font-semibold"
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
          className="min-h-0 flex-1"
        />
      )}
    </div>
  )
}
