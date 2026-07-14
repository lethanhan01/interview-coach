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
    <section className="rounded-lg border border-border bg-surface-raised p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">{category.label}</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Tỷ trọng bên dưới là tỷ trọng gốc trong nhóm tiêu chí này.
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand">
          {category.categoryWeightPct}% điểm phiên
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-[160px_1fr] md:items-center">
        <div className="mx-auto flex size-36 items-center justify-center rounded-full bg-brand-100 p-3">
          <div
            aria-label={`${category.label}: ${category.dimensions
              .map((dim) => `${dim.nameVi} ${dim.weightPct}%`)
              .join(', ')}`}
            className="flex size-full items-center justify-center rounded-full"
            role="img"
            style={{ background: `conic-gradient(${donutGradient})` }}
          >
            <div className="flex size-20 flex-col items-center justify-center rounded-full bg-surface text-center shadow-card">
              <span className="text-lg font-semibold text-ink">
                {category.categoryWeightPct}%
              </span>
              <span className="text-[11px] font-medium text-ink-muted">
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
                style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
              />
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-ink-faint">{dim.code}</span>
                  <span className="text-sm font-medium text-ink">{dim.nameVi}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">
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
    <div className="rounded-lg border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-ink">Phương pháp chấm điểm</h2>

      <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4">
        <p className="text-sm leading-relaxed text-ink">
          Báo cáo này dùng thang điểm 1-100 cho từng câu trả lời. Với mỗi câu, hệ thống chỉ chọn
          những tiêu chí thật sự liên quan đến nội dung câu hỏi, chấm điểm từng tiêu chí, rồi tính
          điểm câu bằng trung bình có trọng số của các tiêu chí đã được chọn.
        </p>
      </div>

      {isMixed && (
        <p className="mt-4 rounded-lg bg-surface-raised px-4 py-2.5 text-sm leading-relaxed text-ink">
          <span className="font-medium">Lưu ý:</span>{' '}
          Phiên tổng hợp có cả tiêu chí hành vi và kỹ thuật. Mỗi câu vẫn được chấm theo đúng nhóm
          tiêu chí phù hợp với câu đó; điểm tổng phiên là trung bình cộng các câu đã chấm được.
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface-raised p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Bước 1</p>
          <p className="mt-1 text-sm font-medium text-ink">Chọn tiêu chí phù hợp</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Không phải câu nào cũng dùng toàn bộ rubric; chỉ tiêu chí có bằng chứng trong câu trả
            lời mới được tính.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-raised p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Bước 2</p>
          <p className="mt-1 text-sm font-medium text-ink">Chuẩn hóa trọng số</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Nếu một câu chỉ dùng vài tiêu chí, trọng số của các tiêu chí đó được quy đổi lại để
            tổng bằng 100%.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-raised p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Bước 3</p>
          <p className="mt-1 text-sm font-medium text-ink">Tính điểm tổng</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Điểm câu = tổng điểm tiêu chí nhân trọng số đã chuẩn hóa. Điểm phiên {label} = trung
            bình cộng các câu trả lời đã chấm được.
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
