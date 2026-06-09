'use client'

import { useState } from 'react'
import { PencilLine } from 'lucide-react'
import Button from '@/components/ui/Button'
import { PERSONALITY_OPTIONS } from './constants'

interface Props {
  data: { personality?: string | null }
  onSave: (patch: Record<string, unknown>) => Promise<void>
}

export default function PersonalityGroup({ data, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ personality: data.personality ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setForm({ personality: data.personality ?? '' })
    setIsEditing(true)
    setError(null)
  }

  function handleCancel() {
    setIsEditing(false)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave({ personality: form.personality || null })
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const personalityLabel = PERSONALITY_OPTIONS.find(o => o.value === data.personality)?.label

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Tính cách</h2>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <PencilLine className="h-4 w-4" aria-hidden="true" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-3">
          <select
            value={form.personality}
            onChange={e => setForm({ personality: e.target.value })}
            className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          >
            {PERSONALITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>Lưu</Button>
            <Button variant="secondary" size="sm" onClick={handleCancel}>Hủy</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">
          {personalityLabel ?? <span className="italic text-ink-muted/60">Chưa cập nhật</span>}
        </p>
      )}
    </div>
  )
}
