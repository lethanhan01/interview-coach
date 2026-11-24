'use client'

import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertCircle, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import { queryKeys } from '@/queries/keys'
import { useOptionalQueryClient } from '@/providers/QueryProvider'
import { sfiaAdminService } from '@/services'
import type { CreateSfiaQuestionPayload, SfiaQuestionBankItem } from '@/types'

const STATIC_SFIA_QUERY_SCOPES = new Set([
  'categories',
  'subcategories',
  'levels',
  'attributes',
])

export interface SfiaCreateQuestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skillCode: string
  skillName: string
  minLevel: number
  maxLevel: number
  defaultLevel: number
  onQuestionCreated: (newQuestion: SfiaQuestionBankItem) => void
}

const INTERVIEW_TYPES = [
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'SITUATIONAL', label: 'Situational' },
  { value: 'HR', label: 'HR / Cultural' },
] as const

const DIFFICULTY_LEVELS = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
] as const

export function SfiaCreateQuestionModal({
  open,
  onOpenChange,
  skillCode,
  skillName,
  minLevel,
  maxLevel,
  defaultLevel,
  onQuestionCreated,
}: SfiaCreateQuestionModalProps) {
  const queryClient = useOptionalQueryClient()
  const [level, setLevel] = React.useState<number>(defaultLevel)
  const [type, setType] = React.useState<
    'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' | 'HR'
  >('TECHNICAL')
  const [difficulty, setDifficulty] = React.useState<
    'EASY' | 'MEDIUM' | 'HARD'
  >('MEDIUM')
  const [questionText, setQuestionText] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const createQuestionMutation = useMutation({
    mutationFn: (payload: CreateSfiaQuestionPayload) =>
      sfiaAdminService.createQuestion(skillCode, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sfiaAdmin.all,
        predicate: (query) => {
          const scope = query.queryKey[1]
          return (
            typeof scope !== 'string' || !STATIC_SFIA_QUERY_SCOPES.has(scope)
          )
        },
      })
    },
  })

  const isSubmitting = createQuestionMutation.isPending

  const [prevOpen, setPrevOpen] = React.useState(open)
  const [prevDefaultLevel, setPrevDefaultLevel] = React.useState(defaultLevel)

  if (open && (!prevOpen || prevDefaultLevel !== defaultLevel)) {
    setPrevOpen(open)
    setPrevDefaultLevel(defaultLevel)
    setLevel(Math.max(minLevel, Math.min(maxLevel, defaultLevel)))
    setQuestionText('')
    setError(null)
  } else if (!open && prevOpen) {
    setPrevOpen(false)
  }

  const availableLevels = React.useMemo(() => {
    const list: number[] = []
    for (let l = minLevel; l <= maxLevel; l++) {
      list.push(l)
    }
    return list
  }, [minLevel, maxLevel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = questionText.trim()
    if (trimmed.length < 15) {
      setError('Interview question content must be at least 15 characters.')
      return
    }

    if (trimmed.length > 500) {
      setError('Question content cannot exceed 500 characters.')
      return
    }

    try {
      setError(null)

      const created = await createQuestionMutation.mutateAsync({
        questionText: trimmed,
        type,
        difficulty,
        targetSfiaLevel: level,
      })

      toast.success('Interview question created and tagged successfully!')
      onQuestionCreated(created)
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create interview question. Please try again.'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <div className="bg-brand/10 text-brand flex size-8 items-center justify-center rounded-lg">
              <Plus className="size-4" />
            </div>
            <DialogTitle className="text-base sm:text-lg">
              Create Interview Question
            </DialogTitle>
          </div>
          <DialogDescription className="text-ink-muted text-xs">
            Add a new question to the bank, mapped to{' '}
            <strong className="text-ink font-mono font-semibold">
              {skillCode}
            </strong>{' '}
            ({skillName}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Identity info row */}
          <div className="bg-surface-inset border-border/60 flex items-center justify-between rounded-lg border p-3 text-xs">
            <div>
              <span className="text-ink-muted block text-[11px]">
                SFIA 9 Skill:
              </span>
              <span className="text-ink font-mono font-semibold">
                {skillCode}
              </span>
              <span className="text-ink-muted ml-1.5">— {skillName}</span>
            </div>
            <span className="bg-surface-raised border-border text-ink rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold">
              L{minLevel} ➔ L{maxLevel}
            </span>
          </div>

          {/* Grid fields: Target Level & Interview Type */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Field: Target Level */}
            <div className="space-y-1.5">
              <label className="text-ink block text-xs font-semibold">
                Target SFIA Level <span className="text-rose-500">*</span>
              </label>
              <Select
                value={String(level)}
                onValueChange={(val) => setLevel(Number(val))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.map((lvl) => (
                    <SelectItem key={lvl} value={String(lvl)}>
                      Level {lvl} {lvl === defaultLevel ? '(Selected)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field: Interview Type */}
            <div className="space-y-1.5">
              <label className="text-ink block text-xs font-semibold">
                Interview Type <span className="text-rose-500">*</span>
              </label>
              <Select
                value={type}
                onValueChange={(val) => setType(val as typeof type)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Field: Difficulty */}
          <div className="space-y-1.5">
            <label className="text-ink block text-xs font-semibold">
              Difficulty <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_LEVELS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={cn(
                    'select-none rounded-lg border px-2 py-2 text-center text-xs font-medium transition-all',
                    difficulty === d.value
                      ? d.value === 'EASY'
                        ? 'shadow-xs border-emerald-500 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300'
                        : d.value === 'MEDIUM'
                          ? 'shadow-xs border-amber-500 bg-amber-500/15 font-bold text-amber-700 dark:text-amber-300'
                          : 'shadow-xs border-rose-500 bg-rose-500/15 font-bold text-rose-700 dark:text-rose-300'
                      : 'bg-surface-inset border-border text-ink-muted hover:text-ink'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Field: Question Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-ink text-xs font-semibold">
                Question Content <span className="text-rose-500">*</span>
              </label>
              <span className="text-ink-muted font-mono text-[11px] tabular-nums">
                {questionText.length}/500
              </span>
            </div>
            <Textarea
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Enter practical technical question scenario, problem statement, or behavioral prompt..."
              rows={4}
              maxLength={500}
              className="bg-surface-inset resize-none text-xs"
            />
          </div>

          {/* Inline error display */}
          {error && (
            <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-start gap-2 rounded-lg border p-2.5 text-xs">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="border-border/60 gap-2 border-t pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  <span>Create Question</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
