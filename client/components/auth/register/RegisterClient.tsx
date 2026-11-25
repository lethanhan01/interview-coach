'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import RegisterForm, { type RegisterFormData } from './RegisterForm'
import { applyAuthenticatedSession } from '@/providers/AuthProvider'
import { extractApiFieldErrors, getErrorMessage } from '@/lib/form-errors'
import { authService } from '@/services/auth.service'

const REGISTER_FIELDS = ['lastname', 'firstname', 'email', 'password'] as const

export default function RegisterClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<
    Record<keyof RegisterFormData, string>
  > | null>(null)

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => {
      const { email, password, firstname, lastname } = data
      return authService.register({ email, password, firstname, lastname })
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null)
    setFieldErrors(null)

    try {
      const user = await registerMutation.mutateAsync(data)
      applyAuthenticatedSession(queryClient, user)
      notifications.show({
        title: 'Đăng ký thành công',
        message: 'Chào mừng bạn đến với Intervia!',
        color: 'success',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
      router.replace('/sessions')
    } catch (err) {
      setFieldErrors(
        extractApiFieldErrors(err, {
          allowedFields: REGISTER_FIELDS,
          codeToField: {
            EMAIL_ALREADY_EXISTS: 'email',
            AUTH_EMAIL_EXISTS: 'email',
          },
        })
      )
      setServerError(getErrorMessage(err, 'Không thể tạo tài khoản'))
    }
  }

  return (
    <RegisterForm
      onSubmit={onSubmit}
      loading={registerMutation.isPending}
      serverError={serverError}
      fieldErrors={fieldErrors}
    />
  )
}
