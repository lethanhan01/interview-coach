'use client'

import { useCallback, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useSessionEvents } from '@/hooks/useSessionEvents'
import type { FeedbackProgress } from '@/types'
import LiveInterviewWorkspace from './LiveInterviewWorkspace'
import SessionStatusView from './SessionStatusView'
import { useInterviewDraft } from './useInterviewDraft'
import { useSessionInitialization } from './useSessionInitialization'
import { useSessionRoomTurns } from './useSessionRoomTurns'

export default function SessionRoomClient() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const remainingSecondsRef = useRef(30 * 60)

  const { getDraft, setDraft, clearQuestionDraft, clearAllDrafts } =
    useInterviewDraft(sessionId)

  const {
    questions,
    currentIndex,
    sessionStatus,
    sessionLanguage,
    remainingSeconds,
    loading,
    questionsReady,
    questionsReadyRef,
    error,
    setCurrentIndex,
    setSessionStatus,
    setRemainingSeconds,
    setQuestionsReady,
    setError,
    setLoading,
    loadReadyQuestions,
  } = useSessionInitialization({
    sessionId,
    queryClient,
    router,
    remainingSecondsRef,
  })

  const [answerMode, setAnswerMode] = useState<'text' | 'voice'>('text')
  const [isVoiceBusy, setIsVoiceBusy] = useState(false)
  const [liveProgress, setLiveProgress] = useState<FeedbackProgress | null>(
    null
  )

  const {
    statusAction,
    turnSubmitting,
    isCompleting,
    isTimeoutCompleting,
    actionError,
    setIsCompleting,
    updateSessionStatus,
    completeByTimeout,
    submitText,
    submitVoice,
    skipCurrentQuestion,
    openCancelConfirm,
    openEarlyFinishConfirm,
  } = useSessionRoomTurns({
    sessionId,
    questions,
    currentIndex,
    sessionStatus,
    questionsReady,
    remainingSecondsRef,
    queryClient,
    router,
    setCurrentIndex,
    setSessionStatus,
    setRemainingSeconds,
    setQuestionsReady,
    clearQuestionDraft,
    clearAllDrafts,
  })

  const trackRemainingSeconds = useCallback(
    (seconds: number) => {
      remainingSecondsRef.current = seconds
      setRemainingSeconds(seconds)
    },
    [setRemainingSeconds]
  )

  const { connectionState, reconnect } = useSessionEvents({
    sessionId,
    enabled:
      Boolean(sessionId) &&
      !error &&
      !isCompleting &&
      sessionStatus !== 'canceled' &&
      sessionStatus !== 'completed',
    onStatus: (status) => {
      setSessionStatus(status)
      if (status === 'active' && !questionsReadyRef.current) {
        void loadReadyQuestions()
      }
      if (status === 'error') {
        setError(
          'Không thể tạo câu hỏi cho phiên phỏng vấn này. Vui lòng thử tạo phiên mới.'
        )
        setLoading(false)
        setQuestionsReady(false)
      }
    },
    onProgress: (progress) => {
      setLiveProgress(progress)
    },
    onReportReady: () => {
      setIsCompleting(true)
      clearAllDrafts()
      router.replace(`/sessions/${sessionId}/report`)
    },
    onCompleted: () => {
      setIsCompleting(true)
      clearAllDrafts()
      router.replace(`/sessions/${sessionId}/report`)
    },
    onTerminalError: (message) => {
      setError(message)
      setLoading(false)
      setQuestionsReady(false)
    },
  })

  if (loading) {
    return <SessionStatusView state="loading" />
  }

  if (error) {
    return <SessionStatusView state="error" error={error} />
  }

  if (isCompleting) {
    return (
      <SessionStatusView
        state="completing"
        liveProgress={liveProgress}
        isTimeoutCompleting={isTimeoutCompleting}
      />
    )
  }

  if (sessionStatus === 'paused') {
    return (
      <SessionStatusView
        state="paused"
        actionError={actionError}
        statusAction={statusAction}
        onResume={() => void updateSessionStatus('active')}
        onCancel={openCancelConfirm}
      />
    )
  }

  if (sessionStatus === 'canceled') {
    return <SessionStatusView state="canceled" />
  }

  const current = questions[currentIndex]

  return (
    <ErrorBoundary>
      <LiveInterviewWorkspace
        sessionId={sessionId}
        sessionLanguage={sessionLanguage}
        questions={questions}
        currentIndex={currentIndex}
        remainingSeconds={remainingSeconds}
        isTimerActive={
          questionsReady && sessionStatus === 'active' && !isCompleting
        }
        questionsReady={questionsReady}
        isCompleting={isCompleting}
        turnSubmitting={turnSubmitting}
        statusAction={statusAction}
        actionError={actionError}
        connectionState={connectionState}
        answerMode={answerMode}
        draftAnswer={getDraft(current?.id)}
        isVoiceBusy={isVoiceBusy}
        onRemainingChange={trackRemainingSeconds}
        onExpire={completeByTimeout}
        onPause={() => void updateSessionStatus('paused')}
        onEarlyFinish={openEarlyFinishConfirm}
        onCancel={openCancelConfirm}
        onReconnect={reconnect}
        onAnswerModeChange={setAnswerMode}
        onDraftChange={(draft) => current && setDraft(current.id, draft)}
        onVoiceBusyChange={setIsVoiceBusy}
        onSubmitText={submitText}
        onSubmitVoice={submitVoice}
        onSkip={skipCurrentQuestion}
      />
    </ErrorBoundary>
  )
}
