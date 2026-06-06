'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEmailAuth() {
    setError(null)
    setLoading(true)
    try {
      const { error } =
        mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-gray-900">InterviewAI</h1>
        <p className="mb-6 text-sm text-gray-500">Luyện phỏng vấn với AI — miễn phí</p>

        <div className="space-y-3">
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Mật khẩu</label>
            <input
              id="password"
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600">{error}</p>
          )}

          <button
            onClick={handleEmailAuth}
            disabled={loading || !email || !password}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading && <LoadingSpinner size="sm" />}
            {loading ? 'Đang xử lý...' : mode === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          {mode === 'signin' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
            className="font-medium text-black underline"
          >
            {mode === 'signin' ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </p>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">hoặc</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Đăng nhập với Google
        </button>
      </div>
    </main>
  )
}
