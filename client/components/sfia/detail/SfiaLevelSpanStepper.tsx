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
import { getCategoryTheme, SFIA_LEVEL_DEFINITIONS } from './sfia-theme'

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
}: Readonly<SfiaLevelSpanStepperProps>) {
  const theme = getCategoryTheme(categoryCode)
  const containerRef = React.useRef<HTMLElement>(null)

  // Keyboard navigation: Left/Right arrows cycle through available levels; 1-7 jump directly
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
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
      const targetLvl = Number.parseInt(e.key, 10)
      if (targetLvl >= minLevel && targetLvl <= maxLevel) {
        e.preventDefault()
        onSelectLevel(targetLvl)
      }
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <section
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="SFIA 7-level responsibility span stepper"
        className={cn(
          'bg-surface-raised/40 border-border/70 focus-visible:ring-brand/40 space-y-3 rounded-xl border p-3.5 transition-colors focus:outline-none focus-visible:ring-2 sm:p-4',
          className
        )}
      >
        {/* Stepper Header Meta Row */}
        <div className="border-border/50 flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-ink flex items-center gap-1.5 text-xs font-bold">
              <Sparkles className="text-brand size-3.5 shrink-0" />
              <span>7-Level Responsibility Span Stepper</span>
            </span>
            <span className="text-ink-muted hidden text-[11px] sm:inline-block">
              (Use arrow keys ← → or 1-7 numbers to jump)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-ink-muted">Valid range:</span>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold',
                theme.badge
              )}
            >
              Level {minLevel} ➔ Level {maxLevel} ({maxLevel - minLevel + 1}/7
              Levels)
            </span>
          </div>
        </div>

        {/* 7-Level Step Track */}
        <div className="relative px-2 pb-1 pt-2 sm:px-4">
          {/* Horizontal Connecting Rail */}
          <div
            className="bg-border/80 absolute left-6 right-6 top-7 z-0 h-1 -translate-y-1/2 rounded-full"
            aria-hidden="true"
          >
            {/* Active Range Highlight Sub-Rail */}
            <div
              className={cn(
                'h-full rounded-full opacity-60 transition-all duration-300',
                theme.dot
              )}
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
                        className="group flex cursor-not-allowed select-none flex-col items-center gap-1.5 opacity-40"
                        aria-disabled="true"
                      >
                        <div className="bg-surface-inset border-border/80 text-ink-muted relative flex size-9 items-center justify-center rounded-full border font-mono text-xs font-medium transition-all sm:size-10">
                          <span>{lvl}</span>
                          <Ban className="absolute size-3.5 text-rose-500/70" />
                        </div>
                        <div className="text-center">
                          <span className="text-ink-muted block font-mono text-[10px] font-medium line-through sm:text-[11px]">
                            L{lvl}
                          </span>
                          <span className="text-ink-muted/80 hidden max-w-[48px] truncate text-[9px] sm:block sm:max-w-[70px]">
                            {def?.name || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs text-center text-xs"
                    >
                      <p className="font-semibold text-rose-300">
                        Not available at Level {lvl}
                      </p>
                      <p className="mt-0.5 text-[11px] opacity-90">
                        SFIA 9 standard does not define this skill at Level{' '}
                        {lvl}.
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
                        'focus-visible:ring-brand/60 group flex cursor-pointer select-none flex-col items-center gap-1.5 rounded-lg p-0.5 outline-none transition-all focus-visible:ring-2',
                        isSelected ? 'scale-105' : 'hover:scale-105'
                      )}
                    >
                      {/* Node Circle */}
                      <div
                        className={cn(
                          'shadow-xs relative flex size-9 items-center justify-center rounded-full border-2 font-mono text-xs font-bold transition-all duration-200 sm:size-10 sm:text-sm',
                          isSelected
                            ? cn(
                                'dark:text-ink-inverted ring-3 ring-brand/30 dark:border-ink scale-110 border-white text-white shadow-md',
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
                            'block font-mono text-[10px] font-bold sm:text-[11px]',
                            isSelected
                              ? theme.accent
                              : 'text-ink group-hover:text-brand'
                          )}
                        >
                          L{lvl}
                        </span>
                        <span
                          className={cn(
                            'block max-w-[50px] truncate text-[9px] leading-tight transition-colors sm:max-w-[76px] sm:text-[10px]',
                            isSelected
                              ? 'text-ink font-bold'
                              : 'text-ink-muted group-hover:text-ink'
                          )}
                          title={def?.name}
                        >
                          {def?.name}
                        </span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p className="text-brand font-semibold">
                      Level {lvl}: {def?.name}
                    </p>
                    <p className="text-ink-muted mt-1 text-[10px] italic">
                      Click to view behavioral criteria and statements
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      </section>
    </TooltipProvider>
  )
}
