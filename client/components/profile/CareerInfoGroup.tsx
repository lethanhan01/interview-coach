'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
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
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Định hướng nghề nghiệp</h2>
        {!isEditing && (
          <Button variant="ghost" onClick={handleEdit} className="text-sm">
            Chỉnh sửa
          </Button>
        )}
      </div>

      {!isEditing ? (
        <dl className="flex flex-col gap-3 text-sm">
          <ReadField
            label="Vị trí mục tiêu"
            value={data.targetPosition ? TARGET_POSITION_LABEL[data.targetPosition] : undefined}
          />
          <ReadField
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
    </div>
  )
}

function ReadField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value || '—'}</dd>
    </div>
  )
}
