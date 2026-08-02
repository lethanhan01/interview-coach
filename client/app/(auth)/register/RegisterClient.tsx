'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RegisterForm, { type RegisterFormData } from '@/components/auth/RegisterForm'

export default function RegisterClient() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setServerError(null)
    
    try {
      const { fullName, email, password } = data
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'}/auth/register`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName }),
        }
      )
      
      const result = await response.json().catch(() => null)
      
      if (!response.ok) {
        setServerError(result?.message ?? 'Không thể tạo tài khoản')
      } else {
        router.push('/onboarding')
      }
    } catch {
      setServerError('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.')
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
