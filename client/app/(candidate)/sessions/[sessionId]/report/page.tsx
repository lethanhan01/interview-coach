'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { sessionService } from '@/services'
import type {
  FeedbackProgress,
  Report,
  Session,
} from '@/lib/types'

import { Info } from 'lucide-react'
import AnnotatedTranscript from '@/components/report/AnnotatedTranscript'
import { RecommendationBadge } from '@/components/report/RecommendationBadge'
import { SfiaCompetencyOverview } from '@/components/report/SfiaCompetencyOverview'
import { SkillsBreakdownCard } from '@/components/report/SkillsBreakdownCard'
import { ActionPlanTimeline } from '@/components/report/ActionPlanTimeline'
import SessionMetadataCard from '@/components/report/SessionMetadataCard'
import { ScoringMethodCard } from '@/components/report/ScoringMethodCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const REPORT_POLL_INTERVAL_MS = 5000
const PROGRESS_POLL_INTERVAL_MS = 2000
const GOOD_ANSWER_THRESHOLD = 70
const WEAK_ANSWER_THRESHOLD = 40

type SummaryAnswerItem = {
  label: string
  score?: number
  takeaway?: string
}

type OverviewSummary = {
  overview: string
  goodAnswers: SummaryAnswerItem[]
  weakAnswers: SummaryAnswerItem[]
  improvementDirections: string[]
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  )
}

