'use client'

import { useState } from 'react'
import { PencilLine } from 'lucide-react'
import Button from '@/components/ui/Button'
import ProfileSection from './ProfileSection'
import ProfileField from './ProfileField'
import {
  TARGET_POSITION_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
} from './constants'

interface CareerInfoData {
  targetPosition?: string
  targetRoleCategory?: string
  targetLevel?: string
}

interface Props {
  data: CareerInfoData
  onSave: (data: CareerInfoData) => Promise<void>
}

const TARGET_POSITION_LABEL: Record<string, string> = Object.fromEntries(
  TARGET_POSITION_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label]),
)
const EXPERIENCE_LABEL: Record<string, string> = Object.fromEntries(
  EXPERIENCE_LEVEL_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label]),
)

const FIELD_CLASS =
  'w-full rounded-xl border border-border px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none'

export default function CareerInfoGroup({ data, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<CareerInfoData>(data)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setForm(data)
    setError(null)
    setIsEditing(true)
  }

  function handleCancel() {
    setForm(data)
    setError(null)
    setIsEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  function set(field: keyof CareerInfoData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <ProfileSection
      title="Định hướng nghề nghiệp"
      action={!isEditing ? (
        <Button variant="ghost" size="sm" onClick={handleEdit}>
          <PencilLine className="h-4 w-4" aria-hidden="true" />
          Chỉnh sửa
        </Button>
      ) : undefined}
    >
      {!isEditing ? (
        <dl className="flex flex-col gap-3 text-sm">
          <ProfileField
            label="Vị trí mục tiêu"
            value={data.targetPosition ? TARGET_POSITION_LABEL[data.targetPosition] : undefined}
          />
          <ProfileField
            label="Mức kinh nghiệm"
            value={data.targetLevel ? EXPERIENCE_LABEL[data.targetLevel] : undefined}
          />
        </dl>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Vị trí mục tiêu</label>
            <select
              value={form.targetPosition ?? ''}
              onChange={(e) => set('targetPosition', e.target.value)}
              className={FIELD_CLASS}
            >
              {TARGET_POSITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mức kinh nghiệm</label>
            <select
              value={form.targetLevel ?? ''}
              onChange={(e) => set('targetLevel', e.target.value)}
              className={FIELD_CLASS}
            >
              {EXPERIENCE_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSave} loading={saving} disabled={saving}>
              Lưu thay đổi
            </Button>
            <Button variant="ghost" onClick={handleCancel} disabled={saving}>
              Hủy
            </Button>
          </div>
        </div>
      )}
    </ProfileSection>
  )
}
