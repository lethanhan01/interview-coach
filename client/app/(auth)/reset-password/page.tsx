'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(
    () => setToken(new URLSearchParams(window.location.search).get('token')),
    []
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    const path = token
      ? '/auth/password-reset/confirm'
      : '/auth/password-reset/request'
    const body = token ? { token, newPassword: password } : { email }
    const response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      setMessage(
        'Không thể xử lý yêu cầu. Kiểm tra lại thông tin hoặc thử lại.'
      )
      return
    }
    if (token) router.replace('/sessions')
    else setMessage('Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.')
  }

  return (
    <form
      onSubmit={submit}
      className="bg-surface shadow-card mx-auto mt-16 max-w-md space-y-4 rounded-xl p-6"
    >
      <h1 className="text-xl font-semibold">
        {token ? 'Đặt lại mật khẩu' : 'Khôi phục mật khẩu'}
      </h1>
      {token ? (
        <label className="block text-sm">
          Mật khẩu mới
          <input
            required
            minLength={12}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </label>
      ) : (
        <label className="block text-sm">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </label>
      )}
      {message && (
        <p role="alert" className="text-sm">
          {message}
        </p>
      )}
      <button className="bg-brand w-full rounded px-4 py-2 text-white">
        Tiếp tục
      </button>
    </form>
  )
}
