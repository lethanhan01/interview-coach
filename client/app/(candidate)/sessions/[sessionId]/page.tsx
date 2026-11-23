'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowLeft,
  PauseCircle,
  PlayCircle,
  SkipForward,
  XCircle,
} from 'lucide-react'
import {
  queryKeys,
  sessionQueries,
  useOptionalQueryClient,
} from '@/lib/query-client'
import { sessionService } from '@/services'
import QuestionCard from '@/components/interview/QuestionCard'
import TextAnswerInput from '@/components/interview/TextAnswerInput'
import VoiceRecorder from '@/components/interview/VoiceRecorder'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import Button from '@/components/ui/Button'
import CountdownTimer from '@/components/interview/CountdownTimer'
import type {
  Question,
  SessionStatus,
  SessionStatusAction,
  SubmitAnswerPayload,
  UpdateSessionStatusPayload,
  VoiceMetrics,
} from '@/types'

type AnswerMode = 'text' | 'voice'

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const queryClient = useOptionalQueryClient()

  const { mutateAsync: mutateSessionStatus } = useMutation({
    mutationFn: (payload: UpdateSessionStatusPayload) =>
      sessionService.updateStatus(sessionId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.sessions.detail(sessionId), updated)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.list(),
      })
    },
  })

  const { mutateAsync: mutateSubmitTurn } = useMutation({
    mutationFn: (payload: SubmitAnswerPayload) =>
      sessionService.submitTurn(sessionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.list(),
      })
    },
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('generating')
  const [sessionLanguage, setSessionLanguage] = useState<'vi' | 'en'>('vi')
  const [draftAnswer, setDraftAnswer] = useState<string>('')
  const [answerMode, setAnswerMode] = useState<AnswerMode>('text')
  const [statusAction, setStatusAction] = useState<SessionStatusAction | null>(
    null
  )
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60)
  const [loading, setLoading] = useState(true)
  const [questionsReady, setQuestionsReady] = useState(false)
  const [turnSubmitting, setTurnSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isTimeoutCompleting, setIsTimeoutCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const questionsReadyRef = useRef(false)
  const turnSubmittingRef = useRef(false)
  const remainingSecondsRef = useRef(30 * 60)
  const timeoutCompletingRef = useRef(false)

  const trackRemainingSeconds = useCallback((seconds: number) => {
    remainingSecondsRef.current = seconds
  }, [])

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
        if (currentSession.language) {
          setSessionLanguage(currentSession.language)
        }
        if (
          currentSession.status === 'completing' ||
          currentSession.status === 'completed'
        ) {
          router.replace(`/sessions/${sessionId}/report`)
          return
        }
        if (currentSession.status === 'canceled') return
        const persistedRemaining =
          currentSession.remainingSeconds ??
          (currentSession.durationMin ?? 30) * 60
        remainingSecondsRef.current = persistedRemaining
        setRemainingSeconds(persistedRemaining)

        async function pollQuestions(): Promise<Question[]> {
          for (let i = 0; i < 6; i++) {
            if (cancelled) return []
            if (await loadReadyQuestions(() => cancelled)) return []
            if (cancelled) return []
            await new Promise<void>((resolve) => {
              pollTimer = setTimeout(() => {
                pollTimer = null
                resolve()
              }, 5000)
            })
          }
          if (cancelled) return []
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
        if (!cancelled) {
          setLoading(false)
        }
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
  }, [sessionId, router, loadReadyQuestions, queryClient])

  useEffect(() => {
    const es = sessionService.createEventSource(sessionId)
    eventSourceRef.current = es

    es.addEventListener('session.status', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as {
        status?: SessionStatus
      }
      if (!data.status) return
      setSessionStatus(data.status)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.list(),
      })
      if (data.status === 'active' && !questionsReadyRef.current) {
        void loadReadyQuestions()
      }
      if (data.status === 'error') {
        setError(
          'Không thể tạo câu hỏi cho phiên phỏng vấn này. Vui lòng thử tạo phiên mới.'
        )
        setLoading(false)
        setQuestionsReady(false)
        es.close()
      }
    })
    const openReport = () => {
      setIsCompleting(true)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.list(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.report(sessionId),
      })
      router.replace(`/sessions/${sessionId}/report`)
      es.close()
    }
    es.addEventListener('report.ready', openReport)
    es.addEventListener('session.completed', openReport)
    es.addEventListener('session.error', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as {
          error?: { code?: string; message?: string }
        }
        setError(data.error?.message || 'Có lỗi xảy ra trong phiên phỏng vấn.')
      } catch {
        setError('Có lỗi xảy ra trong phiên phỏng vấn.')
      }
      setLoading(false)
      setQuestionsReady(false)
      es.close()
    })
    es.onerror = () => es.close()

    return () => es.close()
  }, [sessionId, router, loadReadyQuestions, queryClient])

  const updateSessionStatus = useCallback(
    async (status: SessionStatusAction) => {
      setActionError(null)
      setStatusAction(status)
      try {
        const updated = await mutateSessionStatus(
          status === 'paused'
            ? { status, remainingSeconds: remainingSecondsRef.current }
            : { status }
        )
        setSessionStatus(updated.status)
        if (updated.remainingSeconds != null) {
          remainingSecondsRef.current = updated.remainingSeconds
          setRemainingSeconds(updated.remainingSeconds)
        }
        if (updated.status === 'active') setQuestionsReady(true)
        if (updated.status === 'canceled') eventSourceRef.current?.close()
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : 'Không thể cập nhật phiên phỏng vấn'
        )
      } finally {
        setStatusAction(null)
      }
    },
    [mutateSessionStatus]
  )

  const cancelSession = useCallback(async () => {
    if (!window.confirm('Hủy phiên phỏng vấn hiện tại?')) return
    await updateSessionStatus('canceled')
  }, [updateSessionStatus])

  const advance = useCallback(async () => {
    setDraftAnswer('')
    if (currentIndex + 1 >= questions.length) {
      setIsCompleting(true)
      await mutateSessionStatus({ status: 'completed' })
      router.replace(`/sessions/${sessionId}/report`)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }, [sessionId, questions.length, currentIndex, router, mutateSessionStatus])

  const completeByTimeout = useCallback(async () => {
    if (
      timeoutCompletingRef.current ||
      sessionStatus !== 'active' ||
      !questionsReadyRef.current
    ) {
      return
    }

    timeoutCompletingRef.current = true
    turnSubmittingRef.current = true
    remainingSecondsRef.current = 0
    setRemainingSeconds(0)
    setTurnSubmitting(true)
    setIsTimeoutCompleting(true)
    setIsCompleting(true)
    setActionError(null)

    try {
      await mutateSessionStatus({
        status: 'completed',
        autoSkipUnanswered: true,
        remainingSeconds: 0,
      })
      router.replace(`/sessions/${sessionId}/report`)
    } catch (err) {
      timeoutCompletingRef.current = false
      turnSubmittingRef.current = false
      setTurnSubmitting(false)
      setIsTimeoutCompleting(false)
      setIsCompleting(false)
      setActionError(
        err instanceof Error
          ? err.message
          : 'Không thể tự động hoàn tất phiên phỏng vấn'
      )
    }
  }, [router, sessionId, sessionStatus, mutateSessionStatus])

  const submitText = useCallback(
    async (text: string) => {
      if (turnSubmittingRef.current) return
      turnSubmittingRef.current = true
      setTurnSubmitting(true)
      try {
        await mutateSubmitTurn({
          answerMode: 'text',
          answerText: text,
          questionId: questions[currentIndex]?.id,
        })
        setDraftAnswer('')
        await advance()
      } finally {
        turnSubmittingRef.current = false
        setTurnSubmitting(false)
      }
    },
    [mutateSubmitTurn, questions, currentIndex, advance]
  )

  const submitVoice = useCallback(
    async (
      transcript: string,
      durationSeconds: number,
      metrics?: VoiceMetrics
    ) => {
      if (turnSubmittingRef.current) return
      turnSubmittingRef.current = true
      setTurnSubmitting(true)
      try {
        await mutateSubmitTurn({
          answerMode: 'voice',
          answerText: transcript,
          audioDurationSeconds: durationSeconds,
          voiceMetrics: metrics,
          questionId: questions[currentIndex]?.id,
        })
        setDraftAnswer('')
        await advance()
      } finally {
        turnSubmittingRef.current = false
        setTurnSubmitting(false)
      }
    },
    [mutateSubmitTurn, questions, currentIndex, advance]
  )

  const skipCurrentQuestion = useCallback(async () => {
    if (turnSubmittingRef.current) return
    turnSubmittingRef.current = true
    setTurnSubmitting(true)
    setActionError(null)
    try {
      await mutateSubmitTurn({
        answerMode: 'text',
        answerText: '',
        skipQuestion: true,
        questionId: questions[currentIndex]?.id,
      })
      await advance()
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Không thể bỏ qua câu hỏi'
      )
    } finally {
      turnSubmittingRef.current = false
      setTurnSubmitting(false)
    }
  }, [mutateSubmitTurn, questions, currentIndex, advance])


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
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

  if (isCompleting) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-ink text-base font-medium">
          {isTimeoutCompleting
            ? 'Đã hết thời gian, đang hoàn tất phiên phỏng vấn'
            : 'Đang hoàn tất phiên phỏng vấn'}
        </p>
        <p className="text-ink-muted text-sm">
          {isTimeoutCompleting
            ? 'Các câu chưa trả lời sẽ được đánh dấu bỏ qua trước khi tạo báo cáo.'
            : 'AI đang tạo báo cáo, vui lòng chờ...'}
        </p>
      </div>
    )
  }

  if (sessionStatus === 'paused') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center">
        <div className="bg-brand-subtle text-brand-subtle-fg flex size-14 items-center justify-center rounded-full">
          <PauseCircle className="size-7" aria-hidden="true" />
        </div>
        <div>
          <p className="text-ink text-lg font-semibold">
            Phiên phỏng vấn đang tạm dừng
          </p>
          <p className="text-ink-muted mt-1 text-sm">
            Bạn có thể tiếp tục hoặc hủy phiên này.
          </p>
        </div>
        {actionError && <p className="text-danger text-sm">{actionError}</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => updateSessionStatus('active')}
            loading={statusAction === 'active'}
          >
            <PlayCircle className="size-4" aria-hidden="true" />
            Tiếp tục
          </Button>
          <Button
            variant="destructive"
            onClick={cancelSession}
            loading={statusAction === 'canceled'}
          >
            <XCircle className="size-4" aria-hidden="true" />
            Hủy phiên
          </Button>
          <Button variant="ghost" onClick={() => router.push('/sessions')}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Danh sách
          </Button>
        </div>
      </div>
    )
  }

  if (sessionStatus === 'canceled') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center">
        <div className="bg-danger/10 text-danger flex size-14 items-center justify-center rounded-full">
          <XCircle className="size-7" aria-hidden="true" />
        </div>
        <div>
          <p className="text-ink text-lg font-semibold">
            Phiên phỏng vấn đã hủy
          </p>
          <p className="text-ink-muted mt-1 text-sm">
            Phiên này sẽ không tạo báo cáo đánh giá.
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.push('/sessions')}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Quay về danh sách
        </Button>
      </div>
    )
  }

  const current = questions[currentIndex]

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateSessionStatus('paused')}
              loading={statusAction === 'paused'}
              disabled={!questionsReady || isCompleting}
            >
              <PauseCircle className="size-4" aria-hidden="true" />
              Tạm dừng
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={cancelSession}
              loading={statusAction === 'canceled'}
              disabled={isCompleting}
            >
              <XCircle className="size-4" aria-hidden="true" />
              Hủy
            </Button>
          </div>
          <CountdownTimer
            initialSeconds={remainingSeconds}
            active={
              questionsReady && sessionStatus === 'active' && !isCompleting
            }
            onChange={trackRemainingSeconds}
            onExpire={completeByTimeout}
          />
        </div>
        {actionError && (
          <p className="text-danger mb-4 text-sm">{actionError}</p>
        )}

        {current && (
          <QuestionCard
            questionText={current.content}
            orderIndex={currentIndex}
            totalQuestions={questions.length}
            skillCode={current.skillCode}
            skillName={current.skillName}
            language={sessionLanguage}
          />
        )}

        <div className="mt-6 flex gap-3">
          {(['text', 'voice'] as AnswerMode[]).map((m) => (
            <Button
              key={m}
              variant={answerMode === m ? 'primary' : 'secondary'}
              onClick={() => setAnswerMode(m)}
              disabled={turnSubmitting || isCompleting}
            >
              {m === 'text' ? 'Text' : 'Giọng nói'}
            </Button>
          ))}
        </div>

        <div className="mt-6">
          {answerMode === 'text' ? (
            <TextAnswerInput
              key={current?.id}
              onSubmit={submitText}
              initialValue={draftAnswer}
              onTextChange={setDraftAnswer}
              disabled={turnSubmitting || isCompleting}
            />
          ) : (
            <VoiceRecorder
              key={current?.id}
              onSubmit={submitVoice}
              language={sessionLanguage}
              initialDraft={draftAnswer}
              onDraftChange={setDraftAnswer}
              disabled={turnSubmitting || isCompleting}
            />
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={skipCurrentQuestion}
            disabled={turnSubmitting || isCompleting || !current}
            loading={turnSubmitting}
          >
            <SkipForward className="size-4" aria-hidden="true" />
            Bỏ qua
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  )
}
