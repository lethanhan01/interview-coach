'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import {
  TARGET_POSITION_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  TECH_STACK_OPTIONS,
} from './constants'

interface CareerInfoData {
  targetPosition?: string
  targetRoleCategory?: string
  targetLevel?: string
  preferredTechStack?: string
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

  const selectedTech = new Set(
    (form.preferredTechStack ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  )

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

  function toggleTech(tech: string) {
    const next = new Set(selectedTech)
    if (next.has(tech)) {
      next.delete(tech)
    } else {
      next.add(tech)
    }
    setForm((prev) => ({ ...prev, preferredTechStack: Array.from(next).join(', ') }))
  }

  const displayTech = (data.preferredTechStack ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

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
          <div>
            <dt className="text-xs font-medium text-ink-muted">Tech stack</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {displayTech.length > 0 ? (
                displayTech.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand"
                  >
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-sm text-ink">—</span>
              )}
            </dd>
          </div>
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

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">Tech stack</label>
            <div className="flex flex-col gap-3">
              {Object.entries(TECH_STACK_OPTIONS).map(([group, techs]) => (
                <div key={group}>
                  <p className="mb-1.5 text-xs font-medium text-ink-muted">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {techs.map((tech) => {
                      const active = selectedTech.has(tech)
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => toggleTech(tech)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            active
                              ? 'border-brand bg-brand text-white'
                              : 'border-border bg-surface text-ink hover:border-brand hover:text-brand'
                          }`}
                        >
                          {tech}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
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
