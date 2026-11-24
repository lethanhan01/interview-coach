'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import LoginForm, { type LoginFormData } from '@/components/auth/LoginForm'
import { applyAuthenticatedSession } from '@/lib/auth-context'
import { getSafeNext } from '@/lib/auth-redirect'
import { extractApiFieldErrors, getErrorMessage } from '@/lib/form-errors'
import { authService } from '@/services/auth.service'

const LOGIN_FIELDS = ['email', 'password'] as const

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const rawNext = searchParams.get('next')
  const safeNext = useMemo(() => getSafeNext(rawNext), [rawNext])

  const inactiveMessage =
    searchParams.get('error') === 'account_inactive'
      ? 'Tài khoản của bạn đã bị khóa hoặc xóa. Vui lòng liên hệ quản trị viên.'
      : null

  const sessionExpiredMessage =
    searchParams.get('reason') === 'session_expired'
      ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      : null

  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<
    Record<keyof LoginFormData, string>
  > | null>(null)

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => authService.login(data),
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)
    setFieldErrors(null)

    try {
      const user = await loginMutation.mutateAsync(data)
      applyAuthenticatedSession(queryClient, user)

      if (!rawNext || !rawNext.startsWith('/')) {
        router.replace(user.role === 'admin' ? '/admin/dashboard' : '/sessions')
      } else {
        router.replace(safeNext)
      }
    } catch (err) {
      setFieldErrors(
        extractApiFieldErrors(err, {
          allowedFields: LOGIN_FIELDS,
        })
      )
      setServerError(getErrorMessage(err, 'Không thể đăng nhập'))
    }
  }

  return (
    <LoginForm
      onSubmit={onSubmit}
      loading={loginMutation.isPending}
      inactiveMessage={inactiveMessage}
      sessionExpiredMessage={sessionExpiredMessage}
      serverError={serverError}
      fieldErrors={fieldErrors}
    />
  )
}
