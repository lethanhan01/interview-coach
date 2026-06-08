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
    <main className="flex min-h-screen items-center justify-center bg-surface-raised px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand">InterviewAI</h1>
          <p className="text-sm text-ink-muted mt-1">Nền tảng luyện phỏng vấn cho sinh viên IT</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-card border border-border p-8">
          <h2 className="text-xl font-semibold text-ink mb-1">
            {mode === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          <p className="text-sm text-ink-muted mb-6">Luyện phỏng vấn với AI — miễn phí</p>

          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand"
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
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs text-danger">{error}</p>
            )}

            <button
              onClick={handleEmailAuth}
              disabled={loading || !email || !password}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-btn hover:bg-brand-light hover:shadow-glow transition-all duration-150 hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Đang xử lý...' : mode === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-ink-muted">
            {mode === 'signin' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
              className="font-medium text-brand hover:text-brand-light transition-colors"
            >
              {mode === 'signin' ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </p>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-ink-faint">hoặc</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors"
          >
            Đăng nhập với Google
          </button>
        </div>
      </div>
    </main>
  )
}
