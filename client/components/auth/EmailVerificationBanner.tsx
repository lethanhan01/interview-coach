'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export default function EmailVerificationBanner() {
  const { user } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  if (!user || user.email_confirmed_at) return null
  const resend = async () => {
    const client = getSupabaseBrowserClient()
    if (!client || !user.email) return
    const { error } = await client.auth.resend({ type: 'signup', email: user.email })
    setMessage(error ? error.message : 'Đã gửi lại email xác thực.')
  }
  return <div className="mb-5 rounded-lg border border-warning bg-warning-bg p-3 text-sm text-ink">
    Email của bạn chưa được xác thực; lịch sử và báo cáo phỏng vấn đang bị khóa.
    <button type="button" onClick={resend} className="ml-2 font-semibold text-brand underline">Gửi lại email</button>
    {message && <span className="ml-2">{message}</span>}
  </div>
}
