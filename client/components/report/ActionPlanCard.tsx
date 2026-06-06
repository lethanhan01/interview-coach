export default function ActionPlanCard({ actionPlan }: { actionPlan: Record<string, unknown> }) {
  const entries = Object.entries(actionPlan)

  if (!entries.length) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Kế hoạch cải thiện
      </h3>
      <div className="flex flex-col gap-4">
        {entries.map(([key, value]) => (
          <div key={key}>
            <p className="mb-1 text-sm font-medium capitalize text-gray-800">
              {key.replace(/_/g, ' ')}
            </p>
            {Array.isArray(value) ? (
              <ul className="flex flex-col gap-1 pl-4">
                {(value as unknown[]).map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    {String(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">{String(value)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
