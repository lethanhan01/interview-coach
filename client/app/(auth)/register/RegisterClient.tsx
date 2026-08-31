'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import RegisterForm, { type RegisterFormData } from '@/components/auth/RegisterForm'
import { authService } from '@/services'

export default function RegisterClient() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setServerError(null)

    try {
      const { email, password, firstname, lastname } = data
      await authService.register({ email, password, firstname, lastname })
      await refresh()
      router.replace('/sessions')
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Không thể tạo tài khoản'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <RegisterForm
      onSubmit={onSubmit}
      loading={loading}
      serverError={serverError}
    />
  )
}

