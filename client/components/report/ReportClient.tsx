'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Alert,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionQueries } from '@/queries/session.queries'
import { useSessionEvents } from '@/hooks/useSessionEvents'
import type { FeedbackProgress, Report } from '@/types'
import AnnotatedTranscript from '@/components/report/transcript/AnnotatedTranscript'
import { SfiaCompetencyOverview } from '@/components/report/competency/SfiaCompetencyOverview'
import { SkillsBreakdownCard } from '@/components/report/competency/SkillsBreakdownCard'
import { ActionPlanTimeline } from '@/components/report/overview/ActionPlanTimeline'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { SafeViewTransition } from '@/components/common/SafeViewTransition'
import {
  buildOverviewSummary,
  isReportNotReadyError,
  REPORT_POLL_INTERVAL_MS,
} from './report-summary-helpers'
import { ReportNotReadyView } from './ReportNotReadyView'
import { ReportHeroSummary } from '@/components/report/overview/ReportHeroSummary'
import { ReportOverviewTab } from '@/components/report/overview/ReportOverviewTab'

export interface ReportClientProps {
  sessionId?: string
}

export function ReportClient({
  sessionId: propSessionId,
}: Readonly<ReportClientProps> = {}) {
  const params = useParams<{ sessionId: string }>()
  const sessionId = propSessionId ?? params?.sessionId ?? ''
  const queryClient = useQueryClient()
  const { data: session = null } = useQuery({
    ...sessionQueries.detail(sessionId),
    enabled: Boolean(sessionId),
  })

  const [report, setReport] = useState<Report | null>(null)
  const [progress, setProgress] = useState<FeedbackProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usePollingFallback, setUsePollingFallback] = useState(false)
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

  const fetchReport = useCallback(async () => {
    try {
      const data = await queryClient.fetchQuery({
        ...sessionQueries.report(sessionId),
        staleTime: 0,
        retry: false,
      })
      reportLoadedRef.current = true
      setReport(data)
      setLoading(false)
      setError(null)
    } catch (err: unknown) {
      if (isReportNotReadyError(err)) {
        // Still generating
      } else {
        setError(err instanceof Error ? err.message : 'Không thể tải báo cáo')
        setLoading(false)
      }
    }
  }, [queryClient, sessionId])

  const fetchProgress = useCallback(async () => {
    try {
      const data = await queryClient.fetchQuery({
        ...sessionQueries.feedbackProgress(sessionId),
        staleTime: 0,
        retry: false,
      })
      if (reportLoadedRef.current) return
      applyProgress(data)
      if (data.reportReady) {
        void fetchReport()
      }
    } catch {
      // Best-effort
    }
  }, [queryClient, sessionId, applyProgress, fetchReport])

  useSessionEvents({
    sessionId,
    enabled: !report,
    onProgress: (prog) => {
      applyProgress(prog)
      if (prog.reportReady) {
        void fetchReport()
      }
    },
    onReportReady: () => {
      void fetchReport()
    },
    onCompleted: () => {
      void fetchReport()
    },
    onConnectionChange: (connected) => {
      if (connected) setUsePollingFallback(false)
    },
    onError: () => {
      setUsePollingFallback(true)
    },
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchReport()
      void fetchProgress()
    }, 0)

    return () => clearTimeout(timer)
  }, [sessionId, fetchReport, fetchProgress])

  useEffect(() => {
    if (!usePollingFallback || reportLoadedRef.current || report) return

    const interval = setInterval(() => {
      if (reportLoadedRef.current) return
      void fetchProgress()
      void fetchReport()
    }, REPORT_POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [usePollingFallback, report, fetchProgress, fetchReport])

  if (loading) {
    return (
      <ReportNotReadyView
        progress={progress}
        progressPercent={progressPercent}
      />
    )
  }

  if (error) {
    return (
      <Container size="md" py="xl">
        <Alert
          color="danger"
          variant="light"
          radius="md"
          icon={<IconAlertTriangle size={18} />}
          title="Lỗi tải báo cáo"
        >
          {error}
        </Alert>
      </Container>
    )
  }

  if (!report) return null

  const overviewSummary = buildOverviewSummary(report)

  return (
    <ErrorBoundary>
      <SafeViewTransition>
        <Container size="md" py="xl">
          <Stack gap="xl">
            <Title order={1} size="h2">
              Báo cáo phỏng vấn
            </Title>

            <ReportHeroSummary report={report} />

            <ReportOverviewTab
              report={report}
              session={session}
              overviewSummary={overviewSummary}
            />

            {report.skillsBreakdown && report.skillsBreakdown.length > 0 ? (
              <>
                <SfiaCompetencyOverview skills={report.skillsBreakdown} />
                <SkillsBreakdownCard skills={report.skillsBreakdown} />
              </>
            ) : (
              <Paper
                withBorder
                radius="md"
                p="md"
                bg="var(--mantine-color-default)"
              >
                <Group gap="xs" mb={4}>
                  <IconInfoCircle
                    size={18}
                    color="var(--mantine-color-brand-filled)"
                    aria-hidden="true"
                  />
                  <Text size="sm" fw={700}>
                    Báo cáo phiên bản trước
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" lh="relaxed">
                  Phiên phỏng vấn này được khởi tạo trước khi hệ thống nâng cấp
                  khung năng lực SFIA 9 &amp; O*NET. Điểm tổng quát và nội dung
                  chi tiết từng câu trả lời vẫn được bảo lưu đầy đủ bên dưới.
                </Text>
              </Paper>
            )}

            <ActionPlanTimeline actionPlan={report.actionPlan} />

            <Stack gap="xs">
              <Title order={2} size="h4">
                Phân tích từng câu trả lời
              </Title>
              <AnnotatedTranscript items={report.transcript ?? []} />
            </Stack>
          </Stack>
        </Container>
      </SafeViewTransition>
    </ErrorBoundary>
  )
}

export default ReportClient
