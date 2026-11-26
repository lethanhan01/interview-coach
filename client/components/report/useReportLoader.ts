'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSessionEvents } from '@/hooks/useSessionEvents'
import { sessionQueries } from '@/queries/session.queries'
import type { FeedbackProgress, Report } from '@/types'
import {
  isReportNotReadyError,
  REPORT_POLL_INTERVAL_MS,
} from './report-summary-helpers'

export interface UseReportLoaderResult {
  report: Report | null
  progress: FeedbackProgress | null
  progressPercent: number
  loading: boolean
  error: string | null
}

export function useReportLoader(sessionId: string): UseReportLoaderResult {
  const queryClient = useQueryClient()
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

  return {
    report,
    progress,
    progressPercent,
    loading,
    error,
  }
}
