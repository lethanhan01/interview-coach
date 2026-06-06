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
    parts.push(
      <mark
        key={seg.id}
        title={seg.annotation}
        className={`rounded px-0.5 ${isStrength ? 'bg-green-100 text-green-900' : 'bg-orange-100 text-orange-900'}`}
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
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            Câu {item.orderIndex + 1}
          </p>
          <p className="mb-4 font-medium text-gray-900">{item.questionText}</p>
          <div className="mb-3 rounded bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
            {renderHighlightedText(item.answerText, item.segments)}
          </div>
          {item.segments.length > 0 && (
            <ul className="flex flex-col gap-2">
              {item.segments.map((seg) => (
                <li key={seg.id} className="flex gap-2 text-sm">
                  <span
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${seg.highlightLevel === 'strength' ? 'bg-green-500' : 'bg-orange-400'}`}
                  />
                  <span className="text-gray-700">{seg.annotation}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
