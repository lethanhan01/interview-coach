'use client'

import { useState } from 'react'
import { PencilLine } from 'lucide-react'
import Button from '@/components/ui/Button'
import ProfileSection from './ProfileSection'
import ProfileField from './ProfileField'
import { GENDER_OPTIONS, NATIONALITY_OPTIONS } from './constants'

interface PersonalInfoData {
  fullName?: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  hometown?: string
  nationality?: string
}

interface Props {
  data: PersonalInfoData
  onSave: (data: PersonalInfoData) => Promise<void>
}

const GENDER_LABEL: Record<string, string> = Object.fromEntries(
  GENDER_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label]),
)
const NATIONALITY_LABEL: Record<string, string> = Object.fromEntries(
  NATIONALITY_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label]),
)
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

  const displayBirth = data.dateOfBirth
    ? new Date(data.dateOfBirth).toLocaleDateString('vi-VN')
    : undefined

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
          <ProfileField label="Ngày sinh" value={displayBirth} />
          <ProfileField label="Giới tính" value={data.gender ? GENDER_LABEL[data.gender] : undefined} />
          <ProfileField label="Số điện thoại" value={data.phone} />
          <ProfileField label="Quê quán" value={data.hometown} />
          <ProfileField label="Quốc tịch" value={data.nationality ? NATIONALITY_LABEL[data.nationality] : undefined} />
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
            <Field label="Ngày sinh">
              <input
                type="date"
                value={form.dateOfBirth ?? ''}
                onChange={(e) => set('dateOfBirth', e.target.value)}
                className={FIELD_CLASS}
              />
            </Field>
            <Field label="Giới tính">
              <select
                value={form.gender ?? ''}
                onChange={(e) => set('gender', e.target.value)}
                className={FIELD_CLASS}
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Số điện thoại">
              <input
                value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="0901234567"
                className={FIELD_CLASS}
              />
            </Field>
            <Field label="Quê quán">
              <input
                value={form.hometown ?? ''}
                onChange={(e) => set('hometown', e.target.value)}
                placeholder="Hà Nội"
                className={FIELD_CLASS}
              />
            </Field>
            <Field label="Quốc tịch">
              <select
                value={form.nationality ?? ''}
                onChange={(e) => set('nationality', e.target.value)}
                className={FIELD_CLASS}
              >
                {NATIONALITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
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
