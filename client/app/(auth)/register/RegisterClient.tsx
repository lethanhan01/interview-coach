'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import RegisterForm, {
  type RegisterFormData,
} from '@/components/auth/RegisterForm'
import { authService } from '@/services'

export default function RegisterClient() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { email, password, firstname, lastname } = data
      await authService.register({ email, password, firstname, lastname })
      await refresh()
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null)

    try {
      await registerMutation.mutateAsync(data)
      router.replace('/sessions')
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Không thể tạo tài khoản'
      )
    }
  }

  return (
    <RegisterForm
      onSubmit={onSubmit}
      loading={registerMutation.isPending}
      serverError={serverError}
    />
  )
}
