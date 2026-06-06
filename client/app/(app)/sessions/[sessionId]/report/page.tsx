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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-500">AI đang tạo báo cáo, vui lòng chờ...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-red-600">{error}</div>
    )
  }

  if (!report) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Báo cáo phỏng vấn</h1>
        <p className="mt-1 text-sm text-gray-500">
          Điểm tổng:{' '}
          <span className="font-medium text-gray-900">{report.overallScore.toFixed(1)} / 10</span>
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {report.executiveSummary && Object.keys(report.executiveSummary).length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
            <h2 className="mb-3 text-base font-semibold text-gray-800">Tóm tắt tổng quan</h2>
            <dl className="flex flex-col gap-2">
              {Object.entries(report.executiveSummary).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{key}</dt>
                  <dd className="mt-0.5 text-sm text-gray-800">
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
          <h2 className="mb-4 text-base font-semibold text-gray-800">Transcript có chú thích</h2>
          <AnnotatedTranscript items={report.transcript} />
        </div>
      </div>
    </div>
  )
}
