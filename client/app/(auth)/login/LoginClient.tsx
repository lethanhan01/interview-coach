'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { getSafeNext } from '@/lib/auth-redirect'
import { useAuth } from '@/hooks/useAuth'
import LoginForm, { type LoginFormData } from '@/components/auth/LoginForm'
import { authService } from '@/services'

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = useMemo(
    () => getSafeNext(searchParams.get('next')),
    [searchParams]
  )
  const inactiveMessage =
    searchParams.get('error') === 'account_inactive'
      ? 'Tài khoản của bạn đã bị khóa hoặc xóa. Vui lòng liên hệ quản trị viên.'
      : null

  const [serverError, setServerError] = useState<string | null>(null)
  const { refresh } = useAuth()

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      await authService.login(data)
      return refresh()
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)

    try {
      const role = await loginMutation.mutateAsync(data)
      const rawNext = searchParams.get('next')
      if (!rawNext || !rawNext.startsWith('/')) {
        router.replace(role === 'admin' ? '/admin/dashboard' : '/sessions')
      } else {
        router.replace(next)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Không thể đăng nhập')
    }
  }

  return (
    <LoginForm
      onSubmit={onSubmit}
      loading={loginMutation.isPending}
      inactiveMessage={inactiveMessage}
      serverError={serverError}
    />
  )
}
