interface QuestionCardProps {
  questionText: string
  orderIndex: number
  totalQuestions: number
}

export default function QuestionCard({ questionText, orderIndex, totalQuestions }: QuestionCardProps) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 shadow-card">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-brand">
        Câu {orderIndex + 1} / {totalQuestions}
      </p>
      <p className="text-base leading-relaxed text-ink">{questionText}</p>
    </div>
  )
}
