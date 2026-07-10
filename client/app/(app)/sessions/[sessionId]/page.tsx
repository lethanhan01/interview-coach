'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, PauseCircle, PlayCircle, SkipForward, XCircle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import QuestionCard from '@/components/interview/QuestionCard'
import TextAnswerInput from '@/components/interview/TextAnswerInput'
import VoiceRecorder from '@/components/interview/VoiceRecorder'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import Button from '@/components/ui/Button'
import CountdownTimer from '@/components/interview/CountdownTimer'
import type { Session, SessionStatus } from '@/lib/types'

interface Question {
  id: string
  content: string
  orderIndex: number
}

type AnswerMode = 'text' | 'voice'
type SessionStatusAction = 'active' | 'paused' | 'canceled'

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerMode, setAnswerMode] = useState<AnswerMode>('text')
  const [isCompleting, setIsCompleting] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('generating')
  const [statusAction, setStatusAction] = useState<SessionStatusAction | null>(null)
  const [turnSubmitting, setTurnSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30 * 60)
  const [questionsReady, setQuestionsReady] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const questionsReadyRef = useRef(false)
  const turnSubmittingRef = useRef(false)
  const remainingSecondsRef = useRef(30 * 60)

  const trackRemainingSeconds = useCallback((seconds: number) => {
    remainingSecondsRef.current = seconds
  }, [])

  useEffect(() => {
    questionsReadyRef.current = questionsReady
  }, [questionsReady])

  const loadReadyQuestions = useCallback(async (): Promise<boolean> => {
    const qs = await apiClient.get<{ questions: Question[] }>(`/sessions/${sessionId}/questions`)
    if (qs.questions.length === 0) return false

    setQuestions(qs.questions)
    setQuestionsReady(true)
    setError(null)
    setLoading(false)
    return true
  }, [sessionId])

  useEffect(() => {
    async function init() {
      try {
        setAccessToken('dev-mock-token')

        const currentSession = await apiClient.get<Session>(`/sessions/${sessionId}`)
        setSessionStatus(currentSession.status)
        if (currentSession.status === 'completing' || currentSession.status === 'completed') {
          router.replace(`/sessions/${sessionId}/report`)
          return
        }
        if (currentSession.status === 'canceled') return
        const persistedRemaining =
          currentSession.remainingSeconds ?? (currentSession.durationMin ?? 30) * 60
        remainingSecondsRef.current = persistedRemaining
        setRemainingSeconds(persistedRemaining)

        async function pollQuestions(): Promise<Question[]> {
          for (let i = 0; i < 6; i++) {
            if (await loadReadyQuestions()) return []
            await new Promise(r => setTimeout(r, 5000))
          }
          throw new Error('Câu hỏi chưa sẵn sàng sau 30 giây')
        }
        await pollQuestions()
        if (currentSession.status === 'generating' || currentSession.status === 'ready') {
          setSessionStatus('active')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải phiên phỏng vấn')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [sessionId, router, loadReadyQuestions])

  useEffect(() => {
    if (!accessToken) return
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'
    const es = new EventSource(`${apiBase}/sessions/${sessionId}/events?token=${accessToken}`)
    eventSourceRef.current = es

    es.addEventListener('session.status', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { status?: SessionStatus }
      if (!data.status) return
      setSessionStatus(data.status)
      if (data.status === 'active' && !questionsReadyRef.current) {
        void loadReadyQuestions()
      }
      if (data.status === 'error') {
        setError('Không thể tạo câu hỏi cho phiên phỏng vấn này. Vui lòng thử tạo phiên mới.')
        setLoading(false)
        setQuestionsReady(false)
        es.close()
      }
    })
    const openReport = () => {
      setIsCompleting(true)
      router.replace(`/sessions/${sessionId}/report`)
      es.close()
    }
    es.addEventListener('report.ready', openReport)
    es.addEventListener('session.completed', openReport)
    es.onerror = () => es.close()

    return () => es.close()
  }, [sessionId, accessToken, router, loadReadyQuestions])

  const updateSessionStatus = useCallback(async (status: SessionStatusAction) => {
    setActionError(null)
    setStatusAction(status)
    try {
      const updated = await apiClient.patch<Session>(
        `/sessions/${sessionId}/status`,
        status === 'paused'
          ? { status, remainingSeconds: remainingSecondsRef.current }
          : { status },
      )
      setSessionStatus(updated.status)
      if (updated.remainingSeconds != null) {
        remainingSecondsRef.current = updated.remainingSeconds
        setRemainingSeconds(updated.remainingSeconds)
      }
      if (updated.status === 'active') setQuestionsReady(true)
      if (updated.status === 'canceled') eventSourceRef.current?.close()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể cập nhật phiên phỏng vấn')
    } finally {
      setStatusAction(null)
    }
  }, [sessionId])

  const cancelSession = useCallback(async () => {
    if (!window.confirm('Hủy phiên phỏng vấn hiện tại?')) return
    await updateSessionStatus('canceled')
  }, [updateSessionStatus])

  const advance = useCallback(async () => {
    if (currentIndex + 1 >= questions.length) {
      setIsCompleting(true)
      await apiClient.patch<{ status: SessionStatus }>(
        `/sessions/${sessionId}/status`,
        { status: 'completed' },
      )
      router.replace(`/sessions/${sessionId}/report`)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }, [sessionId, questions.length, currentIndex, router])

  const submitText = useCallback(async (text: string) => {
    if (turnSubmittingRef.current) return
    turnSubmittingRef.current = true
    setTurnSubmitting(true)
    try {
      await apiClient.post(`/sessions/${sessionId}/turns`, {
        answerMode: 'text',
        answerText: text,
        questionId: questions[currentIndex]?.id,
      })
      await advance()
    } finally {
      turnSubmittingRef.current = false
      setTurnSubmitting(false)
    }
  }, [sessionId, questions, currentIndex, advance])

  const submitVoice = useCallback(async (
    audioUrl: string,
    durationSeconds: number,
    sizeBytes: number,
    transcript: string,
  ) => {
    if (turnSubmittingRef.current) return
    turnSubmittingRef.current = true
    setTurnSubmitting(true)
    try {
      await apiClient.post(`/sessions/${sessionId}/turns`, {
        answerMode: 'voice',
        answerText: transcript,
        audioFileUrl: audioUrl,
        audioDurationSeconds: durationSeconds,
        audioSizeBytes: sizeBytes,
        questionId: questions[currentIndex]?.id,
      })
      await advance()
    } finally {
      turnSubmittingRef.current = false
      setTurnSubmitting(false)
    }
  }, [sessionId, questions, currentIndex, advance])

  const skipCurrentQuestion = useCallback(async () => {
    if (turnSubmittingRef.current) return
    turnSubmittingRef.current = true
    setTurnSubmitting(true)
    setActionError(null)
    try {
      await apiClient.post(`/sessions/${sessionId}/turns`, {
        answerMode: 'text',
        answerText: '',
        skipQuestion: true,
        questionId: questions[currentIndex]?.id,
      })
      await advance()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể bỏ qua câu hỏi')
    } finally {
      turnSubmittingRef.current = false
      setTurnSubmitting(false)
    }
  }, [sessionId, questions, currentIndex, advance])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-danger">{error}</div>
    )
  }

  if (isCompleting) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-base font-medium text-ink">Đang hoàn tất phiên phỏng vấn</p>
        <p className="text-sm text-ink-muted">AI đang tạo báo cáo, vui lòng chờ...</p>
      </div>
    )
  }

  if (sessionStatus === 'paused') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand">
          <PauseCircle className="size-7" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-semibold text-ink">Phiên phỏng vấn đang tạm dừng</p>
          <p className="mt-1 text-sm text-ink-muted">Bạn có thể tiếp tục hoặc hủy phiên này.</p>
        </div>
        {actionError && <p className="text-sm text-danger">{actionError}</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => updateSessionStatus('active')}
            loading={statusAction === 'active'}
          >
            <PlayCircle className="size-4" aria-hidden="true" />
            Tiếp tục
          </Button>
          <Button
            variant="danger"
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
        <div className="flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger">
          <XCircle className="size-7" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-semibold text-ink">Phiên phỏng vấn đã hủy</p>
          <p className="mt-1 text-sm text-ink-muted">Phiên này sẽ không tạo báo cáo đánh giá.</p>
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
              disabled={!questionsReady}
            >
              <PauseCircle className="size-4" aria-hidden="true" />
              Tạm dừng
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={cancelSession}
              loading={statusAction === 'canceled'}
            >
              <XCircle className="size-4" aria-hidden="true" />
              Hủy
            </Button>
          </div>
          <CountdownTimer
            initialSeconds={remainingSeconds}
            active={questionsReady && sessionStatus === 'active'}
            onChange={trackRemainingSeconds}
          />
        </div>
        {actionError && <p className="mb-4 text-sm text-danger">{actionError}</p>}

        {current && (
          <QuestionCard
            questionText={current.content}
            orderIndex={currentIndex}
            totalQuestions={questions.length}
          />
        )}

        <div className="mt-6 flex gap-3">
          {(['text', 'voice'] as AnswerMode[]).map((m) => (
            <Button
              key={m}
              variant={answerMode === m ? 'primary' : 'secondary'}
              onClick={() => setAnswerMode(m)}
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
              disabled={turnSubmitting}
            />
          ) : (
            <VoiceRecorder
              key={current?.id}
              onSubmit={submitVoice}
              sessionId={sessionId}
              disabled={turnSubmitting}
            />
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={skipCurrentQuestion}
            disabled={turnSubmitting || !current}
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
