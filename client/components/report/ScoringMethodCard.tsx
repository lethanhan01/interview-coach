interface RubricDimension {
  name: string
  nameVi: string
  weightPct: number
}

const RUBRIC_CONFIG: Record<'VN' | 'Western', { dimensions: RubricDimension[] }> = {
  VN: {
    dimensions: [
      { name: 'clarity', nameVi: 'Rõ ràng', weightPct: 25 },
      { name: 'structure', nameVi: 'Cấu trúc', weightPct: 25 },
      { name: 'communication', nameVi: 'Giao tiếp', weightPct: 25 },
      { name: 'culture_fit', nameVi: 'Phù hợp văn hóa', weightPct: 25 },
    ],
  },
  Western: {
    dimensions: [
      { name: 'clarity', nameVi: 'Rõ ràng', weightPct: 20 },
      { name: 'structure', nameVi: 'Cấu trúc', weightPct: 20 },
      { name: 'communication', nameVi: 'Giao tiếp', weightPct: 20 },
      { name: 'impact', nameVi: 'Tác động', weightPct: 20 },
      { name: 'leadership', nameVi: 'Lãnh đạo', weightPct: 20 },
    ],
  },
}

interface ScoringMethodCardProps {
  contextPackId: 'VN' | 'Western'
}

export default function ScoringMethodCard({ contextPackId }: ScoringMethodCardProps) {
  const { dimensions } = RUBRIC_CONFIG[contextPackId]

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Phương pháp chấm điểm</h2>

      <p className="mb-4 text-sm text-gray-600">
        Điểm tổng = trung bình cộng điểm từng câu trả lời. Mỗi câu được chấm trên thang 1–100 bởi
        AI dựa trên các tiêu chí dưới đây:
      </p>

      <div className="flex flex-col gap-2">
        {dimensions.map((dim) => (
          <div key={dim.name} className="flex items-center gap-3">
            <div className="w-40 shrink-0 text-sm text-gray-700">
              {dim.nameVi}
              <span className="ml-1 text-xs text-gray-400">({dim.name})</span>
            </div>
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${dim.weightPct}%` }}
                />
              </div>
            </div>
            <span className="w-10 text-right text-xs font-medium text-gray-500">
              {dim.weightPct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
