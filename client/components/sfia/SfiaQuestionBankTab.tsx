'use client'

import * as React from 'react'
import {
  HelpCircle,
  Search,
  Plus,
  Copy,
  Check,
  X,
  Sparkles,
  BarChart2,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import { SfiaCreateQuestionModal } from './SfiaCreateQuestionModal'
import type { SfiaSkillDetail, SfiaQuestionBankItem } from './types'

export interface SfiaQuestionBankTabProps {
  skillDetail: SfiaSkillDetail
  selectedLevel: number
  onSelectLevel?: (level: number) => void
  onQuestionCreated?: (newQuestion: SfiaQuestionBankItem) => void
  className?: string
}

// Lookup table an toàn cho badges độ khó
const QUESTION_DIFFICULTY_BADGES = {
  EASY: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  HARD: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
} as const

const DIFFICULTY_LABELS: Record<'EASY' | 'MEDIUM' | 'HARD', string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
}

// Lookup table for interview category badges
const QUESTION_TYPE_BADGES = {
  TECHNICAL: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  BEHAVIORAL: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  SITUATIONAL: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  HR: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
} as const

const TYPE_LABELS: Record<'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' | 'HR', string> = {
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  SITUATIONAL: 'Situational',
  HR: 'HR',
}

export function SfiaQuestionBankTab({
  skillDetail,
  selectedLevel,
  onSelectLevel,
  onQuestionCreated,
  className,
}: SfiaQuestionBankTabProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterLevel, setFilterLevel] = React.useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = React.useState<string>('ALL')
  const [filterType, setFilterType] = React.useState<string>('ALL')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [newlyCreatedId, setNewlyCreatedId] = React.useState<string | null>(null)

  const items = React.useMemo(
    () => skillDetail.questionBankItems || [],
    [skillDetail.questionBankItems]
  )

  // Đếm các thông số phân bổ
  const stats = React.useMemo(() => {
    let easy = 0
    let medium = 0
    let hard = 0
    let technical = 0
    let behavioral = 0
    let situational = 0
    let hr = 0
    let matchingCurrentLevel = 0

    items.forEach((q) => {
      if (q.difficulty === 'EASY') easy++
      else if (q.difficulty === 'MEDIUM') medium++
      else if (q.difficulty === 'HARD') hard++

      if (q.type === 'TECHNICAL') technical++
      else if (q.type === 'BEHAVIORAL') behavioral++
      else if (q.type === 'SITUATIONAL') situational++
      else if (q.type === 'HR') hr++

      if (q.targetSfiaLevel === selectedLevel) matchingCurrentLevel++
    })

    return {
      total: items.length,
      easy,
      medium,
      hard,
      technical,
      behavioral,
      situational,
      hr,
      matchingCurrentLevel,
    }
  }, [items, selectedLevel])

  // Lọc danh sách câu hỏi
  const filteredQuestions = React.useMemo(() => {
    return items.filter((q) => {
      // 1. Lọc theo search keyword
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchText = q.questionText.toLowerCase().includes(query)
        const matchId = q.id.toLowerCase().includes(query)
        if (!matchText && !matchId) return false
      }

      // 2. Lọc theo Level
      if (filterLevel === 'current') {
        if (q.targetSfiaLevel !== selectedLevel) return false
      } else if (filterLevel !== 'all') {
        if (q.targetSfiaLevel !== Number(filterLevel)) return false
      }

      // 3. Lọc theo Độ khó
      if (filterDifficulty !== 'ALL' && q.difficulty !== filterDifficulty) {
        return false
      }

      // 4. Lọc theo Loại phỏng vấn
      if (filterType !== 'ALL' && q.type !== filterType) {
        return false
      }

      return true
    })
  }, [items, searchQuery, filterLevel, filterDifficulty, filterType, selectedLevel])

  // Handle copying question text
  const handleCopyQuestion = async (q: SfiaQuestionBankItem) => {
    try {
      await navigator.clipboard.writeText(q.questionText)
      setCopiedId(q.id)
      toast.success(`Question (${q.id}) copied to clipboard!`)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Failed to copy question')
    }
  }

  // Handle newly created question callback
  const handleQuestionCreatedInternal = (newQ: SfiaQuestionBankItem) => {
    setNewlyCreatedId(newQ.id)
    onQuestionCreated?.(newQ)

    // If active filters hide the newly created question, reset filters
    if (filterLevel !== 'all' && filterLevel !== String(newQ.targetSfiaLevel)) {
      setFilterLevel('all')
    }
    if (filterDifficulty !== 'ALL' && filterDifficulty !== newQ.difficulty) {
      setFilterDifficulty('ALL')
    }
    if (filterType !== 'ALL' && filterType !== newQ.type) {
      setFilterType('ALL')
    }

    setTimeout(() => setNewlyCreatedId(null), 4000)
  }

  const isFiltered =
    searchQuery.trim() !== '' ||
    filterLevel !== 'all' ||
    filterDifficulty !== 'ALL' ||
    filterType !== 'ALL'

  return (
    <div className={cn('space-y-4', className)}>
      {/* 1. 4 Mini KPI Distribution Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* KPI 1: Total Questions */}
        <div className="bg-surface-inset p-3 rounded-xl border border-border/60">
          <div className="flex items-center justify-between text-ink-muted text-[11px]">
            <span>Total Sample Questions</span>
            <HelpCircle className="size-3.5 text-brand" />
          </div>
          <p className="text-base sm:text-lg font-bold text-ink mt-1 font-mono tabular-nums">
            {stats.total}{' '}
            <span className="text-xs font-normal text-ink-muted">questions</span>
          </p>
        </div>

        {/* KPI 2: Difficulty Distribution */}
        <div className="bg-surface-inset p-3 rounded-xl border border-border/60">
          <div className="flex items-center justify-between text-ink-muted text-[11px]">
            <span>Difficulty Breakdown</span>
            <BarChart2 className="size-3.5 text-amber-500" />
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {stats.easy} Easy
            </span>
            <span className="text-ink-muted text-[10px]">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-500" />
              {stats.medium} Medium
            </span>
            <span className="text-ink-muted text-[10px]">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              <span className="size-1.5 rounded-full bg-rose-500" />
              {stats.hard} Hard
            </span>
          </div>
        </div>

        {/* KPI 3: Question Category Breakdown */}
        <div className="bg-surface-inset p-3 rounded-xl border border-border/60">
          <div className="flex items-center justify-between text-ink-muted text-[11px]">
            <span>Question Types</span>
            <SlidersHorizontal className="size-3.5 text-violet-500" />
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-ink flex-wrap">
            <span className="font-semibold text-violet-600 dark:text-violet-400">
              {stats.technical} Tech
            </span>
            <span className="text-ink-muted text-[10px]">·</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {stats.behavioral} Behavioral
            </span>
            <span className="text-ink-muted text-[10px]">·</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              {stats.situational + stats.hr} Other
            </span>
          </div>
        </div>

        {/* KPI 4: Matching Current Level */}
        <div className="bg-surface-inset p-3 rounded-xl border border-border/60">
          <div className="flex items-center justify-between text-ink-muted text-[11px]">
            <span>At Selected Level {selectedLevel}</span>
            <Sparkles className="size-3.5 text-brand" />
          </div>
          <p className="text-base sm:text-lg font-bold text-brand mt-1 font-mono tabular-nums">
            {stats.matchingCurrentLevel}{' '}
            <span className="text-xs font-normal text-ink-muted">questions</span>
          </p>
        </div>
      </div>

      {/* 2. Toolbar: Search, Filters & Action Button */}
      <div className="bg-surface-inset/60 p-3 rounded-xl border border-border/60 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search question content or ID..."
              leadingIcon={<Search className="size-3.5" />}
              trailingAction={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="size-5 rounded flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                ) : undefined
              }
              className="h-8 text-xs bg-background"
            />
          </div>

          {/* Action Button: Create Question */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-8 px-3 text-xs gap-1.5 shrink-0 self-start sm:self-auto shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Create Question</span>
          </Button>
        </div>

        {/* Filter Pills / Selects */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/40">
          {/* Quick toggle: Level only */}
          <button
            type="button"
            onClick={() =>
              setFilterLevel((prev) => (prev === 'current' ? 'all' : 'current'))
            }
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all select-none flex items-center gap-1.5',
              filterLevel === 'current'
                ? 'bg-brand/10 border-brand text-brand font-semibold shadow-xs'
                : 'bg-background border-border text-ink-muted hover:text-ink'
            )}
          >
            <Sparkles className="size-3" />
            <span>Level {selectedLevel} only ({stats.matchingCurrentLevel})</span>
          </button>

          {/* Level Filter Dropdown */}
          <div className="w-36">
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="current">Level {selectedLevel} (Selected)</SelectItem>
                {Array.from(
                  { length: skillDetail.maxLevel - skillDetail.minLevel + 1 },
                  (_, i) => skillDetail.minLevel + i
                ).map((lvl) => (
                  <SelectItem key={lvl} value={String(lvl)}>
                    Level {lvl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Filter Dropdown */}
          <div className="w-32">
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Difficulties</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interview Type Filter Dropdown */}
          <div className="w-36">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-7 text-xs bg-background">
                <SelectValue placeholder="Question Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="TECHNICAL">Technical (Tech)</SelectItem>
                <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
                <SelectItem value="SITUATIONAL">Situational</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setFilterLevel('all')
                setFilterDifficulty('ALL')
                setFilterType('ALL')
              }}
              className="text-xs text-ink-muted hover:text-ink font-medium px-2 py-1 rounded hover:bg-surface-raised transition-colors ml-auto"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Question Cards List */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-card border border-border/80 rounded-xl p-8 text-center space-y-3">
          <HelpCircle className="size-8 text-ink-muted mx-auto opacity-50" />
          <div className="space-y-1 max-w-sm mx-auto">
            <h5 className="text-sm font-bold text-ink">
              {items.length === 0
                ? 'No interview questions yet'
                : 'No questions match your filters'}
            </h5>
            <p className="text-xs text-ink-muted leading-relaxed">
              {items.length === 0
                ? `Skill ${skillDetail.code} currently has no sample questions mapped in the question bank.`
                : 'Try searching with different keywords or adjust the difficulty/level filters.'}
            </p>
          </div>
          {items.length === 0 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="gap-1.5 h-8 text-xs mt-2"
            >
              <Plus className="size-3.5" />
              <span>Create First Question</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setFilterLevel('all')
                setFilterDifficulty('ALL')
                setFilterType('ALL')
              }}
              className="h-8 text-xs mt-1"
            >
              Reset all filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-ink-muted px-1">
            <span>
              Showing <strong className="text-ink">{filteredQuestions.length}</strong> / {items.length} questions
            </span>
          </div>

          {filteredQuestions.map((q) => {
            const isCopied = copiedId === q.id
            const isNewlyCreated = newlyCreatedId === q.id

            return (
              <div
                key={q.id}
                className={cn(
                  'rounded-xl border p-4 space-y-3 transition-all shadow-xs',
                  isNewlyCreated
                    ? 'bg-brand/5 border-brand ring-2 ring-brand/20 animate-in fade-in-50 duration-500'
                    : 'bg-card border-border/80 hover:border-border'
                )}
              >
                {/* Header: ID + Badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Question ID */}
                    <span className="font-mono text-xs font-semibold text-ink-muted bg-surface-inset px-2 py-0.5 rounded border border-border/50">
                      {q.id}
                    </span>

                    {/* Interview Type Badge */}
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        QUESTION_TYPE_BADGES[q.type]
                      )}
                    >
                      {TYPE_LABELS[q.type] || q.type}
                    </span>

                    {/* Difficulty Badge */}
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        QUESTION_DIFFICULTY_BADGES[q.difficulty]
                      )}
                    >
                      {DIFFICULTY_LABELS[q.difficulty] || q.difficulty}
                    </span>

                    {/* Target Level Badge (Clickable to sync stepper) */}
                    <button
                      type="button"
                      onClick={() => onSelectLevel?.(q.targetSfiaLevel)}
                      title={`Click to set Stepper to Level ${q.targetSfiaLevel}`}
                      aria-label={`Click to set Stepper to Level ${q.targetSfiaLevel}`}
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border transition-transform select-none',
                        q.targetSfiaLevel === selectedLevel
                          ? 'bg-brand/10 border-brand text-brand ring-1 ring-brand/20 font-bold'
                          : 'bg-surface-raised border-border text-ink hover:scale-105'
                      )}
                    >
                      <span>Target: L{q.targetSfiaLevel}</span>
                      {q.targetSfiaLevel === selectedLevel && (
                        <CheckCircle2 className="size-3 text-brand" />
                      )}
                    </button>
                  </div>

                  {/* Copy Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyQuestion(q)}
                    className="h-7 px-2 text-xs gap-1.5 shrink-0"
                    title="Copy this question"
                  >
                    {isCopied ? (
                      <>
                        <Check className="size-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 text-ink-muted" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Body: Question Text */}
                <p className="text-xs sm:text-sm text-ink leading-relaxed font-medium break-words whitespace-pre-wrap">
                  {q.questionText}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. Modal Dialog Tạo Câu Hỏi Mới */}
      <SfiaCreateQuestionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        skillCode={skillDetail.code}
        skillName={skillDetail.name}
        minLevel={skillDetail.minLevel}
        maxLevel={skillDetail.maxLevel}
        defaultLevel={selectedLevel}
        onQuestionCreated={handleQuestionCreatedInternal}
      />
    </div>
  )
}
