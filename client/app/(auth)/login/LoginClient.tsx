'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSafeNext } from '@/lib/auth-redirect'
import { useAuth } from '@/hooks/useAuth'
import LoginForm, { type LoginFormData } from '@/components/auth/LoginForm'

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'}/auth/login`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )
      
      const result = await response.json().catch(() => null)
      
      if (!response.ok) {
        setServerError(result?.message ?? 'Không thể đăng nhập')
      } else {
        const role = await refresh()
        const rawNext = searchParams.get('next')
        if (!rawNext || !rawNext.startsWith('/')) {
          router.replace(role === 'admin' ? '/admin-dashboard' : '/sessions')
        } else {
          router.replace(next)
        }
      }
    } catch {
      setServerError('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.')
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
