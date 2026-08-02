import type { ContextPack, RubricConfig, SessionType } from '@/lib/types'
import { getRubricCategories } from '@/lib/rubric-config'
import type { RubricCategory } from '@/lib/types'

interface ScoringMethodCardProps {
  contextPackId: ContextPack
  sessionType: SessionType
  rubricConfig?: RubricConfig | null
}

const SLICE_COLORS = [
  'var(--color-brand)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
  'var(--color-info)',
  'var(--color-ink-muted)',
]

function buildDonutGradient(category: RubricCategory) {
  let current = 0

  return category.dimensions
    .map((dim, index) => {
      const start = current
      current += dim.weightPct
      return `${SLICE_COLORS[index % SLICE_COLORS.length]} ${start}% ${current}%`
    })
    .join(', ')
}

function sessionTypeLabel(sessionType: SessionType) {
  if (sessionType === 'hr') return 'phỏng vấn hành vi'
  if (sessionType === 'technical') return 'phỏng vấn kỹ thuật'
  return 'phỏng vấn tổng hợp'
}

function CategorySection({ category }: { category: RubricCategory }) {
  const donutGradient = buildDonutGradient(category)

  return (
    <section className="border-border bg-surface-raised rounded-lg border p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-ink text-sm font-semibold">{category.label}</h3>
          <p className="text-ink-muted mt-1 text-xs leading-relaxed">
            Tỷ trọng bên dưới là tỷ trọng gốc trong nhóm tiêu chí này.
          </p>
        </div>
        <span className="bg-brand-subtle text-brand-subtle-fg rounded-full px-2.5 py-0.5 text-xs font-medium">
          {category.categoryWeightPct}% điểm phiên
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-[160px_1fr] md:items-center">
        <div className="bg-brand-subtle mx-auto flex size-36 items-center justify-center rounded-full p-3">
          <div
            aria-label={`${category.label}: ${category.dimensions
              .map((dim) => `${dim.nameVi} ${dim.weightPct}%`)
              .join(', ')}`}
            className="flex size-full items-center justify-center rounded-full"
            role="img"
            style={{ background: `conic-gradient(${donutGradient})` }}
          >
            <div className="bg-surface shadow-card flex size-20 flex-col items-center justify-center rounded-full text-center">
              <span className="text-ink text-lg font-semibold">
                {category.categoryWeightPct}%
              </span>
              <span className="text-ink-muted text-[11px] font-medium">
                điểm phiên
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {category.dimensions.map((dim, index) => (
            <div key={dim.code} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-1 size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length],
                }}
              />
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-ink-faint text-xs font-medium">
                    {dim.code}
                  </span>
                  <span className="text-ink text-sm font-medium">
                    {dim.nameVi}
                  </span>
                </div>
                <p className="text-ink-muted mt-0.5 text-xs">
                  {dim.weightPct}% trong nhóm tiêu chí
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function ScoringMethodCard({
  contextPackId,
  sessionType,
  rubricConfig,
}: ScoringMethodCardProps) {
  const categories =
    rubricConfig?.categories ?? getRubricCategories(contextPackId, sessionType)
  const isMixed = sessionType === 'mixed'
  const label = sessionTypeLabel(sessionType)

  return (
    <div className="border-border bg-surface rounded-lg border p-6">
      <h2 className="text-ink text-base font-semibold">
        Phương pháp chấm điểm
      </h2>

      <div className="border-brand-subtle-border bg-brand-subtle mt-4 rounded-lg border p-4">
        <p className="text-ink text-sm leading-relaxed">
          Báo cáo này dùng thang điểm 1-100 cho từng câu trả lời. Với mỗi câu,
          hệ thống chỉ chọn những tiêu chí thật sự liên quan đến nội dung câu
          hỏi, chấm điểm từng tiêu chí, rồi tính điểm câu bằng trung bình có
          trọng số của các tiêu chí đã được chọn.
        </p>
      </div>

      {isMixed && (
        <p className="bg-surface-raised text-ink mt-4 rounded-lg px-4 py-2.5 text-sm leading-relaxed">
          <span className="font-medium">Lưu ý:</span> Phiên tổng hợp có cả tiêu
          chí hành vi và kỹ thuật. Mỗi câu vẫn được chấm theo đúng nhóm tiêu chí
          phù hợp với câu đó; điểm tổng phiên là trung bình cộng các câu đã chấm
          được.
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="border-border bg-surface-raised rounded-lg border p-3">
          <p className="text-ink-faint text-xs font-medium uppercase tracking-wide">
            Bước 1
          </p>
          <p className="text-ink mt-1 text-sm font-medium">
            Chọn tiêu chí phù hợp
          </p>
          <p className="text-ink-muted mt-1 text-xs leading-relaxed">
            Không phải câu nào cũng dùng toàn bộ rubric; chỉ tiêu chí có bằng
            chứng trong câu trả lời mới được tính.
          </p>
        </div>
        <div className="border-border bg-surface-raised rounded-lg border p-3">
          <p className="text-ink-faint text-xs font-medium uppercase tracking-wide">
            Bước 2
          </p>
          <p className="text-ink mt-1 text-sm font-medium">
            Chuẩn hóa trọng số
          </p>
          <p className="text-ink-muted mt-1 text-xs leading-relaxed">
            Nếu một câu chỉ dùng vài tiêu chí, trọng số của các tiêu chí đó được
            quy đổi lại để tổng bằng 100%.
          </p>
        </div>
        <div className="border-border bg-surface-raised rounded-lg border p-3">
          <p className="text-ink-faint text-xs font-medium uppercase tracking-wide">
            Bước 3
          </p>
          <p className="text-ink mt-1 text-sm font-medium">Tính điểm tổng</p>
          <p className="text-ink-muted mt-1 text-xs leading-relaxed">
            Điểm câu = tổng điểm tiêu chí nhân trọng số đã chuẩn hóa. Điểm phiên{' '}
            {label} = trung bình cộng các câu trả lời đã chấm được.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {categories.map((cat) => (
          <CategorySection key={cat.label} category={cat} />
        ))}
      </div>
    </div>
  )
}
