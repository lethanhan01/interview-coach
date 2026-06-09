'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { WorkExperienceEntry, TechnicalSkillEntry } from '@/lib/types'

interface Props {
  data: WorkExperienceEntry[] | undefined
  availableTechs: TechnicalSkillEntry[]
  onSave: (data: WorkExperienceEntry[]) => Promise<void>
}

const EMPTY_ENTRY: Omit<WorkExperienceEntry, 'id'> = {
  company: '',
  position: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
  techStack: [],
}

const FIELD_CLASS =
  'w-full rounded-xl border border-border px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none'

function newEntry(): WorkExperienceEntry {
  return { ...EMPTY_ENTRY, id: crypto.randomUUID(), techStack: [] }
}

export default function WorkExperienceGroup({ data, availableTechs, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<WorkExperienceEntry[]>(data ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setForm(data ?? [])
    setError(null)
    setIsEditing(true)
  }

  function handleCancel() {
    setForm(data ?? [])
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

  function setEntry(id: string, field: keyof WorkExperienceEntry, value: string | boolean) {
    setForm((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    )
  }

  function toggleEntryTech(entryId: string, techName: string) {
    setForm((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e
        const stack = e.techStack ?? []
        return {
          ...e,
          techStack: stack.includes(techName)
            ? stack.filter((t) => t !== techName)
            : [...stack, techName],
        }
      }),
    )
  }

  function addEntry() {
    setForm((prev) => [...prev, newEntry()])
  }

  function removeEntry(id: string) {
    setForm((prev) => prev.filter((e) => e.id !== id))
  }

  const displayList = data ?? []

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Kinh nghiệm làm việc</h2>
        {!isEditing && (
          <Button variant="ghost" onClick={handleEdit} className="text-sm">
            Chỉnh sửa
          </Button>
        )}
      </div>

      {!isEditing ? (
        displayList.length === 0 ? (
          <p className="text-sm text-ink-muted">Chưa có thông tin</p>
        ) : (
          <div className="flex flex-col gap-4">
            {displayList.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold text-ink">{entry.position || '—'}</p>
                <p className="text-sm text-ink-muted">{entry.company || '—'}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {entry.startDate || '—'} →{' '}
                  {entry.isCurrent ? 'Hiện tại' : entry.endDate || '—'}
                </p>
                {entry.techStack && entry.techStack.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.techStack.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-canvas px-2 py-0.5 text-xs text-ink-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {entry.description && (
                  <p className="mt-2 text-sm text-ink">{entry.description}</p>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col gap-6">
          {form.map((entry, idx) => (
            <div key={entry.id} className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Vị trí #{idx + 1}</p>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="text-xs text-danger hover:underline"
                >
                  Xóa
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Công ty" className="sm:col-span-2">
                  <input
                    value={entry.company}
                    onChange={(e) => setEntry(entry.id, 'company', e.target.value)}
                    placeholder="Google Vietnam"
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field label="Vị trí" className="sm:col-span-2">
                  <input
                    value={entry.position}
                    onChange={(e) => setEntry(entry.id, 'position', e.target.value)}
                    placeholder="Frontend Developer"
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field label="Ngày bắt đầu">
                  <input
                    type="date"
                    value={entry.startDate}
                    onChange={(e) => setEntry(entry.id, 'startDate', e.target.value)}
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field label="Ngày kết thúc">
                  <input
                    type="date"
                    value={entry.endDate}
                    disabled={entry.isCurrent}
                    onChange={(e) => setEntry(entry.id, 'endDate', e.target.value)}
                    className={`${FIELD_CLASS} disabled:opacity-50`}
                  />
                </Field>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    id={`current-${entry.id}`}
                    checked={entry.isCurrent}
                    onChange={(e) => setEntry(entry.id, 'isCurrent', e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-brand"
                  />
                  <label
                    htmlFor={`current-${entry.id}`}
                    className="text-sm text-ink"
                  >
                    Đang làm việc tại đây
                  </label>
                </div>
                <Field label="Mô tả" className="sm:col-span-2">
                  <textarea
                    value={entry.description}
                    onChange={(e) => setEntry(entry.id, 'description', e.target.value)}
                    placeholder="Mô tả công việc, thành tích..."
                    rows={3}
                    className={FIELD_CLASS}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <p className="mb-1.5 text-sm font-medium text-ink">Tech stack</p>
                  {availableTechs.length === 0 ? (
                    <p className="text-xs italic text-ink-muted/60">
                      Thêm kỹ năng ở mục Kỹ năng chuyên môn trước
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {availableTechs.map((tech) => {
                        const selected = (entry.techStack ?? []).includes(tech.name)
                        return (
                          <button
                            key={tech.id}
                            type="button"
                            onClick={() => toggleEntryTech(entry.id, tech.name)}
                            className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                              selected
                                ? 'border-brand bg-brand/10 text-brand'
                                : 'border-border bg-canvas text-ink-muted hover:border-brand'
                            }`}
                          >
                            {tech.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Button variant="ghost" onClick={addEntry} className="self-start text-sm">
            + Thêm kinh nghiệm
          </Button>

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
