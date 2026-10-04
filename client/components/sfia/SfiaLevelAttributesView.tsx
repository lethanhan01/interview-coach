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
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from './types'
import {
  getAttributeTheme,
} from './sfia-theme'
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
const ATTRIBUTE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AUTONOMY: Compass,
  INFLUENCE: Users,
  COMPLEXITY: Cpu,
  BUSINESS_SKILLS: Briefcase,
  KNOWLEDGE: BookOpen,
}

// Level-specific badge styling lookup table
const LEVEL_BADGE_VARIANTS: Record<number, { active: string; inactive: string }> = {
  1: {
    active: 'bg-slate-500 text-white border-slate-600 shadow-sm',
    inactive: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20',
  },
  2: {
    active: 'bg-blue-600 text-white border-blue-700 shadow-sm',
    inactive: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
  },
  3: {
    active: 'bg-emerald-600 text-white border-emerald-700 shadow-sm',
    inactive: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  },
  4: {
    active: 'bg-cyan-600 text-white border-cyan-700 shadow-sm',
    inactive: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
  },
  5: {
    active: 'bg-violet-600 text-white border-violet-700 shadow-sm',
    inactive: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20',
  },
  6: {
    active: 'bg-amber-600 text-white border-amber-700 shadow-sm',
    inactive: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  },
  7: {
    active: 'bg-rose-600 text-white border-rose-700 shadow-sm',
    inactive: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
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
  const currentLevel =
    levels.find((l) => l.levelId === selectedLevel) ||
    levels[0] || {
      levelId: selectedLevel,
      name: `Level ${selectedLevel}`,
      nameVi: `Level ${selectedLevel}`,
      essence: 'No essence data for this level.',
      description: 'No description data for this level.',
    }

  // Copy AI Prompt handler
  const handleCopyPrompt = async () => {
    const success = await copySfiaLevelPromptToClipboard(currentLevel, attributes, 'markdown')
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* 1. Responsive 7-Level Horizontal Stepper */}
      <div className="bg-card border border-border/80 rounded-xl p-2.5 sm:p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-brand" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              Select Responsibility Level (SFIA Levels 1 - 7)
            </span>
          </div>
          <span className="text-[11px] text-ink-muted">
            Viewing: <strong className="text-ink font-semibold">Level {selectedLevel}</strong> — {currentLevel.name}
          </span>
        </div>

        {/* Stepper bar: scrollable on mobile with scroll-snap, flex-grid on desktop */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none snap-x snap-mandatory">
          {levels.map((lvl) => {
            const isSelected = lvl.levelId === selectedLevel
            const variant = LEVEL_BADGE_VARIANTS[lvl.levelId] || LEVEL_BADGE_VARIANTS[1]

            return (
              <button
                key={lvl.levelId}
                type="button"
                onClick={() => onSelectLevel(lvl.levelId)}
                className={cn(
                  'flex-1 min-w-[110px] sm:min-w-0 snap-start flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  isSelected
                    ? cn(variant.active, 'ring-2 ring-brand/30')
                    : 'bg-surface-inset border-border hover:border-border-strong text-ink-muted hover:text-ink'
                )}
                aria-pressed={isSelected}
                aria-label={`Select Level ${lvl.levelId} - ${lvl.name}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.2 rounded-md font-mono',
                      isSelected ? 'bg-black/20 text-white' : 'bg-surface-raised text-ink'
                    )}
                  >
                    L{lvl.levelId}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-bold truncate max-w-[80px]',
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
      <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'size-11 sm:size-12 rounded-xl flex items-center justify-center font-mono font-extrabold text-lg sm:text-xl shadow-xs',
                LEVEL_BADGE_VARIANTS[selectedLevel]?.active || 'bg-brand text-white'
              )}
            >
              L{selectedLevel}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight">
                  Level {selectedLevel} — {currentLevel.name}
                </h2>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                International behavioral and responsibility standards under SFIA 9
              </p>
            </div>
          </div>

          {/* Quick Actions for Level */}
          <div className="flex items-center gap-2 shrink-0">
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
                className="gap-1.5 text-xs text-ink-muted hover:text-ink"
                title={`View all SFIA skills applicable at Level ${selectedLevel} in 2D Matrix`}
              >
                <span>View Level {selectedLevel} Skills</span>
                <ChevronRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Essence Callout Box */}
        <div className="bg-surface-inset border-l-4 border-brand p-3.5 rounded-r-lg flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-brand text-xs font-bold uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            <span>Essence of Level {selectedLevel}</span>
          </div>
          <p className="text-xs sm:text-sm text-ink italic font-medium leading-relaxed">
            &quot;{currentLevel.essence}&quot;
          </p>
        </div>

        {/* General Scope and Authority */}
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-ink">General Scope and Responsibility:</span>
          <p className="text-ink-muted leading-relaxed text-xs sm:text-sm">
            {currentLevel.description}
          </p>
        </div>
      </div>

      {/* 3. Grid of 5 Fundamental Generic Attributes */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand" />
            <h3 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">
              5 Core Generic Attributes at Level {selectedLevel}
            </h3>
          </div>
          <span className="text-[11px] text-ink-muted">
            Behavioral benchmark criteria for AI assessment
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {attributes.map((attr) => {
            const theme = getAttributeTheme(attr.code)
            const Icon = ATTRIBUTE_ICONS[attr.code] || Compass
            const statement = attr.levels[selectedLevel] || 'No statement defined for this level.'

            return (
              <div
                key={attr.code}
                className={cn(
                  'bg-card border border-border/80 hover:border-border-strong rounded-xl p-4 shadow-xs transition-all flex flex-col justify-between group',
                  theme.bgLight
                )}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'size-8 rounded-lg flex items-center justify-center border shadow-xs',
                          theme.badge
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-ink leading-tight">
                          {attr.name}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-surface-inset text-ink-muted border border-border/60">
                      {attr.code}
                    </span>
                  </div>

                  {/* Overview description */}
                  <p className="text-xs text-ink-muted leading-relaxed mb-3 line-clamp-2">
                    {attr.description}
                  </p>
                </div>

                {/* Level Specific Standard Callout */}
                <div
                  className={cn(
                    'mt-auto bg-card border rounded-lg p-3 relative',
                    theme.border
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider flex items-center gap-1',
                        theme.accent
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      <span>Level {selectedLevel} Standard</span>
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted">
                      L{selectedLevel}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-ink font-medium leading-relaxed">
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
