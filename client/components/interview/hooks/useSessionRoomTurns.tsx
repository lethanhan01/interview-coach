'use client'

import { useCallback, useRef, useState } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import type { QueryClient } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { startTypedTransition } from '@/components/common/SafeViewTransition'
import { queryKeys } from '@/queries/keys'
import { sessionService } from '@/services/session.service'
import type {
  Question,
  SessionStatus,
  SessionStatusAction,
  SubmitAnswerPayload,
  UpdateSessionStatusPayload,
  VoiceMetrics,
} from '@/types'

export interface UseSessionRoomTurnsOptions {
  sessionId: string
  questions: Question[]
  currentIndex: number
  sessionStatus: SessionStatus
  questionsReady: boolean
  remainingSecondsRef: React.MutableRefObject<number>
  queryClient: QueryClient
  router: AppRouterInstance
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
  setSessionStatus: React.Dispatch<React.SetStateAction<SessionStatus>>
  setRemainingSeconds: React.Dispatch<React.SetStateAction<number>>
  setQuestionsReady: React.Dispatch<React.SetStateAction<boolean>>
  clearQuestionDraft: (id: string) => void
  clearAllDrafts: () => void
}

export function useSessionRoomTurns({
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
}: UseSessionRoomTurnsOptions) {
  const [statusAction, setStatusAction] = useState<SessionStatusAction | null>(
    null
  )
  const [turnSubmitting, setTurnSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isTimeoutCompleting, setIsTimeoutCompleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const turnSubmittingRef = useRef(false)
  const timeoutCompletingRef = useRef(false)

  const { mutateAsync: mutateStatus } = useMutation({
    mutationFn: (p: UpdateSessionStatusPayload) =>
      sessionService.updateStatus(sessionId, p),
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

  const { mutateAsync: mutateSubmit } = useMutation({
    mutationFn: (p: SubmitAnswerPayload) =>
      sessionService.submitTurn(sessionId, p),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.list(),
      })
    },
  })

  const updateSessionStatus = useCallback(
    async (status: SessionStatusAction) => {
      setActionError(null)
      setStatusAction(status)
      try {
        const payload =
          status === 'paused'
            ? { status, remainingSeconds: remainingSecondsRef.current }
            : { status }
        const updated = await mutateStatus(payload)
        setSessionStatus(updated.status)
        if (updated.remainingSeconds != null) {
          remainingSecondsRef.current = updated.remainingSeconds
          setRemainingSeconds(updated.remainingSeconds)
        }
        if (updated.status === 'active') setQuestionsReady(true)
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Không thể cập nhật phiên phỏng vấn'
        setActionError(msg)
        notifications.show({
          color: 'danger',
          title: 'Lỗi cập nhật',
          message: msg,
        })
      } finally {
        setStatusAction(null)
      }
    },
    [
      mutateStatus,
      remainingSecondsRef,
      setQuestionsReady,
      setRemainingSeconds,
      setSessionStatus,
    ]
  )

  const advance = useCallback(async () => {
    const cur = questions[currentIndex]
    if (cur) clearQuestionDraft(cur.id)
    if (currentIndex + 1 >= questions.length) {
      clearAllDrafts()
      setIsCompleting(true)
      await mutateStatus({ status: 'completed' })
      router.replace(`/sessions/${sessionId}/report`)
    } else {
      startTypedTransition('nav-forward', () => setCurrentIndex((i) => i + 1))
    }
  }, [
    clearAllDrafts,
    clearQuestionDraft,
    currentIndex,
    mutateStatus,
    questions,
    router,
    sessionId,
    setCurrentIndex,
  ])

  const completeByTimeout = useCallback(async () => {
    if (
      timeoutCompletingRef.current ||
      sessionStatus !== 'active' ||
      !questionsReady
    )
      return
    timeoutCompletingRef.current = true
    turnSubmittingRef.current = true
    remainingSecondsRef.current = 0
    setRemainingSeconds(0)
    setTurnSubmitting(true)
    setIsTimeoutCompleting(true)
    setIsCompleting(true)
    setActionError(null)
    try {
      clearAllDrafts()
      await mutateStatus({
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
  }, [
    clearAllDrafts,
    mutateStatus,
    questionsReady,
    remainingSecondsRef,
    router,
    sessionId,
    sessionStatus,
    setRemainingSeconds,
  ])

  const submitText = useCallback(
    async (text: string) => {
      if (turnSubmittingRef.current) return
      turnSubmittingRef.current = true
      setTurnSubmitting(true)
      try {
        await mutateSubmit({
          answerMode: 'text',
          answerText: text,
          questionId: questions[currentIndex]?.id,
        })
        await advance()
      } finally {
        turnSubmittingRef.current = false
        setTurnSubmitting(false)
      }
    },
    [advance, currentIndex, mutateSubmit, questions]
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
        await mutateSubmit({
          answerMode: 'voice',
          answerText: transcript,
          audioDurationSeconds: durationSeconds,
          voiceMetrics: metrics,
          questionId: questions[currentIndex]?.id,
        })
        await advance()
      } finally {
        turnSubmittingRef.current = false
        setTurnSubmitting(false)
      }
    },
    [advance, currentIndex, mutateSubmit, questions]
  )

  const skipCurrentQuestion = useCallback(async () => {
    if (turnSubmittingRef.current) return
    turnSubmittingRef.current = true
    setTurnSubmitting(true)
    setActionError(null)
    try {
      await mutateSubmit({
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
  }, [advance, currentIndex, mutateSubmit, questions])

  const openCancelConfirm = useCallback(() => {
    modals.openConfirmModal({
      title: 'Hủy phiên phỏng vấn?',
      children: (
        <Text size="sm">
          Phiên phỏng vấn sẽ bị hủy và không tạo báo cáo đánh giá. Bạn có chắc
          muốn tiếp tục?
        </Text>
      ),
      labels: { confirm: 'Hủy phiên', cancel: 'Quay lại' },
      confirmProps: { color: 'danger' },
      onConfirm: () => void updateSessionStatus('canceled'),
    })
  }, [updateSessionStatus])

  const openEarlyFinishConfirm = useCallback(() => {
    modals.openConfirmModal({
      title: 'Kết thúc sớm phiên phỏng vấn?',
      children: (
        <Text size="sm">
          Các câu hỏi chưa trả lời sẽ được đánh dấu bỏ qua và hệ thống sẽ bắt
          đầu chấm điểm để tạo báo cáo.
        </Text>
      ),
      labels: { confirm: 'Kết thúc & Chấm điểm', cancel: 'Tiếp tục phỏng vấn' },
      confirmProps: { color: 'brand' },
      onConfirm: async () => {
        clearAllDrafts()
        setIsCompleting(true)
        await mutateStatus({
          status: 'completed',
          autoSkipUnanswered: true,
          remainingSeconds: remainingSecondsRef.current,
        })
        router.replace(`/sessions/${sessionId}/report`)
      },
    })
  }, [clearAllDrafts, mutateStatus, remainingSecondsRef, router, sessionId])

  return {
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
  }
}
