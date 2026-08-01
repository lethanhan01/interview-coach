'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterForm() {
  const router = useRouter()
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.')
      setLoading(false)
      return
    }

    if (password.length < 12) {
      setError('Mật khẩu phải có ít nhất 12 ký tự.')
      setLoading(false)
      return
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'}/auth/register`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setError(result?.message ?? 'Không thể tạo tài khoản')
    } else {
      router.push('/onboarding')
    }
    
    setLoading(false)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 bg-surface-raised">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-card border border-border">
        <h1 className="text-2xl font-bold text-ink text-center mb-2">Tạo tài khoản</h1>
        <p className="text-sm text-ink-muted text-center mb-8">Bắt đầu hành trình nâng cao kỹ năng phỏng vấn của bạn</p>

        {error && (
          <div className="mb-6 rounded-lg bg-danger-bg p-3 text-sm text-danger border border-danger/20 text-center" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Họ và Tên"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ví dụ: Nguyễn Văn A"
          />

          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Địa chỉ email của bạn"
          />

          <Input
            label="Mật khẩu"
            type="password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ít nhất 12 ký tự"
          />

          <Input
            label="Xác nhận Mật khẩu"
            type="password"
            required
            minLength={12}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full mt-6">
          Đăng ký
        </Button>

        <div className="mt-6 text-center text-sm text-ink-muted">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-medium text-brand hover:text-brand-light transition-colors">
            Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  )
}
