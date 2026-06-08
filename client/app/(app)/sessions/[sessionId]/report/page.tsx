'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import type { Report } from '@/lib/types'
import AnnotatedTranscript from '@/components/report/AnnotatedTranscript'
import ActionPlanCard from '@/components/report/ActionPlanCard'
import CompetencyScoreChart from '@/components/report/CompetencyScoreChart'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const POLL_INTERVAL_MS = 5000

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    async function fetchReport() {
      try {
        const data = await apiClient.get<Report>(`/sessions/${sessionId}/report`)
        setReport(data)
        setLoading(false)
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('REPORT_NOT_READY')) {
          timer = setTimeout(fetchReport, POLL_INTERVAL_MS)
        } else {
          setError(err instanceof Error ? err.message : 'Không thể tải báo cáo')
          setLoading(false)
        }
      }
    }

    fetchReport()
    return () => clearTimeout(timer)
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-ink-muted">AI đang tạo báo cáo, vui lòng chờ...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-danger">{error}</div>
    )
  }

  if (!report) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 rounded-2xl bg-brand p-6 text-white">
        <p className="mb-1 text-sm text-brand-200">Báo cáo phỏng vấn</p>
        <p className="text-5xl font-bold">
          {report.overallScore.toFixed(1)}
          <span className="ml-1 text-2xl text-brand-200">/ 10</span>
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {report.executiveSummary && Object.keys(report.executiveSummary).length > 0 && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
            <h2 className="mb-3 text-base font-semibold text-ink">Tóm tắt tổng quan</h2>
            <dl className="flex flex-col gap-2">
              {Object.entries(report.executiveSummary).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">{key}</dt>
                  <dd className="mt-0.5 text-sm text-ink">
                    {typeof value === 'string' || typeof value === 'number'
                      ? String(value)
                      : JSON.stringify(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <CompetencyScoreChart scores={report.competencyHeatmap} />
        <ActionPlanCard actionPlan={report.actionPlan} />
        <div>
          <h2 className="mb-4 text-base font-semibold text-ink">Transcript có chú thích</h2>
          <AnnotatedTranscript items={report.transcript} />
        </div>
      </div>
    </div>
  )
}
