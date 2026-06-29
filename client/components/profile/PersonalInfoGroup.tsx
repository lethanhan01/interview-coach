'use client'

import { useState } from 'react'
import { PencilLine } from 'lucide-react'
import Button from '@/components/ui/Button'
import ProfileSection from './ProfileSection'
import ProfileField from './ProfileField'

interface PersonalInfoData {
  fullName?: string
}

interface Props {
  data: PersonalInfoData
  onSave: (data: PersonalInfoData) => Promise<void>
}

const FIELD_CLASS =
  'w-full rounded-xl border border-border px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none'

export default function PersonalInfoGroup({ data, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<PersonalInfoData>(data)
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

  function set(field: keyof PersonalInfoData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <ProfileSection
      title="Thông tin cá nhân"
      action={!isEditing ? (
        <Button variant="ghost" size="sm" onClick={handleEdit}>
          <PencilLine className="h-4 w-4" aria-hidden="true" />
          Chỉnh sửa
        </Button>
      ) : undefined}
    >
      {!isEditing ? (
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <ProfileField label="Họ và tên" value={data.fullName} />
        </dl>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Họ và tên">
              <input
                value={form.fullName ?? ''}
                onChange={(e) => set('fullName', e.target.value)}
                placeholder="Nguyễn Văn A"
                className={FIELD_CLASS}
              />
            </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  )
}
