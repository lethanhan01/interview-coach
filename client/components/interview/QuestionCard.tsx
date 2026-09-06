import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export interface QuestionCardProps {
  questionText: string
  orderIndex: number
  totalQuestions: number
  skillCode?: string
  skillName?: string
  /**
   * Context công nghệ O*NET. Lưu ý: Được giữ trong props để tương thích contract,
   * nhưng ẩn hoàn toàn trên giao diện phòng thi trực tiếp để tối ưu độ tập trung của ứng viên và bảo mật đề thi.
   */
  techContext?: string[]
  className?: string
}

function getSkillLabel(skillName?: string, skillCode?: string): string | null {
  const trimmedName = skillName?.trim()
  const trimmedCode = skillCode?.trim()

  if (trimmedName && trimmedCode) {
    return `${trimmedName} (${trimmedCode})`
  }
  return trimmedName || trimmedCode || null
}

export default function QuestionCard({
  questionText,
  orderIndex,
  totalQuestions,
  skillCode,
  skillName,
  className,
}: QuestionCardProps) {
  const skillLabel = getSkillLabel(skillName, skillCode)

  return (
    <div
      className={cn(
        'border-brand-subtle-border bg-brand-subtle shadow-card rounded-2xl border p-5',
        className
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
        <p className="text-brand-subtle-fg text-xs font-medium uppercase tracking-wide">
          Câu {orderIndex + 1} / {totalQuestions}
        </p>
        {skillLabel && (
          <Badge variant="brand" className="gap-1.5 font-normal">
            <Sparkles className="size-3" aria-hidden="true" />
            <span>{skillLabel}</span>
          </Badge>
        )}
      </div>
      <p className="text-ink text-base leading-relaxed">{questionText}</p>
    </div>
  )
}
