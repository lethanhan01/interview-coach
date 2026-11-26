'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { QueryClient } from '@tanstack/react-query'
import { sessionQueries } from '@/queries/session.queries'
import type { Question, SessionStatus } from '@/types'

export interface UseSessionInitializationOptions {
  sessionId: string
  queryClient: QueryClient
  router: AppRouterInstance
  remainingSecondsRef: React.MutableRefObject<number>
}

export function useSessionInitialization({
  sessionId,
  queryClient,
  router,
  remainingSecondsRef,
}: UseSessionInitializationOptions) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>('generating')
  const [sessionLanguage, setSessionLanguage] = useState<'vi' | 'en'>('vi')
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60)
  const [loading, setLoading] = useState(true)
  const [questionsReady, setQuestionsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const questionsReadyRef = useRef(false)

  useEffect(() => {
    questionsReadyRef.current = questionsReady
  }, [questionsReady])

  const loadReadyQuestions = useCallback(
    async (isCancelled?: () => boolean): Promise<boolean> => {
      const qs = await queryClient.fetchQuery({
        ...sessionQueries.questions(sessionId),
        staleTime: 0,
      })
      if (isCancelled?.() || qs.questions.length === 0) return false

      setQuestions(qs.questions)
      setCurrentIndex(Math.min(qs.currentIndex ?? 0, qs.questions.length - 1))
      setQuestionsReady(true)
      setError(null)
      setLoading(false)
      return true
    },
    [queryClient, sessionId]
  )

  useEffect(() => {
    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | null = null

    async function init() {
      try {
        const currentSession = await queryClient.fetchQuery({
          ...sessionQueries.detail(sessionId),
          staleTime: 0,
        })
        if (cancelled) return
        setSessionStatus(currentSession.status)
        if (currentSession.language) setSessionLanguage(currentSession.language)

        if (
          currentSession.status === 'completing' ||
          currentSession.status === 'completed'
        ) {
          router.replace(`/sessions/${sessionId}/report`)
          return
        }
        if (currentSession.status === 'canceled') {
          setLoading(false)
          return
        }

        const persistedRemaining =
          currentSession.remainingSeconds ??
          (currentSession.durationMin ?? 30) * 60
        remainingSecondsRef.current = persistedRemaining
        setRemainingSeconds(persistedRemaining)

        async function pollQuestions(): Promise<void> {
          for (let i = 0; i < 6; i++) {
            if (cancelled) return
            if (await loadReadyQuestions(() => cancelled)) return
            if (cancelled) return
            await new Promise<void>((resolve) => {
              pollTimer = setTimeout(() => {
                pollTimer = null
                resolve()
              }, 5000)
            })
          }
          if (cancelled) return
          throw new Error('Câu hỏi chưa sẵn sàng sau 30 giây')
        }

        await pollQuestions()
        if (cancelled) return
        if (
          currentSession.status === 'generating' ||
          currentSession.status === 'ready'
        ) {
          setSessionStatus('active')
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Không thể tải phiên phỏng vấn'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void init()

    return () => {
      cancelled = true
      if (pollTimer) {
        clearTimeout(pollTimer)
        pollTimer = null
      }
    }
  }, [sessionId, router, loadReadyQuestions, queryClient, remainingSecondsRef])

  return {
    questions,
    currentIndex,
    sessionStatus,
    sessionLanguage,
    remainingSeconds,
    loading,
    questionsReady,
    questionsReadyRef,
    error,
    setQuestions,
    setCurrentIndex,
    setSessionStatus,
    setRemainingSeconds,
    setLoading,
    setQuestionsReady,
    setError,
    loadReadyQuestions,
  }
}
