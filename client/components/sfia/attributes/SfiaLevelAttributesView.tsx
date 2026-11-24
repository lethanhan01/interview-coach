'use client'

import React, { useState } from 'react'
import {
  Compass,
  Users,
  Cpu,
  Briefcase,
  BookOpen,
  Copy,
  Check,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from '@/types'
import { getAttributeTheme } from '@/components/sfia/sfia-theme'
import { copySfiaLevelPromptToClipboard } from './sfia-attributes-prompt-helper'

export interface SfiaLevelAttributesViewProps {
  levels: SfiaLevelResponsibility[]
  attributes: SfiaGenericAttribute[]
  selectedLevel: number
  onSelectLevel: (levelId: number) => void
  onNavigateToMatrixWithLevel?: (levelId: number) => void
  className?: string
}

// Icon mapper using lookup table per Safe Dynamic Styling
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

// Level-specific badge styling lookup table
const LEVEL_BADGE_VARIANTS: Record<
  number,
  { active: string; inactive: string }
> = {
  1: {
    active: 'bg-slate-500 text-white border-slate-600 shadow-sm',
    inactive:
      'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20',
  },
  2: {
    active: 'bg-blue-600 text-white border-blue-700 shadow-sm',
    inactive:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
  },
  3: {
    active: 'bg-emerald-600 text-white border-emerald-700 shadow-sm',
    inactive:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  },
  4: {
    active: 'bg-cyan-600 text-white border-cyan-700 shadow-sm',
    inactive:
      'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
  },
  5: {
    active: 'bg-violet-600 text-white border-violet-700 shadow-sm',
    inactive:
      'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20',
  },
  6: {
    active: 'bg-amber-600 text-white border-amber-700 shadow-sm',
    inactive:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  },
  7: {
    active: 'bg-rose-600 text-white border-rose-700 shadow-sm',
    inactive:
      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
  },
}

export function SfiaLevelAttributesView({
  levels,
  attributes,
  selectedLevel,
  onSelectLevel,
  onNavigateToMatrixWithLevel,
  className,
}: SfiaLevelAttributesViewProps) {
  const [copied, setCopied] = useState(false)

  // Current selected level object
  const currentLevel = levels.find((l) => l.levelId === selectedLevel) ||
    levels[0] || {
      levelId: selectedLevel,
      name: `Level ${selectedLevel}`,
      nameVi: `Level ${selectedLevel}`,
      essence: 'No essence data for this level.',
      description: 'No description data for this level.',
    }

  // Copy AI Prompt handler
  const handleCopyPrompt = async () => {
    const success = await copySfiaLevelPromptToClipboard(
      currentLevel,
      attributes,
      'markdown'
    )
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* 1. Responsive 7-Level Horizontal Stepper */}
      <div className="bg-card border-border/80 shadow-xs rounded-xl border p-2.5 sm:p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers className="text-brand size-4" />
            <span className="text-ink text-xs font-semibold uppercase tracking-wider">
              Select Responsibility Level (SFIA Levels 1 - 7)
            </span>
          </div>
          <span className="text-ink-muted text-[11px]">
            Viewing:{' '}
            <strong className="text-ink font-semibold">
              Level {selectedLevel}
            </strong>{' '}
            — {currentLevel.name}
          </span>
        </div>

        {/* Stepper bar: scrollable on mobile with scroll-snap, flex-grid on desktop */}
        <div className="scrollbar-none flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {levels.map((lvl) => {
            const isSelected = lvl.levelId === selectedLevel
            const variant =
              LEVEL_BADGE_VARIANTS[lvl.levelId] || LEVEL_BADGE_VARIANTS[1]

            return (
              <button
                key={lvl.levelId}
                type="button"
                onClick={() => onSelectLevel(lvl.levelId)}
                className={cn(
                  'focus-visible:ring-brand group flex min-w-[110px] flex-1 cursor-pointer snap-start flex-col items-center justify-center rounded-lg border p-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 sm:min-w-0',
                  isSelected
                    ? cn(variant.active, 'ring-brand/30 ring-2')
                    : 'bg-surface-inset border-border hover:border-border-strong text-ink-muted hover:text-ink'
                )}
                aria-pressed={isSelected}
                aria-label={`Select Level ${lvl.levelId} - ${lvl.name}`}
              >
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span
                    className={cn(
                      'py-0.2 rounded-md px-1.5 font-mono text-[10px] font-bold',
                      isSelected
                        ? 'bg-black/20 text-white'
                        : 'bg-surface-raised text-ink'
                    )}
                  >
                    L{lvl.levelId}
                  </span>
                  <span
                    className={cn(
                      'max-w-[80px] truncate text-xs font-bold',
                      isSelected ? 'text-white' : 'text-ink'
                    )}
                  >
                    {lvl.name}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Level Responsibility Hero Card */}
      <div className="bg-card border-border/80 shadow-xs flex flex-col gap-3.5 rounded-xl border p-4 sm:p-5">
        <div className="border-border/60 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'shadow-xs flex size-11 items-center justify-center rounded-xl font-mono text-lg font-extrabold sm:size-12 sm:text-xl',
                LEVEL_BADGE_VARIANTS[selectedLevel]?.active ||
                  'bg-brand text-white'
              )}
            >
              L{selectedLevel}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-ink text-base font-bold tracking-tight sm:text-lg">
                  Level {selectedLevel} — {currentLevel.name}
                </h2>
              </div>
              <p className="text-ink-muted mt-0.5 text-xs">
                International behavioral and responsibility standards under SFIA
                9
              </p>
            </div>
          </div>

          {/* Quick Actions for Level */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPrompt}
              className="gap-1.5 text-xs font-semibold"
              title="Copy Rubric standard to paste into System Prompt for AI Evaluator"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy AI Prompt</span>
                </>
              )}
            </Button>

            {onNavigateToMatrixWithLevel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateToMatrixWithLevel(selectedLevel)}
                className="text-ink-muted hover:text-ink gap-1.5 text-xs"
                title={`View all SFIA skills applicable at Level ${selectedLevel} in 2D Matrix`}
              >
                <span>View Level {selectedLevel} Skills</span>
                <ChevronRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Essence Callout Box */}
        <div className="bg-surface-inset border-brand flex flex-col gap-1 rounded-r-lg border-l-4 p-3.5">
          <div className="text-brand flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            <span>Essence of Level {selectedLevel}</span>
          </div>
          <p className="text-ink text-xs font-medium italic leading-relaxed sm:text-sm">
            &quot;{currentLevel.essence}&quot;
          </p>
        </div>

        {/* General Scope and Authority */}
        <div className="flex flex-col gap-1 text-xs">
          <span className="text-ink font-semibold">
            General Scope and Responsibility:
          </span>
          <p className="text-ink-muted text-xs leading-relaxed sm:text-sm">
            {currentLevel.description}
          </p>
        </div>
      </div>

      {/* 3. Grid of 5 Fundamental Generic Attributes */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="bg-brand size-2 rounded-full" />
            <h3 className="text-ink text-xs font-bold uppercase tracking-wider sm:text-sm">
              5 Core Generic Attributes at Level {selectedLevel}
            </h3>
          </div>
          <span className="text-ink-muted text-[11px]">
            Behavioral benchmark criteria for AI assessment
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {attributes.map((attr) => {
            const theme = getAttributeTheme(attr.code)
            const Icon = ATTRIBUTE_ICONS[attr.code] || Compass
            const statement =
              attr.levels[selectedLevel] ||
              'No statement defined for this level.'

            return (
              <div
                key={attr.code}
                className={cn(
                  'bg-card border-border/80 hover:border-border-strong shadow-xs group flex flex-col justify-between rounded-xl border p-4 transition-all',
                  theme.bgLight
                )}
              >
                <div>
                  {/* Card Header */}
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'shadow-xs flex size-8 items-center justify-center rounded-lg border',
                          theme.badge
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-ink text-sm font-bold leading-tight">
                          {attr.name}
                        </h4>
                      </div>
                    </div>
                    <span className="bg-surface-inset text-ink-muted border-border/60 rounded-md border px-1.5 py-0.5 font-mono text-[10px]">
                      {attr.code}
                    </span>
                  </div>

                  {/* Overview description */}
                  <p className="text-ink-muted mb-3 line-clamp-2 text-xs leading-relaxed">
                    {attr.description}
                  </p>
                </div>

                {/* Level Specific Standard Callout */}
                <div
                  className={cn(
                    'bg-card relative mt-auto rounded-lg border p-3',
                    theme.border
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider',
                        theme.accent
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      <span>Level {selectedLevel} Standard</span>
                    </span>
                    <span className="text-ink-muted font-mono text-[10px]">
                      L{selectedLevel}
                    </span>
                  </div>
                  <p className="text-ink text-xs font-medium leading-relaxed sm:text-[13px]">
                    {statement}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