function buildOverviewSummary(report: Report): OverviewSummary {
  const overview =
    typeof report.executiveSummary?.summary === 'string' &&
    report.executiveSummary.summary.trim() !== ''
      ? report.executiveSummary.summary
      : 'Báo cáo đã được tổng hợp từ các câu trả lời có đủ dữ liệu chấm điểm.'

  const scoredAnswers = (report.transcript ?? []).flatMap((item) => {
    if (item.isFallback || item.overallScore == null) {
      return []
    }
    return [
      {
        label: `Câu ${item.orderIndex}`,
        score: item.overallScore,
        takeaway: item.keyTakeaway?.trim() || undefined,
      },
    ]
  })

  const goodAnswers = scoredAnswers.filter(
    (item) => item.score >= GOOD_ANSWER_THRESHOLD
  )
  const weakAnswers = scoredAnswers.filter(
    (item) => item.score < WEAK_ANSWER_THRESHOLD
  )
  const actionPlanItems = toStringList(report.actionPlan?.items)
  const improvementDirections =
    actionPlanItems.length > 0
      ? actionPlanItems
      : Array.from(
          new Set(
            weakAnswers.flatMap((item) =>
              item.takeaway ? [item.takeaway] : []
            )
          )
        ).slice(0, 3)

  return {
    overview,
    goodAnswers,
    weakAnswers,
    improvementDirections,
  }
}

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [report, setReport] = useState<Report | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [progress, setProgress] = useState<FeedbackProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reportLoadedRef = useRef(false)

  const applyProgress = useCallback((next: FeedbackProgress) => {
    setProgress((prev) => {
      if (!prev) return next
      const feedbackCompleted = Math.max(
        prev.feedbackCompleted,
        next.feedbackCompleted
      )
      const feedbackRequired = Math.max(
        prev.feedbackRequired,
        next.feedbackRequired
      )
      return {
        ...next,
        answeredQuestions: Math.max(
          prev.answeredQuestions,
          next.answeredQuestions
        ),
        skippedQuestions: Math.max(
          prev.skippedQuestions,
          next.skippedQuestions
        ),
        feedbackRequired,
        feedbackCompleted,
        feedbackPending: Math.max(0, feedbackRequired - feedbackCompleted),
        reportReady: prev.reportReady || next.reportReady,
      }
    })
  }, [])

  const progressPercent = useMemo(() => {
    if (!progress) return 0
    if (progress.feedbackRequired === 0) return 100
    return Math.min(
      100,
      Math.round((progress.feedbackCompleted / progress.feedbackRequired) * 100)
    )
  }, [progress])

  useEffect(() => {
    let canceled = false
    let reportTimer: ReturnType<typeof setTimeout> | undefined
    let progressTimer: ReturnType<typeof setTimeout> | undefined
    let eventSource: EventSource | undefined

    const sessionPromise = sessionService
      .getSession(sessionId)
      .then((data) => {
        if (!canceled) setSession(data)
      })
      .catch(() => {})

    async function fetchReport() {
      try {
        const data = await sessionService.getReport(sessionId)
        if (canceled) return
        await sessionPromise
        reportLoadedRef.current = true
        setReport(data)
        setLoading(false)
        setError(null)
        if (reportTimer) clearTimeout(reportTimer)
        if (progressTimer) clearTimeout(progressTimer)
      } catch (err: unknown) {
        if (canceled) return
        if (err instanceof Error && err.message.includes('REPORT_NOT_READY')) {
          reportTimer = setTimeout(fetchReport, REPORT_POLL_INTERVAL_MS)
        } else {
          setError(err instanceof Error ? err.message : 'Không thể tải báo cáo')
          setLoading(false)
        }
      }
    }

    async function fetchProgress() {
      try {
        const data = await sessionService.getFeedbackProgress(sessionId)
        if (canceled || reportLoadedRef.current) return
        applyProgress(data)
        if (data.reportReady) {
          void fetchReport()
          return
        }
      } catch {
        // Progress is best-effort; report polling/SSE still handles readiness.
      } finally {
        if (!canceled && !reportLoadedRef.current) {
          progressTimer = setTimeout(fetchProgress, PROGRESS_POLL_INTERVAL_MS)
        }
      }
    }

    async function subscribeToProgress() {
      if (canceled) return
      eventSource = sessionService.createEventSource(sessionId)
      eventSource.addEventListener('session.feedback_progress', (event) => {
        const data = JSON.parse(
          (event as MessageEvent).data
        ) as FeedbackProgress
        applyProgress(data)
        if (data.reportReady) void fetchReport()
      })
      eventSource.addEventListener('report.ready', () => {
        void fetchReport()
      })
      eventSource.onerror = () => eventSource?.close()
    }


    fetchReport()
    fetchProgress()
    void subscribeToProgress()

    return () => {
      canceled = true
      if (reportTimer) clearTimeout(reportTimer)
      if (progressTimer) clearTimeout(progressTimer)
      eventSource?.close()
      reportLoadedRef.current = false
    }
  }, [applyProgress, sessionId])

  if (loading) {
    const feedbackRequired = progress?.feedbackRequired ?? 0
    const feedbackCompleted = progress?.feedbackCompleted ?? 0
    const feedbackPending = progress?.feedbackPending ?? 0
    const progressLabel = progress
      ? `Đã chấm ${feedbackCompleted}/${feedbackRequired} câu trả lời`
      : 'Đang kiểm tra tiến trình chấm điểm...'
    const detailLabel = progress
      ? feedbackPending > 0
        ? `Còn ${feedbackPending} câu đang xử lý`
        : 'Đang tổng hợp báo cáo...'
      : 'AI đang chuẩn bị dữ liệu báo cáo.'

    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <LoadingSpinner size="lg" />
        <div className="w-full">
          <p className="text-ink text-sm font-semibold">{progressLabel}</p>
          <div className="bg-brand-100 mt-3 h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-brand h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-ink-muted mt-2 text-sm">{detailLabel}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-danger flex items-center justify-center py-20 text-sm">
        {error}
      </div>
    )
  }

  if (!report) return null

  const overviewSummary = buildOverviewSummary(report)
  const recommendationStatus =
    report.recommendationStatus ??
    report.executiveSummary?.recommendationStatus

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-foreground mb-6 text-2xl font-bold">
        Báo cáo phỏng vấn
      </h1>

      <div className="bg-brand mb-8 flex flex-col justify-between gap-6 rounded-2xl p-6 text-white shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-brand-200 text-xs font-medium uppercase tracking-wider">
            Điểm đánh giá tổng kết
          </p>
          {report.overallScore == null ? (
            <div className="mt-1">
              <p className="text-2xl font-bold">Chưa thể chấm điểm</p>
              <p className="text-brand-100 mt-1 text-xs">
                {report.reportQuality === 'not_scorable'
                  ? 'Phiên này chưa có câu trả lời nào để chấm điểm.'
                  : 'Dịch vụ AI tạm thời chưa khả dụng. Câu trả lời của bạn vẫn đã được lưu.'}
              </p>
            </div>
          ) : (
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight tabular-nums">
                {report.overallScore.toFixed(1)}
              </span>
              <span className="text-brand-200 text-xl font-medium">/ 100</span>
            </div>
          )}

          {(report.executiveSummary?.targetSfiaLevel ||
            report.executiveSummary?.demonstratedSfiaLevel != null) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-brand-100">
              {report.executiveSummary.targetSfiaLevel && (
                <span className="rounded-md border border-white/10 bg-brand-900/30 px-2.5 py-1">
                  Kỳ vọng: <strong>SFIA Level {report.executiveSummary.targetSfiaLevel}</strong>
                </span>
              )}
              {report.executiveSummary.demonstratedSfiaLevel != null && (
                <span className="rounded-md border border-white/10 bg-brand-900/30 px-2.5 py-1">
                  Thể hiện: <strong>SFIA Level {report.executiveSummary.demonstratedSfiaLevel}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {recommendationStatus && (
          <div className="flex shrink-0 flex-col items-start gap-1.5 md:items-end">
            <span className="text-brand-200 text-xs font-medium uppercase tracking-wider">
              Khuyến nghị tuyển dụng
            </span>
            <RecommendationBadge status={recommendationStatus} size="lg" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {report.reportQuality === 'partial' && (
          <div className="bg-warning-subtle text-warning-subtle-fg border-warning-subtle-fg/30 rounded-xl border px-4 py-3 text-sm">
            Một số câu trả lời không được AI chấm điểm tự động. Điểm tổng vẫn
            tính các câu đã bỏ qua là 0 điểm.
          </div>
        )}
        {report.reportQuality === 'not_scorable' && (
          <div className="border-brand-subtle-border bg-brand-subtle text-brand-subtle-fg rounded-xl border px-4 py-3 text-sm">
            Báo cáo cũ này chưa có dữ liệu điểm cho các câu đã bỏ qua. Các báo
            cáo mới sẽ tính câu bỏ qua là 0 điểm.
          </div>
        )}
        {session && <SessionMetadataCard session={session} />}

        <div className="border-brand-subtle-border bg-brand-subtle rounded-2xl border p-5">
          <h2 className="text-ink mb-4 text-base font-semibold">
            Tóm tắt tổng quan
          </h2>
          <dl className="flex flex-col gap-4">
            <div>
              <dt className="text-ink-faint text-xs font-medium uppercase tracking-wide">
                Nhận xét tổng quan
              </dt>
              <dd className="text-foreground mt-1 text-sm">
                {overviewSummary.overview}
              </dd>
            </div>

            <div>
              <dt className="text-ink-faint text-xs font-medium uppercase tracking-wide">
                Các câu trả lời tốt
              </dt>
              <dd className="mt-1">
                {overviewSummary.goodAnswers.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {overviewSummary.goodAnswers.map((item) => (
                      <li key={item.label} className="text-foreground text-sm">
                        {item.label} - {item.score}/100
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Chưa có câu trả lời nào đạt từ {GOOD_ANSWER_THRESHOLD}/100.
                  </span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-ink-faint text-xs font-medium uppercase tracking-wide">
                Các câu trả lời không tốt
              </dt>
              <dd className="mt-1">
                {overviewSummary.weakAnswers.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {overviewSummary.weakAnswers.map((item) => (
                      <li key={item.label} className="text-foreground text-sm">
                        {item.label} - {item.score}/100
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Không có câu trả lời nào dưới {WEAK_ANSWER_THRESHOLD}/100.
                  </span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-ink-faint text-xs font-medium uppercase tracking-wide">
                Hướng cần cải thiện
              </dt>
              <dd className="mt-1">
                {overviewSummary.improvementDirections.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {overviewSummary.improvementDirections.map((item) => (
                      <li
                        key={item}
                        className="text-foreground flex gap-2 text-sm"
                      >
                        <span className="bg-brand mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Chưa có đủ dữ liệu để tổng hợp hướng cải thiện.
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {session?.contextPackId && session?.sessionType && (
          <ScoringMethodCard
            contextPackId={session.contextPackId}
            sessionType={session.sessionType}
          />
        )}

        {report.skillsBreakdown && report.skillsBreakdown.length > 0 ? (
          <>
            <SfiaCompetencyOverview skills={report.skillsBreakdown} />
            <SkillsBreakdownCard skills={report.skillsBreakdown} />
          </>
        ) : (
          <div className="border-border bg-surface-1 text-ink rounded-2xl border p-6 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Info className="size-4 text-brand" />
              Báo cáo phiên bản trước
            </div>
            <p className="text-ink-muted mt-1.5 text-xs leading-relaxed">
              Phiên phỏng vấn này được khởi tạo trước khi hệ thống nâng cấp khung năng lực SFIA 9 &amp; O*NET. Điểm tổng quát và nội dung chi tiết từng câu trả lời vẫn được bảo lưu đầy đủ bên dưới.
            </p>
          </div>
        )}

        <ActionPlanTimeline actionPlan={report.actionPlan} />

        <div>
          <h2 className="text-ink mb-4 text-base font-semibold">
            Phân tích từng câu trả lời
          </h2>
          <AnnotatedTranscript
            items={report.transcript ?? []}
            contextPackId={session?.contextPackId}
            sessionType={session?.sessionType}
          />
        </div>
      </div>
    </div>
  )
}
