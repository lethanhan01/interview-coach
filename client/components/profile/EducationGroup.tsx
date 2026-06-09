'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { EDUCATION_DEGREE_OPTIONS } from './constants'
import type { EducationEntry } from '@/lib/types'

interface Props {
  data: EducationEntry | undefined
  onSave: (data: EducationEntry) => Promise<void>
}

const DEGREE_LABEL: Record<string, string> = Object.fromEntries(
  EDUCATION_DEGREE_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label]),
)

const EMPTY: EducationEntry = {
  degree: '',
  school: '',
  major: '',
  gpa: '',
  graduationYear: '',
}

const FIELD_CLASS =
  'w-full rounded-xl border border-border px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none'

export default function EducationGroup({ data, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<EducationEntry>(data ?? EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setForm(data ?? EMPTY)
    setError(null)
    setIsEditing(true)
  }

  function handleCancel() {
    setForm(data ?? EMPTY)
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

  function set(field: keyof EducationEntry, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Trình độ học vấn</h2>
        {!isEditing && (
          <Button variant="ghost" onClick={handleEdit} className="text-sm">
            Chỉnh sửa
          </Button>
        )}
      </div>

      {!isEditing ? (
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <ReadField
            label="Trình độ"
            value={data?.degree ? DEGREE_LABEL[data.degree] : undefined}
          />
          <ReadField label="Trường" value={data?.school} />
          <ReadField label="Ngành học" value={data?.major} />
          <ReadField label="GPA / CPA" value={data?.gpa} />
          <ReadField label="Năm tốt nghiệp" value={data?.graduationYear} />
        </dl>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Trình độ">
              <select
                value={form.degree}
                onChange={(e) => set('degree', e.target.value)}
                className={FIELD_CLASS}
              >
                {EDUCATION_DEGREE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Năm tốt nghiệp">
              <input
                value={form.graduationYear}
                onChange={(e) => set('graduationYear', e.target.value)}
                placeholder="2024"
                maxLength={4}
                className={FIELD_CLASS}
              />
            </Field>
            <Field label="Trường" className="sm:col-span-2">
              <input
                value={form.school}
                onChange={(e) => set('school', e.target.value)}
                placeholder="Đại học Bách Khoa Hà Nội"
                className={FIELD_CLASS}
              />
            </Field>
            <Field label="Ngành học" className="sm:col-span-2">
              <input
                value={form.major}
                onChange={(e) => set('major', e.target.value)}
                placeholder="Công nghệ thông tin"
                className={FIELD_CLASS}
              />
            </Field>
            <Field label="GPA / CPA">
              <input
                value={form.gpa}
                onChange={(e) => set('gpa', e.target.value)}
                placeholder="3.2 / 4.0"
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

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  )
}
