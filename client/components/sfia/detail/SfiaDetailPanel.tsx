'use client'

import * as React from 'react'
import {
  Copy,
  Check,
  Grid3X3,
  Bot,
  Layers,
  HelpCircle,
  Briefcase,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import type { SfiaCategory, SfiaSubcategory, SfiaSkillDetail } from '@/types'
import { getCategoryTheme, SFIA_LEVEL_DEFINITIONS } from './sfia-theme'
import { SfiaLevelSpanStepper } from './SfiaLevelSpanStepper'
import { SfiaLevelStatementCards } from './SfiaLevelStatementCards'
import { SfiaGuidanceNotes } from './SfiaGuidanceNotes'
import { SfiaAiPromptModal } from './SfiaAiPromptModal'
import { SfiaOnetMappingsTab } from './SfiaOnetMappingsTab'
import { SfiaQuestionBankTab } from './SfiaQuestionBankTab'

export interface SfiaDetailPanelProps {
  skillDetail: SfiaSkillDetail | null
  loading?: boolean
  error?: string | null
  categories: SfiaCategory[]
  subcategories: SfiaSubcategory[]
  selectedLevel: number
  onSelectLevel: (level: number) => void
  onSkillUpdated?: (detail: SfiaSkillDetail) => void
  onNavigateToMatrix?: () => void
  onRetry?: () => void
  className?: string
}

export function SfiaDetailPanel({
  skillDetail,
  loading = false,
  error = null,
  categories,
  subcategories,
  selectedLevel,
  onSelectLevel,
  onSkillUpdated,
  onNavigateToMatrix,
  onRetry,
  className,
}: SfiaDetailPanelProps) {
  const [copiedCode, setCopiedCode] = React.useState(false)
  const [aiModalOpen, setAiModalOpen] = React.useState(false)
  const [activeSubTab, setActiveSubTab] = React.useState<
    'statements' | 'onet' | 'questions'
  >('statements')

  const handleCopyCode = async () => {
    if (!skillDetail) return
    try {
      await navigator.clipboard.writeText(skillDetail.code)
      setCopiedCode(true)
      toast.success(`Đã sao chép mã kỹ năng: ${skillDetail.code}`)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      toast.error('Không thể sao chép mã kỹ năng')
    }
  }

  // Loading Skeleton State
  if (loading) {
    return (
      <div
        className={cn(
          'bg-card border-border/80 animate-pulse space-y-5 rounded-xl border p-4 sm:p-6',
          className
        )}
      >
        {/* Header Skeleton */}
        <div className="border-border/60 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-surface-inset size-12 shrink-0 rounded-xl" />
            <div className="space-y-2">
              <div className="bg-surface-inset h-5 w-48 rounded" />
              <div className="bg-surface-inset h-3.5 w-72 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-surface-inset h-8 w-24 rounded-lg" />
            <div className="bg-surface-inset h-8 w-28 rounded-lg" />
          </div>
        </div>

        {/* KPI Metrics Skeleton */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-inset h-16 rounded-lg" />
          ))}
        </div>

        {/* Stepper Skeleton */}
        <div className="bg-surface-inset h-28 rounded-xl" />

        {/* Content Skeleton */}
        <div className="bg-surface-inset h-48 rounded-xl" />
      </div>
    )
  }

  // Error State
  if (error || !skillDetail) {
    return (
      <div
        className={cn(
          'bg-card border-border/80 flex min-h-[400px] flex-col items-center justify-center rounded-xl border p-8 text-center',
          className
        )}
      >
        <div className="bg-destructive/10 text-destructive mb-3 rounded-full p-3">
          <AlertCircle className="size-8" />
        </div>
        <h3 className="text-ink mb-1 text-base font-bold">
          {error || 'SFIA skill details not found'}
        </h3>
        <p className="text-ink-muted mb-4 max-w-sm text-xs leading-relaxed">
          Failed to load skill details or the skill does not exist in the
          system. Please try again or select a different skill.
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="size-3.5" />
            <span>Try Again</span>
          </Button>
        )}
      </div>
    )
  }

  const currentCat = categories.find((c) => c.code === skillDetail.categoryCode)
  const currentSub = subcategories.find(
    (s) => s.code === skillDetail.subcategoryCode
  )
  const theme = getCategoryTheme(skillDetail.categoryCode)
  const levelDef = SFIA_LEVEL_DEFINITIONS[selectedLevel]

  return (
    <div
      className={cn(
        'bg-card border-border/80 shadow-xs space-y-4 rounded-xl border p-4 sm:p-5',
        className
      )}
    >
      {/* 1. Hero Identity Header Card */}
      <div className="border-border/60 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {/* Skill Code Badge Avatar */}
          <div
            className={cn(
              'shadow-xs flex size-12 shrink-0 items-center justify-center rounded-xl border font-mono text-base font-bold',
              theme.badge
            )}
          >
            {skillDetail.code}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-ink text-base font-bold sm:text-lg">
                {skillDetail.name}
              </h2>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                  theme.badge
                )}
              >
                Level {skillDetail.minLevel} ➔ Level {skillDetail.maxLevel}
              </span>
            </div>

            {/* Breadcrumb Path */}
            <div className="text-ink-muted mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="flex items-center gap-1">
                <span className={cn('size-2 rounded-full', theme.dot)} />
                <strong className="text-ink font-medium">
                  {currentCat?.name || skillDetail.categoryCode}
                </strong>
              </span>
              <span>›</span>
              <span>{currentSub?.name || skillDetail.subcategoryCode}</span>
              <span>›</span>
              <span className="text-ink font-mono font-semibold">
                {skillDetail.code}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="h-8 gap-1.5 px-2.5 text-xs"
            title="Copy skill code"
          >
            {copiedCode ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Copied
                </span>
              </>
            ) : (
              <>
                <Copy className="text-ink-muted size-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiModalOpen(true)}
            className="border-brand/40 text-brand hover:bg-brand/5 hover:text-brand h-8 gap-1.5 px-2.5 text-xs"
            title="Open AI Evaluator System Prompt Template"
          >
            <Bot className="size-3.5" />
            <span>AI Rubric Prompt</span>
          </Button>

          {onNavigateToMatrix && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToMatrix}
              className="text-ink-muted hover:text-ink h-8 gap-1.5 px-2.5 text-xs"
              title="View skill position in 2D Matrix"
            >
              <Grid3X3 className="size-3.5" />
              <span className="hidden sm:inline-block">2D Matrix</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Mini KPI Metric Badges */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="bg-surface-inset border-border/50 rounded-lg border p-3">
          <span className="text-ink-muted text-[11px]">
            Standard Level Span
          </span>
          <p className="text-ink mt-0.5 font-mono text-sm font-bold">
            L{skillDetail.minLevel} to L{skillDetail.maxLevel} (
            {skillDetail.maxLevel - skillDetail.minLevel + 1} levels)
          </p>
        </div>
        <div className="bg-surface-inset border-border/50 rounded-lg border p-3">
          <span className="text-ink-muted text-[11px]">
            Interview Questions
          </span>
          <p className="text-ink mt-0.5 text-sm font-bold">
            {skillDetail.questionBankItems?.length || skillDetail.questionCount}{' '}
            questions
          </p>
        </div>
        <div className="bg-surface-inset border-border/50 rounded-lg border p-3">
          <span className="text-ink-muted text-[11px]">
            Mapped O*NET Occupations
          </span>
          <p className="text-ink mt-0.5 text-sm font-bold">
            {skillDetail.onetMappings?.length || skillDetail.onetCount}{' '}
            occupations
          </p>
        </div>
        <div className="bg-surface-inset border-border/50 rounded-lg border p-3">
          <span className="text-ink-muted text-[11px]">Active Level</span>
          <p className="text-brand mt-0.5 text-sm font-bold">
            L{selectedLevel} ({levelDef?.name || ''})
          </p>
        </div>
      </div>

      {/* 3. Interactive 7-Level Span Stepper (Phase 3.1) */}
      <SfiaLevelSpanStepper
        minLevel={skillDetail.minLevel}
        maxLevel={skillDetail.maxLevel}
        selectedLevel={selectedLevel}
        categoryCode={skillDetail.categoryCode}
        onSelectLevel={onSelectLevel}
      />

      {/* 4. Sub-Tabs Workspace (Statements / O*NET / Question Bank) */}
      <Tabs
        value={activeSubTab}
        onValueChange={(val) =>
          setActiveSubTab(val as 'statements' | 'onet' | 'questions')
        }
        className="space-y-3 pt-1"
      >
        <TabsList className="bg-surface-inset h-9 w-full justify-start overflow-x-auto p-1">
          <TabsTrigger value="statements" className="gap-1.5 px-3 py-1 text-xs">
            <Layers className="size-3.5" />
            <span>Behavioral Statements & Guidance</span>
          </TabsTrigger>
          <TabsTrigger value="onet" className="gap-1.5 px-3 py-1 text-xs">
            <Briefcase className="size-3.5" />
            <span>O*NET Occupations</span>
            <span className="font-mono text-[10px] opacity-75">
              ({skillDetail.onetMappings?.length || skillDetail.onetCount || 0})
            </span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-1.5 px-3 py-1 text-xs">
            <HelpCircle className="size-3.5" />
            <span>Question Bank & Create</span>
            <span className="font-mono text-[10px] opacity-75">
              (
              {skillDetail.questionBankItems?.length ||
                skillDetail.questionCount ||
                0}
              )
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Behavioral Statements & Guidance Notes (Phase 3 Core) */}
        <TabsContent value="statements" className="mt-0 space-y-3.5">
          {/* Level Statement Cards & Essence (Phase 3.2) */}
          <SfiaLevelStatementCards
            skillDetail={skillDetail}
            selectedLevel={selectedLevel}
            onSelectLevel={onSelectLevel}
          />

          {/* Guidance Notes Accordion (Phase 3.3) */}
          <SfiaGuidanceNotes
            guidanceNotes={skillDetail.guidanceNotes}
            skillName={skillDetail.name}
          />
        </TabsContent>

        {/* Tab 2: O*NET Mappings (Phase 4 Integrated) */}
        <TabsContent value="onet" className="mt-0">
          <SfiaOnetMappingsTab
            skillCode={skillDetail.code}
            skillName={skillDetail.name}
            onetMappings={skillDetail.onetMappings || []}
          />
        </TabsContent>

        {/* Tab 3: Question Bank & Create Modal (Phase 4 Integrated) */}
        <TabsContent value="questions" className="mt-0">
          <SfiaQuestionBankTab
            skillDetail={skillDetail}
            selectedLevel={selectedLevel}
            onSelectLevel={onSelectLevel}
            onQuestionCreated={(newQ) => {
              if (!skillDetail) return
              const updated: SfiaSkillDetail = {
                ...skillDetail,
                questionCount: (skillDetail.questionCount || 0) + 1,
                questionBankItems: [
                  newQ,
                  ...(skillDetail.questionBankItems || []),
                ],
              }
              onSkillUpdated?.(updated)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* AI Rubric Modal Dialog (Phase 3.3) */}
      <SfiaAiPromptModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        skillDetail={skillDetail}
        selectedLevel={selectedLevel}
      />
    </div>
  )
}
