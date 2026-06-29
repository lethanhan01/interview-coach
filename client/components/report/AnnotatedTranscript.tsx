import { TranscriptItem, AnnotatedSegment, type SessionType } from "@/lib/types";
import { getRubricHint } from "@/lib/rubric-config";

function isStrengthSegment(segment: AnnotatedSegment) {
  const level = segment.highlightLevel.toLowerCase();
  return level === "strength" || level === "good";
}

function getSegmentQuote(answerText: string, segment: AnnotatedSegment) {
  const explicitQuote = segment.segmentText?.trim();
  if (explicitQuote) return explicitQuote;

  const hasValidRange =
    Number.isInteger(segment.startIndex) &&
    Number.isInteger(segment.endIndex) &&
    segment.startIndex >= 0 &&
    segment.endIndex > segment.startIndex &&
    segment.endIndex <= answerText.length;

  return hasValidRange
    ? answerText.slice(segment.startIndex, segment.endIndex).trim()
    : "";
}

function FeedbackSection({
  title,
  segments,
  answerText,
}: {
  title: string;
  segments: AnnotatedSegment[];
  answerText: string;
}) {
  if (segments.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <ul className="flex flex-col gap-3">
        {segments.map((seg) => {
          const quote = getSegmentQuote(answerText, seg);

          return (
            <li
              key={seg.id}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
            >
              {quote && (
                <blockquote className="mb-2 border-l-2 border-gray-300 pl-3 text-gray-900">
                  <span className="font-medium">Trích dẫn: </span>
                  <q>{quote}</q>
                </blockquote>
              )}
              <p className="text-gray-700">
                <span className="font-medium text-gray-900">Nhận xét: </span>
                {seg.annotation}
              </p>
              {seg.suggestion && (
                <p className="mt-1.5 text-gray-600">
                  <span className="font-medium text-gray-900">Gợi ý: </span>
                  {seg.suggestion}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface AnnotatedTranscriptProps {
  items: TranscriptItem[];
  contextPackId?: "VN" | "Western";
  sessionType?: SessionType;
}

export default function AnnotatedTranscript({
  items,
  contextPackId,
  sessionType,
}: AnnotatedTranscriptProps) {
  return (
    <div className="flex flex-col gap-8">
      {items.map((item) => {
        const strengthSegments = item.segments.filter(isStrengthSegment);
        const improvementSegments = item.segments.filter(
          (segment) => !isStrengthSegment(segment),
        );

        return (
          <div
            key={item.orderIndex}
            className="rounded-lg border border-gray-200 bg-white p-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Câu {item.orderIndex}
              </p>
              <span className="text-xs font-semibold text-brand">
                {item.skipped
                  ? "Đã bỏ qua"
                  : item.overallScore == null
                  ? "Chưa thể chấm"
                  : `${item.overallScore.toFixed(1)} / 100`}
              </span>
            </div>

            {item.appliedDimensions && item.appliedDimensions.length > 0 ? (
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-medium text-gray-400">Tiêu chí áp dụng</p>
                <div className="flex flex-col gap-1.5">
                  {item.appliedDimensions.map((dim) => (
                    <div key={dim.id} className="flex items-center gap-3">
                      <div className="w-44 shrink-0 truncate text-xs text-gray-600">{dim.name}</div>
                      <div className="flex-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${Math.min(100, Math.max(0, dim.score))}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-28 text-right text-xs text-gray-500">
                        {dim.score}/100 ({Math.round(dim.weight * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              contextPackId && sessionType && (
                <p className="mb-3 text-xs text-gray-400">
                  Tiêu chí đánh giá: {getRubricHint(contextPackId, sessionType)}
                </p>
              )
            )}

            <p className="mb-4 font-medium text-gray-900">
              {item.questionText}
            </p>

            {item.skipped ? (
              <div className="mb-4 rounded border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-800">
                Đã bỏ qua câu hỏi này
              </div>
            ) : (
              <div className="mb-4 rounded bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
                {item.answerText}
              </div>
            )}

            {!item.skipped && item.keyTakeaway && (
              <div className="mb-4 rounded-lg border-l-2 border-brand bg-brand-50 px-4 py-2.5 text-sm text-ink">
                <span className="font-medium">Điểm chú ý: </span>
                {item.keyTakeaway}
              </div>
            )}

            {!item.skipped && item.segments.length > 0 && (
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
        );
      })}
    </div>
  );
}
