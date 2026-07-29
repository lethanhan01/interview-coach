'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSafeNext } from '@/lib/auth-redirect'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = useMemo(() => getSafeNext(searchParams.get('next')), [searchParams])
  const inactiveMessage = searchParams.get('error') === 'account_inactive'
    ? 'Tài khoản của bạn đã bị khóa hoặc xóa. Vui lòng liên hệ quản trị viên.'
    : null
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setMessage(null)
    const supabase = getSupabaseBrowserClient()
    const result = isSignup
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/callback?next=${encodeURIComponent(next)}` } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) setMessage(result.error.message)
    else if (isSignup) setMessage('Đăng ký thành công. Hãy kiểm tra email để xác thực.')
    else router.replace(next)
    setLoading(false)
  }
  const google = async () => {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/callback?next=${encodeURIComponent(next)}` } })
    if (error) setMessage(error.message)
  }
  return <form onSubmit={submit} className="mx-auto mt-16 max-w-md space-y-4 rounded-xl bg-surface p-6 shadow-card">
    <h1 className="text-xl font-semibold">{isSignup ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
    <label className="block text-sm">Email<input aria-label="Email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border p-2" /></label>
    <label className="block text-sm">Mật khẩu<input aria-label="Mật khẩu" required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded border p-2" /></label>
    {(inactiveMessage || message) && <p role="alert" className="text-sm text-danger">{inactiveMessage ?? message}</p>}
    <button disabled={loading} className="w-full rounded bg-brand px-4 py-2 text-white">{loading ? 'Đang xử lý…' : isSignup ? 'Đăng ký' : 'Đăng nhập'}</button>
    <button type="button" onClick={google} className="w-full rounded border px-4 py-2">Tiếp tục với Google</button>
    <button type="button" onClick={() => { setIsSignup(!isSignup); setMessage(null) }} className="text-sm text-brand underline">{isSignup ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button>
  </form>
}
