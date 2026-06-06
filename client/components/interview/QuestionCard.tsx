interface QuestionCardProps {
  questionText: string
  orderIndex: number
  totalQuestions: number
}

export default function QuestionCard({ questionText, orderIndex, totalQuestions }: QuestionCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
        Câu {orderIndex + 1} / {totalQuestions}
      </p>
      <p className="text-base leading-relaxed text-gray-900">{questionText}</p>
    </div>
  )
}
