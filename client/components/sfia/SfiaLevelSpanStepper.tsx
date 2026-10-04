'use client'

import * as React from 'react'
import { Ban, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip'
import {
  getCategoryTheme,
  SFIA_LEVEL_DEFINITIONS,
} from './sfia-theme'

export interface SfiaLevelSpanStepperProps {
  minLevel: number
  maxLevel: number
  selectedLevel: number
  categoryCode: string
  onSelectLevel: (level: number) => void
  className?: string
}

const ALL_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const

export function SfiaLevelSpanStepper({
  minLevel,
  maxLevel,
  selectedLevel,
  categoryCode,
  onSelectLevel,
  className,
}: SfiaLevelSpanStepperProps) {
  const theme = getCategoryTheme(categoryCode)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Keyboard navigation: Left/Right arrows cycle through available levels; 1-7 jump directly
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const nextLevel = selectedLevel + 1
      if (nextLevel <= maxLevel) {
        onSelectLevel(nextLevel)
      } else {
        onSelectLevel(minLevel) // Wrap around
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prevLevel = selectedLevel - 1
      if (prevLevel >= minLevel) {
        onSelectLevel(prevLevel)
      } else {
        onSelectLevel(maxLevel) // Wrap around
      }
    } else if (/^[1-7]$/.test(e.key)) {
      const targetLvl = parseInt(e.key, 10)
      if (targetLvl >= minLevel && targetLvl <= maxLevel) {
        e.preventDefault()
        onSelectLevel(targetLvl)
      }
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="SFIA 7-level responsibility span stepper"
        className={cn(
          'bg-surface-raised/40 border border-border/70 rounded-xl p-3.5 sm:p-4 space-y-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
          className
        )}
      >
        {/* Stepper Header Meta Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-brand shrink-0" />
              <span>7-Level Responsibility Span Stepper</span>
            </span>
            <span className="text-[11px] text-ink-muted hidden sm:inline-block">
              (Use arrow keys ← → or 1-7 numbers to jump)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-ink-muted">Valid range:</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold border',
                theme.badge
              )}
            >
              Level {minLevel} ➔ Level {maxLevel} ({maxLevel - minLevel + 1}/7 Levels)
            </span>
          </div>
        </div>

        {/* 7-Level Step Track */}
        <div className="relative pt-2 pb-1 px-2 sm:px-4">
          {/* Horizontal Connecting Rail */}
          <div
            className="absolute top-7 left-6 right-6 h-1 bg-border/80 rounded-full -translate-y-1/2 z-0"
            aria-hidden="true"
          >
            {/* Active Range Highlight Sub-Rail */}
            <div
              className={cn('h-full rounded-full transition-all duration-300 opacity-60', theme.dot)}
              style={{
                left: `${((minLevel - 1) / 6) * 100}%`,
                width: `${((maxLevel - minLevel) / 6) * 100}%`,
                position: 'absolute',
              }}
            />
          </div>

          {/* 7 Nodes Grid */}
          <div className="relative z-10 grid grid-cols-7 gap-1 sm:gap-2">
            {ALL_LEVELS.map((lvl) => {
              const isAvailable = lvl >= minLevel && lvl <= maxLevel
              const isSelected = lvl === selectedLevel
              const def = SFIA_LEVEL_DEFINITIONS[lvl]

              if (!isAvailable) {
                return (
                  <Tooltip key={lvl}>
                    <TooltipTrigger asChild>
                      <div
                        className="flex flex-col items-center gap-1.5 opacity-40 cursor-not-allowed group select-none"
                        aria-disabled="true"
                      >
                        <div className="relative size-9 sm:size-10 rounded-full bg-surface-inset border border-border/80 flex items-center justify-center text-xs font-mono font-medium text-ink-muted transition-all">
                          <span>{lvl}</span>
                          <Ban className="size-3.5 absolute text-rose-500/70" />
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] sm:text-[11px] font-mono font-medium text-ink-muted line-through block">
                            L{lvl}
                          </span>
                          <span className="text-[9px] text-ink-muted/80 truncate max-w-[48px] sm:max-w-[70px] hidden sm:block">
                            {def?.name || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-xs text-center">
                      <p className="font-semibold text-rose-300">Not available at Level {lvl}</p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        SFIA 9 standard does not define this skill at Level {lvl}.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Tooltip key={lvl}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onSelectLevel(lvl)}
                      aria-current={isSelected ? 'step' : undefined}
                      aria-label={`Select Level ${lvl} - ${def?.name}`}
                      className={cn(
                        'flex flex-col items-center gap-1.5 group cursor-pointer select-none transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand/60 rounded-lg p-0.5',
                        isSelected ? 'scale-105' : 'hover:scale-105'
                      )}
                    >
                      {/* Node Circle */}
                      <div
                        className={cn(
                          'relative size-9 sm:size-10 rounded-full font-mono font-bold text-xs sm:text-sm flex items-center justify-center transition-all duration-200 border-2 shadow-xs',
                          isSelected
                            ? cn(
                                'text-white dark:text-ink-inverted ring-3 ring-brand/30 border-white dark:border-ink scale-110 shadow-md',
                                theme.dot
                              )
                            : cn(
                                'bg-card text-ink hover:text-brand border-border/80 hover:border-brand/60 hover:bg-surface-raised'
                              )
                        )}
                      >
                        <span>{lvl}</span>
                      </div>

                      {/* Node Label Text */}
                      <div className="text-center">
                        <span
                          className={cn(
                            'text-[10px] sm:text-[11px] font-mono font-bold block',
                            isSelected
                              ? theme.accent
                              : 'text-ink group-hover:text-brand'
                          )}
                        >
                          L{lvl}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] sm:text-[10px] truncate max-w-[50px] sm:max-w-[76px] block transition-colors leading-tight',
                            isSelected
                              ? 'font-bold text-ink'
                              : 'text-ink-muted group-hover:text-ink'
                          )}
                          title={def?.name}
                        >
                          {def?.name}
                        </span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-xs">
                    <p className="font-semibold text-brand">
                      Level {lvl}: {def?.name}
                    </p>
                    <p className="text-[10px] text-ink-muted mt-1 italic">
                      Click to view behavioral criteria and statements
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
