'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const [loading, setLoading] = useState(false)
  const { refresh } = useAuth()

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setServerError(null)

    try {
      await authService.login(data)
      const role = await refresh()
      const rawNext = searchParams.get('next')
      if (!rawNext || !rawNext.startsWith('/')) {
        router.replace(role === 'admin' ? '/admin/dashboard' : '/sessions')
      } else {
        router.replace(next)
      }
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Không thể đăng nhập'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginForm
      onSubmit={onSubmit}
      loading={loading}
      inactiveMessage={inactiveMessage}
      serverError={serverError}
    />
  )
}

