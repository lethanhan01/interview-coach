'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ProfileData {
  email: string
  targetRole: string
  experienceLevel: string
  techStack: string[]
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [targetRole, setTargetRole] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [techStackRaw, setTechStackRaw] = useState('')

  useEffect(() => {
    apiClient
      .get<ProfileData>('/profile')
      .then((data) => {
        setProfile(data)
        setTargetRole(data.targetRole ?? '')
        setExperienceLevel(data.experienceLevel ?? '')
        setTechStackRaw((data.techStack ?? []).join(', '))
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
        targetRole: targetRole.trim(),
        experienceLevel: experienceLevel.trim(),
        techStack: techStackRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
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
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Hồ sơ</h1>

      <div className="flex flex-col gap-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <p className="text-sm text-gray-500">{profile?.email}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Vị trí mục tiêu</label>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Frontend Developer"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Kinh nghiệm</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          >
            <option value="">Chọn mức kinh nghiệm</option>
            <option value="fresher">Fresher (0–6 tháng)</option>
            <option value="junior">Junior (6–12 tháng)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tech stack (cách nhau bởi dấu phẩy)
          </label>
          <input
            value={techStackRaw}
            onChange={(e) => setTechStackRaw(e.target.value)}
            placeholder="React, TypeScript, Node.js"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Đã lưu thành công.</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 self-end rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving && <LoadingSpinner size="sm" />}
          Lưu
        </button>
      </div>
    </div>
  )
}
