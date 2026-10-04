'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/services'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField, FormLabel, FormControl } from '@/components/form/FormField'
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'request' | 'confirm'>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      await authService.requestPasswordReset({ email })
      setMessage('Mã xác thực đặt lại mật khẩu đã được gửi đến email của bạn.')
      setStep('confirm')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (newPassword.length < 12) {
      setError('Mật khẩu mới phải có ít nhất 12 ký tự.')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      await authService.confirmPasswordReset({
        email,
        code: code.trim(),
        newPassword,
      })
      router.replace('/sessions')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể đặt lại mật khẩu. Kiểm tra lại mã xác nhận hoặc email.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-raised flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="bg-surface shadow-card border-border w-full max-w-md rounded-2xl border p-8">
        <div className="mb-6 text-center">
          <div className="bg-brand-100 dark:bg-brand/20 text-brand mx-auto mb-3 flex size-12 items-center justify-center rounded-xl">
            {step === 'request' ? (
              <Mail className="size-6" />
            ) : (
              <KeyRound className="size-6" />
            )}
          </div>
          <h1 className="text-ink text-2xl font-bold">
            {step === 'request' ? 'Quên mật khẩu?' : 'Đặt lại mật khẩu'}
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            {step === 'request'
              ? 'Nhập email đã đăng ký để nhận mã xác thực đặt lại mật khẩu.'
              : `Nhập mã 6 số gửi tới ${email} và mật khẩu mới.`}
          </p>
        </div>

        {message && (
          <div className="bg-success-bg text-success border-success/20 mb-6 flex items-center gap-2 rounded-lg border p-3 text-sm" role="status">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="bg-danger-bg text-danger border-danger/20 mb-6 rounded-lg border p-3 text-center text-sm" role="alert">
            {error}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <FormField name="email" isRequired>
              <FormLabel>Địa chỉ Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>
            </FormField>

            <Button type="submit" loading={loading} disabled={loading} className="w-full">
              Gửi mã xác thực
            </Button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            <FormField name="email" isRequired>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>
            </FormField>

            <FormField name="code" isRequired>
              <FormLabel>Mã xác thực (6 số)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </FormControl>
            </FormField>

            <FormField name="newPassword" isRequired>
              <FormLabel>Mật khẩu mới (ít nhất 12 ký tự)</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  required
                  minLength={12}
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </FormControl>
            </FormField>

            <FormField name="confirmPassword" isRequired>
              <FormLabel>Xác nhận mật khẩu mới</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  required
                  minLength={12}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </FormControl>
            </FormField>

            <Button type="submit" loading={loading} disabled={loading} className="w-full">
              Xác nhận đổi mật khẩu
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep('request')
                setError(null)
                setMessage(null)
              }}
              className="w-full text-xs"
            >
              Gửi lại mã xác thực khác
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link
            href="/login"
            className="text-brand hover:text-brand-light inline-flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

