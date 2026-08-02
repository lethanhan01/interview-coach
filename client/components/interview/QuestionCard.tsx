interface QuestionCardProps {
  questionText: string
  orderIndex: number
  totalQuestions: number
}

export default function QuestionCard({
  questionText,
  orderIndex,
  totalQuestions,
}: QuestionCardProps) {
  return (
    <div className="border-brand-subtle-border bg-brand-subtle shadow-card rounded-2xl border p-5">
      <p className="text-brand-subtle-fg mb-3 text-xs font-medium uppercase tracking-wide">
        Câu {orderIndex + 1} / {totalQuestions}
      </p>
      <p className="text-ink text-base leading-relaxed">{questionText}</p>
    </div>
  )
}
