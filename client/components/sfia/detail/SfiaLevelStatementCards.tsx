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
import type { SfiaSkillDetail } from '@/types'
import { getCategoryTheme, SFIA_LEVEL_DEFINITIONS } from './sfia-theme'

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
      <div className="bg-surface-raised/50 border-border/70 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2">
        <div className="text-ink-muted flex items-center gap-1.5 pl-1 text-xs">
          <Target className="text-brand size-3.5" />
          <span className="text-ink font-semibold">Level:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
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
                  'flex cursor-pointer select-none items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-all',
                  isSelected
                    ? cn('shadow-xs border-brand/50 font-bold', theme.badge)
                    : 'bg-card text-ink-muted hover:text-ink border-border/70 hover:border-border hover:bg-surface-raised'
                )}
              >
                <span className="font-mono">L{sl.levelId}</span>
                <span className="hidden sm:inline-block">
                  ({def?.name || `Level ${sl.levelId}`})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Out of Range / Invalid Level Warning Callout */}
      {!isLevelInRange && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 sm:flex-row sm:items-center sm:justify-between dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-xs">
              <p className="font-bold">
                Skill {skillDetail.code} is not applicable at Level{' '}
                {selectedLevel}
              </p>
              <p className="text-ink-muted mt-0.5 dark:text-amber-300/80">
                SFIA 9 defines the capability span for {skillDetail.name} from
                Level {skillDetail.minLevel} to Level {skillDetail.maxLevel}.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectLevel(skillDetail.minLevel)}
            className="bg-card h-8 shrink-0 gap-1.5 text-xs"
          >
            <span>Switch to Level {skillDetail.minLevel}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}

      {/* 2. Level Essence Callout Card */}
      <div
        className={cn(
          'bg-surface-raised/40 relative space-y-2.5 overflow-hidden rounded-xl border p-4 transition-all',
          theme.border,
          'border-l-4'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'dark:text-ink-inverted rounded-md p-1 text-white',
                theme.dot
              )}
            >
              <Sparkles className="size-3.5" />
            </div>
            <div>
              <h4 className="text-ink text-xs font-bold uppercase tracking-wider">
                Level {selectedLevel} Essence
              </h4>
              <p className="text-ink-muted text-[11px]">
                {levelDef?.name || `Level ${selectedLevel}`}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold',
              theme.badge
            )}
          >
            SFIA Level {selectedLevel}
          </span>
        </div>

        {/* Essence Quote */}
        <div className="border-border/80 text-ink relative border-l-2 pl-3 text-xs font-medium italic leading-relaxed sm:text-sm">
          <Quote className="text-ink-muted/40 absolute -left-1.5 -top-1 size-3" />
          <p className="text-ink">
            &ldquo;
            {currentStatement?.essence ||
              'Demonstrates professional competence and accountability at this level.'}
            &rdquo;
          </p>
        </div>
      </div>

      {/* 3. Detailed Behavioral Statements Card */}
      <div className="bg-card border-border/80 shadow-xs space-y-4 rounded-xl border p-4 sm:p-5">
        <div className="border-border/60 flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand/10 text-brand rounded-lg p-1.5">
              <BookOpen className="size-4" />
            </div>
            <div>
              <h3 className="text-ink text-sm font-bold">
                Behavioral Statements
              </h3>
              <p className="text-ink-muted text-xs">
                Evaluation criteria for{' '}
                <strong className="text-ink">{skillDetail.name}</strong> (
                {skillDetail.code}) at{' '}
                <strong className="text-ink">Level {selectedLevel}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-ink-muted text-[11px]">
              {parsedStatements.length}{' '}
              {parsedStatements.length === 1 ? 'statement' : 'statements'}
            </span>
          </div>
        </div>

        {/* Behavioral Statement Items List */}
        {currentStatement ? (
          <div className="space-y-2.5">
            {parsedStatements.map((statement, idx) => (
              <div
                key={idx}
                className="bg-surface-raised/30 border-border/50 hover:bg-surface-raised/60 flex items-start gap-3 rounded-lg border p-3 transition-colors"
              >
                <div className="mt-0.5 shrink-0">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-ink text-xs font-normal leading-relaxed sm:text-sm">
                    {statement}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-inset border-border/80 rounded-lg border border-dashed py-8 text-center">
            <p className="text-ink-muted text-xs">
              No specific behavioral statement data found for Level{' '}
              {selectedLevel}.
            </p>
            {availableLevels.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectLevel(availableLevels[0])}
                className="mt-3 gap-1 text-xs"
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
