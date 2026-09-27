'use client'

import * as React from 'react'
import {
  HelpCircle,
  Sparkles,
  AlertCircle,
  Plus,
  Loader2,
} from 'lucide-react'
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
import { sfiaAdminService } from '@/services/sfia-admin.service'
import type { SfiaQuestionBankItem } from './types'

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
  { value: 'TECHNICAL', label: 'Kỹ thuật (Technical)' },
  { value: 'BEHAVIORAL', label: 'Hành vi (Behavioral)' },
  { value: 'SITUATIONAL', label: 'Tình huống (Situational)' },
  { value: 'HR', label: 'Nhân sự & Văn hóa (HR)' },
] as const

const DIFFICULTY_LEVELS = [
  { value: 'EASY', label: 'Dễ (Easy)' },
  { value: 'MEDIUM', label: 'Trung bình (Medium)' },
  { value: 'HARD', label: 'Khó (Hard)' },
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
  const [level, setLevel] = React.useState<number>(defaultLevel)
  const [type, setType] = React.useState<'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' | 'HR'>('TECHNICAL')
  const [difficulty, setDifficulty] = React.useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM')
  const [questionText, setQuestionText] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset form when modal opens or defaultLevel changes
  React.useEffect(() => {
    if (open) {
      setLevel(Math.max(minLevel, Math.min(maxLevel, defaultLevel)))
      setQuestionText('')
      setError(null)
      setIsSubmitting(false)
    }
  }, [open, defaultLevel, minLevel, maxLevel])

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
      setError('Nội dung câu hỏi phỏng vấn phải có tối thiểu 15 ký tự.')
      return
    }

    if (trimmed.length > 500) {
      setError('Nội dung câu hỏi không được vượt quá 500 ký tự.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const created = await sfiaAdminService.addMockQuestion(skillCode, {
        questionText: trimmed,
        type,
        difficulty,
        targetSfiaLevel: level,
      })

      toast.success('Đã thêm câu hỏi phỏng vấn mới thành công!')
      onQuestionCreated(created)
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể thêm câu hỏi. Vui lòng thử lại.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <Plus className="size-4" />
            </div>
            <DialogTitle className="text-base sm:text-lg">
              Tạo câu hỏi phỏng vấn mới
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ink-muted">
            Thêm câu hỏi mới vào ngân hàng câu hỏi gắn nhãn kỹ năng{' '}
            <strong className="text-ink font-mono font-semibold">{skillCode}</strong> ({skillName}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Identity info row */}
          <div className="p-3 bg-surface-inset rounded-lg border border-border/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-ink-muted block text-[11px]">Kỹ năng SFIA 9:</span>
              <span className="font-semibold text-ink font-mono">{skillCode}</span>
              <span className="text-ink-muted ml-1.5">— {skillName}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-surface-raised border border-border text-[10px] font-mono font-semibold text-ink">
              L{minLevel} ➔ L{maxLevel}
            </span>
          </div>

          {/* Grid fields: Target Level & Interview Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Field: Target Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink block">
                Cấp độ SFIA mục tiêu <span className="text-rose-500">*</span>
              </label>
              <Select
                value={String(level)}
                onValueChange={(val) => setLevel(Number(val))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn cấp độ" />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.map((lvl) => (
                    <SelectItem key={lvl} value={String(lvl)}>
                      Level {lvl} {lvl === defaultLevel ? '(Đang chọn)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field: Interview Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink block">
                Loại phỏng vấn <span className="text-rose-500">*</span>
              </label>
              <Select
                value={type}
                onValueChange={(val) => setType(val as typeof type)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn loại phỏng vấn" />
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
            <label className="text-xs font-semibold text-ink block">
              Độ khó câu hỏi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_LEVELS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={cn(
                    'py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all select-none',
                    difficulty === d.value
                      ? d.value === 'EASY'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                        : d.value === 'MEDIUM'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                          : 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold shadow-xs'
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
              <label className="text-xs font-semibold text-ink">
                Nội dung câu hỏi phỏng vấn <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-ink-muted tabular-nums">
                {questionText.length}/500
              </span>
            </div>
            <Textarea
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Nhập nội dung câu hỏi phỏng vấn tình huống, kỹ thuật hoặc hành vi chi tiết..."
              rows={4}
              maxLength={500}
              className="text-xs resize-none bg-surface-inset"
            />
          </div>

          {/* Inline error display */}
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
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
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  <span>Lưu câu hỏi</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
