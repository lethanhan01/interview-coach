'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import Button from '@/components/ui/Button'

interface GetProfileResponse {
  email: string
  profile: {
    targetPosition?: string
    targetLevel?: string
    preferredTechStack?: string
  } | null
}

export default function ProfilePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [targetRole, setTargetRole] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [techStackRaw, setTechStackRaw] = useState('')

  useEffect(() => {
    apiClient
      .get<GetProfileResponse>('/profile')
      .then((data) => {
        setEmail(data.email)
        setTargetRole(data.profile?.targetPosition ?? '')
        setExperienceLevel(data.profile?.targetLevel ?? '')
        setTechStackRaw(data.profile?.preferredTechStack ?? '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await apiClient.patch('/profile', {
        targetPosition: targetRole.trim() || undefined,
        targetLevel: experienceLevel.trim() || undefined,
        preferredTechStack: techStackRaw.trim() || undefined,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-ink">Hồ sơ</h1>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4 border-b border-border pb-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-100">
              <span className="text-lg font-bold text-brand">{(email[0] ?? 'U').toUpperCase()}</span>
            </div>
            <p className="text-sm font-medium text-ink">{email}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Vị trí mục tiêu</label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Frontend Developer"
              className="w-full rounded-xl border border-border px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Kinh nghiệm</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full rounded-xl border border-border px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none"
            >
              <option value="">Chọn mức kinh nghiệm</option>
              <option value="fresher">Fresher (0–6 tháng)</option>
              <option value="junior">Junior (6–12 tháng)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Tech stack (cách nhau bởi dấu phẩy)
            </label>
            <input
              value={techStackRaw}
              onChange={(e) => setTechStackRaw(e.target.value)}
              placeholder="React, TypeScript, Node.js"
              className="w-full rounded-xl border border-border px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {saved && <p className="text-sm text-success">Đã lưu thành công.</p>}

          <div className="border-t border-border pt-2">
            <Button onClick={handleSave} disabled={saving} loading={saving} className="self-end">
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
