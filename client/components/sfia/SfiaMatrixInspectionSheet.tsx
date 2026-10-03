'use client'

import React, { useEffect, useState } from 'react'
import {
  FolderTree,
  Copy,
  Plus,
  AlertTriangle,
  HelpCircle,
  Briefcase,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type SfiaCategory,
  type SfiaSkillDetail,
} from './types'
import { sfiaAdminService } from '@/services/sfia-admin.service'
import { getCategoryTheme, getLevelTheme } from './sfia-theme'
import { generateSfiaRubricMarkdownPrompt } from './sfia-prompt-helper'

export interface SfiaMatrixInspectionSheetProps {
  isOpen: boolean
  onClose: () => void
  skillCode: string | null
  levelId: number | null
  categories?: SfiaCategory[]
  onOpenInTaxonomy: (skillCode: string, levelId: number) => void
  onCreateQuestion: (skillCode: string, levelId: number) => void
}

export function SfiaMatrixInspectionSheet({
  isOpen,
  onClose,
  skillCode,
  levelId,
  onOpenInTaxonomy,
  onCreateQuestion,
}: SfiaMatrixInspectionSheetProps) {
  const [detail, setDetail] = useState<SfiaSkillDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load detailed skill data when sheet opens with valid skillCode
  useEffect(() => {
    let isCancelled = false

    async function loadData() {
      if (!isOpen || !skillCode) {
        setDetail(null)
        setError(null)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await sfiaAdminService.getSkillDetail(skillCode)
        if (!isCancelled) {
          if (data) {
            setDetail(data)
          } else {
            setError(`Skill data not found for ${skillCode}`)
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load skill details'
          )
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      isCancelled = true
    }
  }, [isOpen, skillCode])

  const levelInfo = levelId ? getLevelTheme(levelId) : null
  const theme = getCategoryTheme(detail?.categoryCode)
  const levelStatement = detail?.skillLevels?.find((l) => l.levelId === levelId)

  // Questions and O*NET mapped at this specific level
  const levelQuestions =
    detail?.questionBankItems?.filter((q) => q.targetSfiaLevel === levelId) || []
  const levelOnetMappings =
    detail?.onetMappings?.filter((m) => m.targetLevel === levelId) || []
  const isBlindSpot = levelQuestions.length === 0

  const handleCopyPrompt = async () => {
    if (!detail || !levelId) return
    try {
      const promptMarkdown = generateSfiaRubricMarkdownPrompt(detail, levelId)
      await navigator.clipboard.writeText(promptMarkdown)
      toast.success(
        `Copied rubric prompt for ${detail.code} Level ${levelId}!`,
        {
          description: 'You can paste it directly into LLM Evaluator testing.',
        }
      )
    } catch {
      toast.error('Failed to copy prompt to clipboard')
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-card overflow-hidden shadow-2xl border-l border-border"
      >
        {/* Sheet Top Header */}
        <SheetHeader className="p-4 border-b border-border/80 bg-surface-raised/40 shrink-0 text-left">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={cn(
                'rounded px-2 py-0.5 font-mono text-xs font-bold border',
                theme.badge
              )}
            >
              {skillCode}
            </span>
            <span className="text-[11px] font-medium text-ink-muted bg-surface-inset px-2 py-0.5 rounded-full border border-border">
              {theme.name}
            </span>
            {detail?.subcategoryCode && (
              <span className="text-[11px] font-mono text-ink-muted">
                / {detail.subcategoryCode}
              </span>
            )}
          </div>

          <SheetTitle className="text-base sm:text-lg font-bold text-ink leading-snug">
            {detail?.name || skillCode}
          </SheetTitle>

          <SheetDescription className="text-xs text-ink-muted mt-0.5">
            SFIA 9 Competency Inspection & Interview Mapping
          </SheetDescription>

          {/* Level Hero Identity Badge */}
          {levelId && levelInfo && (
            <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl border border-border bg-card shadow-xs">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-mono text-xs font-bold px-2 py-1 rounded-md border',
                    theme.badge
                  )}
                >
                  Level {levelId}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-ink leading-none">
                    {levelInfo.name}
                  </h4>
                </div>
              </div>

              {isBlindSpot ? (
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  Blind Spot (0 Q)
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {levelQuestions.length} questions
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Sheet Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 text-ink-muted gap-3">
              <LoadingSpinner className="size-6 text-brand" />
              <span>Loading skill information for {skillCode}...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300 text-center">
              <p className="font-medium mb-2">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (skillCode) {
                    setLoading(true)
                    setError(null)
                    sfiaAdminService
                      .getSkillDetail(skillCode)
                      .then((d) => setDetail(d))
                      .catch((e) => setError(e.message))
                      .finally(() => setLoading(false))
                  }
                }}
              >
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {/* 1. Level Essence */}
              {levelStatement?.essence && (
                <div
                  className={cn(
                    'p-3 rounded-xl border-l-4 bg-surface-raised/40 border border-border shadow-xs',
                    theme.border
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block mb-1">
                    Level Essence
                  </span>
                  <p className="italic text-ink font-medium leading-relaxed">
                    &ldquo;{levelStatement.essence}&rdquo;
                  </p>
                </div>
              )}

              {/* 2. SFIA Level Statement */}
              <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
                <div className="flex items-center gap-1.5 font-bold text-ink mb-2">
                  <BookOpen className="size-4 text-brand" />
                  <span>Standard SFIA Competency Statement</span>
                </div>
                <p className="text-ink leading-relaxed whitespace-pre-line text-xs">
                  {levelStatement?.description ||
                    `Competency standard for ${detail.name} at Level ${levelId}.`}
                </p>
              </div>

              {/* 3. Mapped Question Bank at this level */}
              <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <HelpCircle className="size-4 text-brand" />
                    <span>Mapped Question Bank ({levelQuestions.length})</span>
                  </div>
                </div>

                {isBlindSpot ? (
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <AlertTriangle className="size-3.5 text-amber-600" />
                      <span>Blind Spot Warning</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      No interview questions currently mapped for {skillCode} at Level {levelId}. Click &ldquo;Create Question&rdquo; below to add one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {levelQuestions.slice(0, 3).map((q) => (
                      <div
                        key={q.id}
                        className="p-2.5 rounded-lg border border-border/70 bg-surface-inset/50 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-ink-muted">{q.id}</span>
                          <span className="font-semibold px-1.5 py-0.2 rounded bg-card border border-border">
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-ink font-medium text-xs line-clamp-2">
                          {q.questionText}
                        </p>
                      </div>
                    ))}
                    {levelQuestions.length > 3 && (
                      <p className="text-[10px] text-ink-muted text-center italic">
                        and {levelQuestions.length - 3} other questions...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Mapped O*NET Occupations at this level */}
              <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <Briefcase className="size-4 text-brand" />
                    <span>O*NET Occupations requiring this level ({levelOnetMappings.length})</span>
                  </div>
                </div>

                {levelOnetMappings.length === 0 ? (
                  <p className="text-ink-muted italic text-[11px]">
                    No O*NET occupations specifically mapped to this level.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {levelOnetMappings.map((m) => (
                      <div
                        key={m.socCode}
                        className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-surface-inset/40 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-ink font-semibold">
                            {m.socCode}
                          </span>
                          <span className="text-ink truncate max-w-[180px]">
                            {m.occupationTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {m.isCore && (
                            <span className="bg-brand/10 text-brand text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Core
                            </span>
                          )}
                          <span className="text-ink-muted text-[10px] font-mono">
                            w:{m.weight}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sheet Fixed Footer Action Buttons */}
        <SheetFooter className="p-3 border-t border-border bg-surface-raised/70 shrink-0 flex flex-col sm:flex-row gap-2">
          {/* Action 1: Open in Taxonomy Tree (Tab 1) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (skillCode && levelId) {
                onOpenInTaxonomy(skillCode, levelId)
                onClose()
              }
            }}
            className="w-full sm:flex-1 text-xs gap-1.5 font-semibold h-9"
            title="Switch to Taxonomy Tree and select this skill"
          >
            <FolderTree className="size-3.5" />
            <span>Open in Tree</span>
          </Button>

          {/* Action 2: Copy AI Prompt Rubric */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyPrompt}
            disabled={!detail || !levelId}
            className="w-full sm:flex-1 text-xs gap-1.5 font-semibold h-9"
            title="Copy evaluation rubric prompt to clipboard"
          >
            <Copy className="size-3.5" />
            <span>Copy AI Prompt</span>
          </Button>

          {/* Action 3: Create Question for this Level */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (skillCode && levelId) {
                onCreateQuestion(skillCode, levelId)
              }
            }}
            disabled={!skillCode || !levelId}
            className="w-full sm:flex-1 text-xs gap-1.5 font-semibold h-9"
            title="Create new interview question for this skill and level"
          >
            <Plus className="size-3.5" />
            <span>Create Question</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
