'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSafeNext } from '@/lib/auth-redirect'
import { useAuth } from '@/hooks/useAuth'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = useMemo(() => getSafeNext(searchParams.get('next')), [searchParams])
  const inactiveMessage = searchParams.get('error') === 'account_inactive'
    ? 'Tài khoản của bạn đã bị khóa hoặc xóa. Vui lòng liên hệ quản trị viên.'
    : null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { refresh } = useAuth()
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setMessage(null)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'}/auth/login`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setMessage(result?.message ?? 'Không thể đăng nhập')
    } else {
      const role = await refresh()
      const rawNext = searchParams.get('next')
      // If user had no explicit valid next parameter, redirect based on role
      if (!rawNext || !rawNext.startsWith('/')) {
        router.replace(role === 'admin' ? '/admin-dashboard' : '/sessions')
      } else {
        router.replace(next)
      }
    }
    setLoading(false)
  }
  return <form onSubmit={submit} className="mx-auto mt-16 max-w-md space-y-4 rounded-xl bg-surface p-6 shadow-card">
    <h1 className="text-xl font-semibold">Đăng nhập</h1>
    <label className="block text-sm">Email<input aria-label="Email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border p-2" /></label>
    <label className="block text-sm">Mật khẩu<input aria-label="Mật khẩu" required minLength={12} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded border p-2" /></label>
    {(inactiveMessage || message) && <p role="alert" className="text-sm text-danger">{inactiveMessage ?? message}</p>}
    <button disabled={loading} className="w-full rounded bg-brand px-4 py-2 text-white">{loading ? 'Đang xử lý…' : 'Đăng nhập'}</button>
    <a href="/register" className="text-sm text-brand underline">Chưa có tài khoản? Đăng ký</a>
  </form>
}
