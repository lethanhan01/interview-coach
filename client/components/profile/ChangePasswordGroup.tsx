'use client'

import { useState } from 'react'
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import ProfileSection from './ProfileSection'
import Button from '@/components/ui/Button'
import { apiClient } from '@/lib/api-client'
import type { ChangePasswordResponse } from '@/lib/types'

const FIELD_CONTAINER_CLASS = 'flex flex-col gap-1.5'
const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 pr-10 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none disabled:opacity-50'

export default function ChangePasswordGroup() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.')
      return
    }

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.')
      return
    }

    if (newPassword === currentPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu hiện tại.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)
    try {
      await apiClient.post<ChangePasswordResponse>('/auth/change-password', {
        currentPassword,
        newPassword,
      })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Đổi mật khẩu không thành công.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProfileSection title="Đổi mật khẩu & Bảo mật">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg bg-success-subtle p-3 text-sm text-success"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Đổi mật khẩu thành công!</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-danger-subtle p-3 text-sm text-danger"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className={FIELD_CONTAINER_CLASS}>
          <label
            htmlFor="current-password"
            className="text-ink text-sm font-medium"
          >
            Mật khẩu hiện tại
          </label>
          <div className="relative">
            <input
              id="current-password"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className={INPUT_CLASS}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="text-ink-muted hover:text-ink absolute right-3 top-1/2 -translate-y-1/2 text-sm focus:outline-none"
              aria-label={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={FIELD_CONTAINER_CLASS}>
            <label
              htmlFor="new-password"
              className="text-ink text-sm font-medium"
            >
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                disabled={loading}
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="text-ink-muted hover:text-ink absolute right-3 top-1/2 -translate-y-1/2 text-sm focus:outline-none"
                aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className={FIELD_CONTAINER_CLASS}>
            <label
              htmlFor="confirm-password"
              className="text-ink text-sm font-medium"
            >
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                disabled={loading}
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-ink-muted hover:text-ink absolute right-3 top-1/2 -translate-y-1/2 text-sm focus:outline-none"
                aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <KeyRound className="h-4 w-4" />
            Cập nhật mật khẩu
          </Button>
        </div>
      </form>
    </ProfileSection>
  )
}
