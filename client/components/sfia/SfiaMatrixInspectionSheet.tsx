'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { sfiaAdminQueries } from '@/queries/sfia.queries'
import { getCategoryTheme, getLevelTheme } from './sfia-theme'
import { generateSfiaRubricMarkdownPrompt } from './sfia-prompt-helper'

export interface SfiaMatrixInspectionSheetProps {
  isOpen: boolean
  onClose: () => void
  skillCode: string | null
  levelId: number | null
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
}: Readonly<SfiaMatrixInspectionSheetProps>) {
  const {
    data: detail = null,
    isLoading: loading,
    error: queryError,
    isFetched,
    refetch,
  } = useQuery({
    ...sfiaAdminQueries.skillDetail(skillCode ?? ''),
    enabled: isOpen && Boolean(skillCode),
  })

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? 'Failed to load skill details'
        : isOpen && Boolean(skillCode) && isFetched && !detail
          ? `Skill data not found for ${skillCode}`
          : null

  const levelInfo = levelId ? getLevelTheme(levelId) : null
  const theme = getCategoryTheme(detail?.categoryCode)
  const levelStatement = detail?.skillLevels?.find((l) => l.levelId === levelId)

  // Questions and O*NET mapped at this specific level
  const levelQuestions =
    detail?.questionBankItems?.filter((q) => q.targetSfiaLevel === levelId) ||
    []
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
        className="bg-card border-border flex h-full w-full flex-col overflow-hidden border-l p-0 shadow-2xl sm:max-w-lg"
      >
        {/* Sheet Top Header */}
        <SheetHeader className="border-border/80 bg-surface-raised/40 shrink-0 border-b p-4 text-left">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded border px-2 py-0.5 font-mono text-xs font-bold',
                theme.badge
              )}
            >
              {skillCode}
            </span>
            <span className="text-ink-muted bg-surface-inset border-border rounded-full border px-2 py-0.5 text-[11px] font-medium">
              {theme.name}
            </span>
            {detail?.subcategoryCode && (
              <span className="text-ink-muted font-mono text-[11px]">
                / {detail.subcategoryCode}
              </span>
            )}
          </div>

          <SheetTitle className="text-ink text-base font-bold leading-snug sm:text-lg">
            {detail?.name || skillCode}
          </SheetTitle>

          <SheetDescription className="text-ink-muted mt-0.5 text-xs">
            SFIA 9 Competency Inspection & Interview Mapping
          </SheetDescription>

          {/* Level Hero Identity Badge */}
          {levelId && levelInfo && (
            <div className="border-border bg-card shadow-xs mt-3 flex items-center justify-between rounded-xl border p-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-md border px-2 py-1 font-mono text-xs font-bold',
                    theme.badge
                  )}
                >
                  Level {levelId}
                </span>
                <div>
                  <h4 className="text-ink text-xs font-bold leading-none">
                    {levelInfo.name}
                  </h4>
                </div>
              </div>

              {isBlindSpot ? (
                <span className="flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="size-3" />
                  Blind Spot (0 Q)
                </span>
              ) : (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {levelQuestions.length} questions
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Sheet Scrollable Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
          {loading && (
            <div className="text-ink-muted flex flex-col items-center justify-center gap-3 p-12">
              <LoadingSpinner className="text-brand size-6" />
              <span>Loading skill information for {skillCode}...</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center text-rose-800 dark:text-rose-300">
              <p className="mb-2 font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (skillCode) {
                    void refetch()
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
                    'bg-surface-raised/40 border-border shadow-xs rounded-xl border border-l-4 p-3',
                    theme.border
                  )}
                >
                  <span className="text-ink-muted mb-1 block text-[10px] font-bold uppercase tracking-wider">
                    Level Essence
                  </span>
                  <p className="text-ink font-medium italic leading-relaxed">
                    &ldquo;{levelStatement.essence}&rdquo;
                  </p>
                </div>
              )}

              {/* 2. SFIA Level Statement */}
              <div className="border-border bg-card shadow-xs rounded-xl border p-3.5">
                <div className="text-ink mb-2 flex items-center gap-1.5 font-bold">
                  <BookOpen className="text-brand size-4" />
                  <span>Standard SFIA Competency Statement</span>
                </div>
                <p className="text-ink whitespace-pre-line text-xs leading-relaxed">
                  {levelStatement?.description ||
                    `Competency standard for ${detail.name} at Level ${levelId}.`}
                </p>
              </div>

              {/* 3. Mapped Question Bank at this level */}
              <div className="border-border bg-card shadow-xs space-y-2.5 rounded-xl border p-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-ink flex items-center gap-1.5 font-bold">
                    <HelpCircle className="text-brand size-4" />
                    <span>Mapped Question Bank ({levelQuestions.length})</span>
                  </div>
                </div>

                {isBlindSpot ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-200">
                    <div className="mb-1 flex items-center gap-2 font-bold">
                      <AlertTriangle className="size-3.5 text-amber-600" />
                      <span>Blind Spot Warning</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      No interview questions currently mapped for {skillCode} at
                      Level {levelId}. Click &ldquo;Create Question&rdquo; below
                      to add one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {levelQuestions.slice(0, 3).map((q) => (
                      <div
                        key={q.id}
                        className="border-border/70 bg-surface-inset/50 space-y-1 rounded-lg border p-2.5"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-ink-muted font-mono">
                            {q.id}
                          </span>
                          <span className="py-0.2 bg-card border-border rounded border px-1.5 font-semibold">
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-ink line-clamp-2 text-xs font-medium">
                          {q.questionText}
                        </p>
                      </div>
                    ))}
                    {levelQuestions.length > 3 && (
                      <p className="text-ink-muted text-center text-[10px] italic">
                        and {levelQuestions.length - 3} other questions...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Mapped O*NET Occupations at this level */}
              <div className="border-border bg-card shadow-xs space-y-2 rounded-xl border p-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-ink flex items-center gap-1.5 font-bold">
                    <Briefcase className="text-brand size-4" />
                    <span>
                      O*NET Occupations requiring this level (
                      {levelOnetMappings.length})
                    </span>
                  </div>
                </div>

                {levelOnetMappings.length === 0 ? (
                  <p className="text-ink-muted text-[11px] italic">
                    No O*NET occupations specifically mapped to this level.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {levelOnetMappings.map((m) => (
                      <div
                        key={m.socCode}
                        className="border-border/60 bg-surface-inset/40 flex items-center justify-between rounded-lg border p-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-ink font-mono text-[11px] font-semibold">
                            {m.socCode}
                          </span>
                          <span className="text-ink max-w-[180px] truncate">
                            {m.occupationTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {m.isCore && (
                            <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[9px] font-bold">
                              Core
                            </span>
                          )}
                          <span className="text-ink-muted font-mono text-[10px]">
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
        <SheetFooter className="border-border bg-surface-raised/70 flex shrink-0 flex-col gap-2 border-t p-3 sm:flex-row">
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
            className="h-9 w-full gap-1.5 text-xs font-semibold sm:flex-1"
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
            className="h-9 w-full gap-1.5 text-xs font-semibold sm:flex-1"
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
            className="h-9 w-full gap-1.5 text-xs font-semibold sm:flex-1"
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
