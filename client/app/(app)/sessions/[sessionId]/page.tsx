'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { createClient } from '@/lib/supabase'
import QuestionCard from '@/components/interview/QuestionCard'
import TextAnswerInput from '@/components/interview/TextAnswerInput'
import VoiceRecorder from '@/components/interview/VoiceRecorder'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import Button from '@/components/ui/Button'
import type { SessionStatus } from '@/lib/types'

interface Question {
  id: string
  content: string
  orderIndex: number
}

type AnswerMode = 'text' | 'voice'

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerMode, setAnswerMode] = useState<AnswerMode>('text')
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login'); return }
        setAccessToken(session.access_token)
        setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')

        const currentSession = await apiClient.get<{ status: SessionStatus }>(
          `/sessions/${sessionId}/status`,
        )
        if (currentSession.status === 'completing' || currentSession.status === 'completed') {
          router.replace(`/sessions/${sessionId}/report`)
          return
        }

        async function pollQuestions(): Promise<Question[]> {
          for (let i = 0; i < 6; i++) {
            const qs = await apiClient.get<{ questions: Question[] }>(`/sessions/${sessionId}/questions`)
            if (qs.questions.length > 0) return qs.questions
            await new Promise(r => setTimeout(r, 5000))
          }
          throw new Error('Câu hỏi chưa sẵn sàng sau 30 giây')
        }
        const qs = await pollQuestions()
        setQuestions(qs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải phiên phỏng vấn')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [sessionId, router])

  useEffect(() => {
    if (!accessToken) return
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'
    const es = new EventSource(`${apiBase}/sessions/${sessionId}/events?token=${accessToken}`)
    eventSourceRef.current = es

    es.addEventListener('turn.follow_up', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      setFollowUp(data.questionText ?? null)
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
  }, [sessionId, accessToken])

  const advance = useCallback(async () => {
    if (currentIndex + 1 >= questions.length) {
      setIsCompleting(true)
      await apiClient.patch<{ status: SessionStatus }>(
        `/sessions/${sessionId}/status`,
        { status: 'completed' },
      )
      router.replace(`/sessions/${sessionId}/report`)
    } else {
      setFollowUp(null)
      setCurrentIndex((i) => i + 1)
    }
  }, [sessionId, questions.length, currentIndex, router])

  const submitText = useCallback(async (text: string) => {
    await apiClient.post(`/sessions/${sessionId}/turns`, {
      answerMode: 'text',
      answerText: text,
      questionId: questions[currentIndex]?.id,
    })
    await advance()
  }, [sessionId, questions, currentIndex, advance])

  const submitVoice = useCallback(async (audioUrl: string, durationSeconds: number, sizeBytes: number) => {
    await apiClient.post(`/sessions/${sessionId}/turns`, {
      answerMode: 'voice',
      audioFileUrl: audioUrl,
      audioDurationSeconds: durationSeconds,
      audioSizeBytes: sizeBytes,
      questionId: questions[currentIndex]?.id,
    })
    await advance()
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

  const current = questions[currentIndex]

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-2xl px-4 py-10">
        {current && (
          <QuestionCard
            questionText={followUp ?? current.content}
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
            <TextAnswerInput onSubmit={submitText} />
          ) : (
            <VoiceRecorder
              onSubmit={submitVoice}
              supabaseUrl={supabaseUrl}
              accessToken={accessToken}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
