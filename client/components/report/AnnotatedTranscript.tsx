import { TranscriptItem, AnnotatedSegment } from '@/lib/types'

function renderHighlightedText(text: string, segments: AnnotatedSegment[]) {
  if (!segments.length) return <span>{text}</span>

  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex)
  const parts: React.ReactNode[] = []
  let cursor = 0

  for (const seg of sorted) {
    if (seg.startIndex > cursor) {
      parts.push(<span key={`plain-${cursor}`}>{text.slice(cursor, seg.startIndex)}</span>)
    }
    const isStrength = seg.highlightLevel === 'strength'
    // px-0.5 intentionally omitted — inline padding on <mark> breaks surrounding character spacing
    parts.push(
      <mark
        key={seg.id}
        title={seg.annotation}
        className={`rounded ${isStrength ? 'bg-green-100 text-green-900' : 'bg-orange-100 text-orange-900'}`}
      >
        {text.slice(seg.startIndex, seg.endIndex)}
      </mark>
    )
    cursor = seg.endIndex
  }

  if (cursor < text.length) {
    parts.push(<span key="plain-end">{text.slice(cursor)}</span>)
  }

  return <>{parts}</>
}

export default function AnnotatedTranscript({ items }: { items: TranscriptItem[] }) {
  return (
    <div className="flex flex-col gap-8">
      {items.map((item) => (
        <div key={item.orderIndex} className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Câu {item.orderIndex + 1}
            </p>
            <span className="text-xs font-semibold text-brand">
              {item.overallScore.toFixed(1)} / 10
            </span>
          </div>

          <p className="mb-4 font-medium text-gray-900">{item.questionText}</p>

          <div className="mb-3 rounded bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
            {renderHighlightedText(item.answerText, item.segments)}
          </div>

          {item.keyTakeaway && (
            <div className="mb-4 rounded-lg border-l-2 border-brand bg-brand-50 px-4 py-2.5 text-sm text-ink">
              <span className="font-medium">Điểm chú ý: </span>
              {item.keyTakeaway}
            </div>
          )}

          {item.segments.length > 0 && (
            <ul className="mb-4 flex flex-col gap-3">
              {item.segments.map((seg) => (
                <li key={seg.id} className="flex gap-2 text-sm">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      seg.highlightLevel === 'strength' ? 'bg-green-500' : 'bg-orange-400'
                    }`}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-700">{seg.annotation}</span>
                    {seg.suggestion && (
                      <span className="text-xs text-gray-400">Gợi ý: {seg.suggestion}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {item.modelAnswer && (
            <details className="group">
              <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-wide text-brand hover:opacity-80">
                Xem câu trả lời đề xuất ▸
              </summary>
              <div className="mt-2 rounded bg-brand-50 p-4 text-sm leading-relaxed text-ink">
                {item.modelAnswer}
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  )
}
