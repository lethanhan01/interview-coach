'use client'

import * as React from 'react'
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Quote,
  Target,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { SfiaSkillDetail } from './types'
import {
  getCategoryTheme,
  SFIA_LEVEL_DEFINITIONS,
} from './sfia-theme'

export interface SfiaLevelStatementCardsProps {
  skillDetail: SfiaSkillDetail
  selectedLevel: number
  onSelectLevel: (level: number) => void
  className?: string
}

export function SfiaLevelStatementCards({
  skillDetail,
  selectedLevel,
  onSelectLevel,
  className,
}: SfiaLevelStatementCardsProps) {
  const theme = getCategoryTheme(skillDetail.categoryCode)

  // Find level statement data for currently selected level
  const currentStatement = skillDetail.skillLevels.find(
    (sl) => sl.levelId === selectedLevel
  )

  const levelDef = SFIA_LEVEL_DEFINITIONS[selectedLevel]

  const availableLevels = skillDetail.skillLevels.map((sl) => sl.levelId)
  const isLevelInRange =
    selectedLevel >= skillDetail.minLevel &&
    selectedLevel <= skillDetail.maxLevel

  // Split description text into structured bullet points if it contains multiple sentences
  const parsedStatements = React.useMemo(() => {
    if (!currentStatement?.description) return []

    const text = currentStatement.description.trim()
    // Split on period followed by whitespace or uppercase letter, ignoring abbreviations
    const rawParts = text.split(/(?<=\.)\s+(?=[A-ZÀ-Ỹ0-9])/)
    const cleaned = rawParts.map((p) => p.trim()).filter((p) => p.length > 0)

    if (cleaned.length <= 1 && text.length > 80) {
      // If single long block, return as single paragraph bullet
      return [text]
    }
    return cleaned.length > 0 ? cleaned : [text]
  }, [currentStatement])

  return (
    <div className={cn('space-y-3.5', className)}>
      {/* 1. Quick Level Selector Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-surface-raised/50 border border-border/70 rounded-xl p-2">
        <div className="flex items-center gap-1.5 text-xs text-ink-muted pl-1">
          <Target className="size-3.5 text-brand" />
          <span className="font-semibold text-ink">Level:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {skillDetail.skillLevels.map((sl) => {
            const isSelected = sl.levelId === selectedLevel
            const def = SFIA_LEVEL_DEFINITIONS[sl.levelId]

            return (
              <button
                key={sl.levelId}
                type="button"
                onClick={() => onSelectLevel(sl.levelId)}
                aria-current={isSelected ? 'page' : undefined}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer select-none border',
                  isSelected
                    ? cn(
                        'shadow-xs font-bold border-brand/50',
                        theme.badge
                      )
                    : 'bg-card text-ink-muted hover:text-ink border-border/70 hover:border-border hover:bg-surface-raised'
                )}
              >
                <span className="font-mono">L{sl.levelId}</span>
                <span className="hidden sm:inline-block">({def?.name || `Level ${sl.levelId}`})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Out of Range / Invalid Level Warning Callout */}
      {!isLevelInRange && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">
                Skill {skillDetail.code} is not applicable at Level {selectedLevel}
              </p>
              <p className="text-ink-muted dark:text-amber-300/80 mt-0.5">
                SFIA 9 defines the capability span for {skillDetail.name} from Level {skillDetail.minLevel} to Level {skillDetail.maxLevel}.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectLevel(skillDetail.minLevel)}
            className="h-8 text-xs gap-1.5 shrink-0 bg-card"
          >
            <span>Switch to Level {skillDetail.minLevel}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}

      {/* 2. Level Essence Callout Card */}
      <div
        className={cn(
          'bg-surface-raised/40 border rounded-xl p-4 space-y-2.5 relative overflow-hidden transition-all',
          theme.border,
          'border-l-4'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn('p-1 rounded-md text-white dark:text-ink-inverted', theme.dot)}>
              <Sparkles className="size-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Level {selectedLevel} Essence
              </h4>
              <p className="text-[11px] text-ink-muted">
                {levelDef?.name || `Level ${selectedLevel}`}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0',
              theme.badge
            )}
          >
            SFIA Level {selectedLevel}
          </span>
        </div>

        {/* Essence Quote */}
        <div className="relative pl-3 border-l-2 border-border/80 text-xs sm:text-sm text-ink font-medium italic leading-relaxed">
          <Quote className="size-3 absolute -top-1 -left-1.5 text-ink-muted/40" />
          <p className="text-ink">
            &ldquo;{currentStatement?.essence || 'Demonstrates professional competence and accountability at this level.'}&rdquo;
          </p>
        </div>
      </div>

      {/* 3. Detailed Behavioral Statements Card */}
      <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
              <BookOpen className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">
                Behavioral Statements
              </h3>
              <p className="text-xs text-ink-muted">
                Evaluation criteria for <strong className="text-ink">{skillDetail.name}</strong> ({skillDetail.code}) at <strong className="text-ink">Level {selectedLevel}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-muted">
              {parsedStatements.length} {parsedStatements.length === 1 ? 'statement' : 'statements'}
            </span>
          </div>
        </div>

        {/* Behavioral Statement Items List */}
        {currentStatement ? (
          <div className="space-y-2.5">
            {parsedStatements.map((statement, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-surface-raised/30 border border-border/50 hover:bg-surface-raised/60 transition-colors"
              >
                <div className="mt-0.5 shrink-0">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-xs sm:text-sm text-ink leading-relaxed font-normal">
                    {statement}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-surface-inset rounded-lg border border-dashed border-border/80">
            <p className="text-xs text-ink-muted">
              No specific behavioral statement data found for Level {selectedLevel}.
            </p>
            {availableLevels.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectLevel(availableLevels[0])}
                className="mt-3 text-xs gap-1"
              >
                <span>View available Level {availableLevels[0]}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
