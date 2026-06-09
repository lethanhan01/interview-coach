'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { ProjectEntry, TechnicalSkillEntry } from '@/lib/types'

interface Props {
  data: ProjectEntry[] | undefined
  availableTechs: TechnicalSkillEntry[]
  onSave: (data: ProjectEntry[]) => Promise<void>
}

const EMPTY_ENTRY: Omit<ProjectEntry, 'id'> = {
  name: '',
  description: '',
  techStack: [],
  url: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
}

const FIELD_CLASS =
  'w-full rounded-xl border border-border px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none'

function newEntry(): ProjectEntry {
  return { ...EMPTY_ENTRY, id: crypto.randomUUID(), techStack: [] }
}

export default function ProjectsGroup({ data, availableTechs, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<ProjectEntry[]>(data ?? [])
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

  function setEntry(id: string, field: keyof ProjectEntry, value: string | boolean) {
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
        <h2 className="text-base font-semibold text-ink">Dự án cá nhân</h2>
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
                <p className="text-sm font-semibold text-ink">{entry.name || '—'}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
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
                {entry.url && (
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-brand hover:underline"
                  >
                    {entry.url}
                  </a>
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
                <p className="text-sm font-medium text-ink">Dự án #{idx + 1}</p>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="text-xs text-danger hover:underline"
                >
                  Xóa
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <Field label="Tên dự án">
                  <input
                    value={entry.name}
                    onChange={(e) => setEntry(entry.id, 'name', e.target.value)}
                    placeholder="InterviewCoach"
                    className={FIELD_CLASS}
                  />
                </Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`current-${entry.id}`}
                    checked={entry.isCurrent}
                    onChange={(e) => setEntry(entry.id, 'isCurrent', e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-brand"
                  />
                  <label htmlFor={`current-${entry.id}`} className="text-sm text-ink">
                    Dự án đang thực hiện
                  </label>
                </div>
                <div>
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
                <Field label="Link dự án">
                  <input
                    value={entry.url}
                    onChange={(e) => setEntry(entry.id, 'url', e.target.value)}
                    placeholder="https://github.com/..."
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field label="Mô tả">
                  <textarea
                    value={entry.description}
                    onChange={(e) => setEntry(entry.id, 'description', e.target.value)}
                    placeholder="Mô tả ngắn về dự án, vai trò, thành tích..."
                    rows={3}
                    className={FIELD_CLASS}
                  />
                </Field>
              </div>
            </div>
          ))}

          <Button variant="ghost" onClick={addEntry} className="self-start text-sm">
            + Thêm dự án
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  )
}
