'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '@/lib/form-errors'
import { queryKeys } from '@/queries/keys'
import { prepService } from '@/services/prep.service'
import { sessionService } from '@/services/session.service'
import type {
  ContextPack,
  InterviewDuration,
  InterviewOptionsCatalog,
  JdFormData,
  SessionType,
} from '@/types'
import {
  buildCreateSessionPayload,
  toSavedJobDescriptionPayload,
} from './setup-mappers'

export interface UseSetupSessionSubmitParams {
  activeJd: JdFormData
  sessionType: SessionType
  contextPack: ContextPack
  duration: InterviewDuration
  catalog?: InterviewOptionsCatalog
  onSubmitted: () => void
}

export function useSetupSessionSubmit({
  activeJd,
  sessionType,
  contextPack,
  duration,
  catalog,
  onSubmitted,
}: UseSetupSessionSubmitParams) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const selectedDuration = catalog?.durations.find((d) => d.value === duration)
  const numQuestions = selectedDuration?.numQuestions
  const canSubmit = Boolean(catalog && numQuestions !== undefined)

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!catalog || numQuestions === undefined) {
        throw new Error('Danh mục cấu hình chưa sẵn sàng. Vui lòng thử lại.')
      }
      const savedJd = await prepService.saveJobDescription(
        toSavedJobDescriptionPayload(activeJd, catalog.jdLevels)
      )
      void queryClient.invalidateQueries({
        queryKey: queryKeys.prep.savedJds(),
      })
      return sessionService.createSession(
        buildCreateSessionPayload({
          jd: activeJd,
          sessionType,
          contextPack,
          numQuestions,
          savedJobDescriptionId: savedJd.id,
          jdLevels: catalog.jdLevels,
        })
      )
    },
    onSuccess: (created) => {
      onSubmitted()
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all })
      router.push(`/sessions/${created.id}`)
    },
    onError: (err) => {
      const message = getErrorMessage(err, 'Không thể tạo phiên phỏng vấn')
      setError(message)
      notifications.show({
        title: 'Không thể tạo phiên phỏng vấn',
        message,
        color: 'danger',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
    },
  })

  const submitting =
    createSessionMutation.isPending || createSessionMutation.isSuccess

  function submit() {
    if (submitting || !canSubmit) return
    setError(null)
    createSessionMutation.mutate()
  }

  return { error, submitting, canSubmit, submit }
}
