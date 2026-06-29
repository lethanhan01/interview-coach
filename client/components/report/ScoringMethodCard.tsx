import type { ContextPack, SessionType } from '@/lib/types'
import { getRubricCategories } from '@/lib/rubric-config'
import type { RubricCategory } from '@/lib/rubric-config'

interface ScoringMethodCardProps {
  contextPackId: ContextPack
  sessionType: SessionType
}

function CategorySection({ category }: { category: RubricCategory }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{category.label}</h3>
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand">
          {category.categoryWeightPct}% điểm tổng
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {category.dimensions.map((dim) => (
          <div key={dim.code} className="flex items-center gap-3">
            <div className="w-52 shrink-0 text-sm text-gray-700">
              <span className="mr-1.5 text-xs font-medium text-gray-400">{dim.code}</span>
              {dim.nameVi}
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

export default function ScoringMethodCard({ contextPackId, sessionType }: ScoringMethodCardProps) {
  const categories = getRubricCategories(contextPackId, sessionType)
  const isMixed = sessionType === 'mixed'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Phương pháp chấm điểm</h2>

      <p className="mb-4 text-sm text-gray-600">
        Điểm tổng = trung bình cộng điểm từng câu trả lời. Mỗi câu chỉ chấm trên các tiêu chí phù
        hợp với câu hỏi đó; trọng số được chuẩn hóa lại theo tập tiêu chí áp dụng. Bảng dưới là
        tập tiêu chí tối đa có thể áp dụng.
      </p>

      {isMixed && (
        <p className="mb-4 rounded-lg bg-brand-50 px-4 py-2.5 text-sm text-ink">
          <span className="font-medium">Lưu ý:</span>{' '}
          Câu hành vi và câu kỹ thuật được chấm trên tập tiêu chí tương ứng; điểm tổng phiên là
          trung bình cộng toàn bộ câu.
        </p>
      )}

      <div className={`flex flex-col ${isMixed ? 'gap-6' : 'gap-2'}`}>
        {categories.map((cat) => (
          <CategorySection key={cat.label} category={cat} />
        ))}
      </div>
    </div>
  )
}
