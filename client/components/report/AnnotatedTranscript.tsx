import React from 'react'
import {
  TranscriptItem,
  AnnotatedSegment,
  type SessionType,
} from '@/lib/types'
import { getRubricHint } from '@/lib/rubric-config'
import { Badge } from '@/components/ui/Badge'
import { BinaryCriteriaChecklist } from '@/components/report/BinaryCriteriaChecklist'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

function isStrengthSegment(segment: AnnotatedSegment) {
  const level = segment.highlightLevel.toLowerCase()
  return level === 'strength' || level === 'good'
}

function getSegmentQuote(answerText: string, segment: AnnotatedSegment) {
  const explicitQuote = segment.segmentText?.trim()
  if (explicitQuote && answerText.includes(explicitQuote)) {
    return explicitQuote
  }

  const hasValidRange =
    Number.isInteger(segment.startIndex) &&
    Number.isInteger(segment.endIndex) &&
    segment.startIndex >= 0 &&
    segment.endIndex > segment.startIndex &&
    segment.endIndex <= answerText.length

  return hasValidRange
    ? answerText.slice(segment.startIndex, segment.endIndex).trim()
    : ''
}

function FeedbackSection({
  title,
  segments,
  answerText,
}: {
  title: string
  segments: AnnotatedSegment[]
  answerText: string
}) {
  if (segments.length === 0) return null

  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      <ul className="flex flex-col gap-3">
        {segments.map((seg) => {
          const quote = getSegmentQuote(answerText, seg)

          return (
            <li
              key={seg.id}
              className="border-border bg-surface-raised rounded-lg border px-4 py-3 text-sm"
            >
              {quote && (
                <blockquote className="border-border text-foreground mb-2 border-l-2 pl-3">
                  <span className="font-medium">Trích dẫn: </span>
                  <q>{quote}</q>
                </blockquote>
              )}
              <p className="text-ink-muted">
                <span className="text-foreground font-medium">Nhận xét: </span>
                {seg.annotation}
              </p>
              {seg.suggestion && (
                <p className="text-muted-foreground mt-1.5">
                  <span className="text-foreground font-medium">Gợi ý: </span>
                  {seg.suggestion}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export interface AnnotatedTranscriptProps {
  items: TranscriptItem[]
  contextPackId?: 'VN' | 'Western'
  sessionType?: SessionType
  className?: string
}

export default function AnnotatedTranscript({
  items = [],
  contextPackId,
  sessionType,
  className,
}: AnnotatedTranscriptProps) {
  return (
    <div className={cn('flex flex-col gap-8', className)}>
      {items.map((item) => {
        const strengthSegments = (item.segments ?? []).filter(isStrengthSegment)
        const improvementSegments = (item.segments ?? []).filter(
          (segment) => !isStrengthSegment(segment)
        )

        return (
          <div
            key={item.orderIndex}
            className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Câu {item.orderIndex}
                </p>
                {item.demonstratedLevel != null && (
                  <Badge variant="outline" className="tabular-nums text-xs">
                    SFIA Level {item.demonstratedLevel}
                  </Badge>
                )}
                {item.criteriaPassRate != null && (
                  <Badge
                    variant={item.criteriaPassRate >= 0.7 ? 'success' : 'warning'}
                    className="tabular-nums text-xs"
                  >
                    Đạt {Math.round(item.criteriaPassRate * 100)}% tiêu chí
                  </Badge>
                )}
              </div>

              <span className="text-brand tabular-nums text-xs font-semibold">
                {item.overallScore == null
                  ? 'Chưa thể chấm'
                  : `${item.overallScore.toFixed(1)} / 100`}
              </span>
            </div>

            <p className="text-foreground mb-4 font-medium">
              {item.questionText}
            </p>

            {item.skipped ? (
              <div className="border-warning/30 bg-warning-subtle text-warning-subtle-fg mb-4 flex items-start gap-3 rounded-xl border p-4 text-sm">
                <AlertTriangle className="text-warning mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Câu hỏi này đã bị bỏ qua</p>
                  <p className="mt-0.5 text-xs opacity-90">
                    Ứng viên nhận 0 điểm và được đánh giá ở SFIA Level 1 theo quy chuẩn chấm điểm tất định.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-surface-raised text-foreground mb-4 rounded-lg p-4 text-sm leading-relaxed">
                {item.answerText}
              </div>
            )}

            {!item.skipped && item.keyTakeaway && (
              <div className="border-brand bg-brand-subtle text-ink mb-4 rounded-lg border-l-2 px-4 py-2.5 text-sm">
                <span className="font-medium">Điểm chú ý: </span>
                {item.keyTakeaway}
              </div>
            )}

            {!item.skipped && item.criteriaEvaluations && item.criteriaEvaluations.length > 0 && (
              <div className="mb-4">
                <p className="text-ink-muted mb-2 text-xs font-medium uppercase tracking-wide">
                  Tiêu chí thẩm định chuẩn hóa
                </p>
                <BinaryCriteriaChecklist criteria={item.criteriaEvaluations} />
              </div>
            )}

            {!item.skipped && (!item.criteriaEvaluations || item.criteriaEvaluations.length === 0) && (
              <>
                {item.appliedDimensions && item.appliedDimensions.length > 0 ? (
                  <div className="mb-3">
                    <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                      Tiêu chí áp dụng
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {item.appliedDimensions.map((dim) => (
                        <div key={dim.id} className="flex items-center gap-3">
                          <div className="text-ink-muted w-44 shrink-0 truncate text-xs">
                            {dim.name}
                          </div>
                          <div className="flex-1">
                            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                              <div
                                className="bg-brand h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.max(0, dim.score))}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-muted-foreground w-28 text-right text-xs tabular-nums">
                            {dim.score}/100 ({Math.round(dim.weight * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  contextPackId && sessionType && (
                    <p className="text-muted-foreground mb-3 text-xs">
                      Tiêu chí đánh giá:{' '}
                      {getRubricHint(
                        contextPackId as 'VN' | 'Western',
                        sessionType as SessionType
                      )}
                    </p>
                  )
                )}

                {item.segments && item.segments.length > 0 && (
                  <div className="mb-4 flex flex-col gap-4">
                    <FeedbackSection
                      title="Ưu điểm trong câu trả lời"
                      segments={strengthSegments}
                      answerText={item.answerText}
                    />
                    <FeedbackSection
                      title="Điểm cần cải thiện"
                      segments={improvementSegments}
                      answerText={item.answerText}
                    />
                  </div>
                )}
              </>
            )}

            {item.modelAnswer && (
              <details className="group">
                <summary className="text-brand cursor-pointer list-none text-xs font-medium uppercase tracking-wide hover:opacity-80">
                  Xem câu trả lời đề xuất ▸
                </summary>
                <div className="bg-brand-subtle text-ink mt-2 rounded-lg p-4 text-sm leading-relaxed">
                  {item.modelAnswer}
                </div>
              </details>
            )}
          </div>
        )
      })}
    </div>
  )
}
