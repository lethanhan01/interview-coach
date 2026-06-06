export default function CompetencyScoreChart({ scores }: { scores: Record<string, unknown> }) {
  const entries = Object.entries(scores).filter(([, v]) => typeof v === 'number')

  if (!entries.length) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Năng lực
      </h3>
      <div className="flex flex-col gap-3">
        {entries.map(([dimension, score]) => {
          const pct = Math.min(100, Math.max(0, ((score as number) / 10) * 100))
          return (
            <div key={dimension}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="capitalize text-gray-700">{dimension.replace(/_/g, ' ')}</span>
                <span className="font-medium text-gray-900">{(score as number).toFixed(1)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  role="progressbar"
                  aria-valuenow={score as number}
                  aria-valuemin={0}
                  aria-valuemax={10}
                  aria-label={`${dimension.replace(/_/g, ' ')}: ${(score as number).toFixed(1)}/10`}
                  className="h-full rounded-full bg-black transition-all"
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
