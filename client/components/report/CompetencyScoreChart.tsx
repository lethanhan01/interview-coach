const COMPETENCY_LABELS: Record<string, string> = {
  D1: 'Giao tiếp & Trình bày',
  D2: 'Tư duy & Giải quyết vấn đề',
  D3: 'Làm việc nhóm',
  D4: 'Thái độ & Động lực',
  D5: 'Phù hợp văn hóa',
  D6: 'Tự nhận thức',
  TD1: 'Kiến thức nền tảng',
  TD2: 'Khả năng áp dụng thực tế',
  TD3: 'Tư duy hệ thống',
  TD4: 'Code quality & Best practices',
  TD5: 'Debug & Problem-solving',
}

function getCompetencyLabel(dimension: string) {
  return COMPETENCY_LABELS[dimension] ?? dimension.replace(/_/g, ' ')
}

export default function CompetencyScoreChart({
  scores,
}: {
  scores?: Record<string, unknown> | null
}) {
  const entries = Object.entries(scores ?? {}).filter(([, v]) => typeof v === 'number')

  if (!entries.length) return null

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h2 className="mb-4 text-base font-semibold text-ink">
        Năng lực
      </h2>
      <div className="flex flex-col gap-2">
        {entries.map(([dimension, score]) => {
          const pct = Math.min(100, Math.max(0, score as number))
          const label = getCompetencyLabel(dimension)
          const formattedScore = (score as number).toFixed(1)
          return (
            <div key={dimension}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">{label}</span>
                <span className="shrink-0 font-semibold text-brand">{formattedScore}/100</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
                <div
                  role="progressbar"
                  aria-valuenow={score as number}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${label}: ${formattedScore}/100`}
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
