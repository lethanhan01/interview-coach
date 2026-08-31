'use client'

import { useState } from 'react'
import { PencilLine, Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { Label } from '@/components/ui/Label'
import ProfileEmptyState from '@/components/profile/ProfileEmptyState'
import ProfileSection from '@/components/profile/ProfileSection'
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

  function setEntry(
    id: string,
    field: keyof ProjectEntry,
    value: string | boolean
  ) {
    setForm((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
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
      })
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
    <div id="projects">
      <ProfileSection
        title="Dự án cá nhân"
        action={
          !isEditing ? (
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <PencilLine className="h-4 w-4" aria-hidden="true" />
              Chỉnh sửa
            </Button>
          ) : undefined
        }
      >
        {!isEditing ? (
          displayList.length === 0 ? (
            <ProfileEmptyState message="Chưa có thông tin" />
          ) : (
            <div className="flex flex-col gap-4">
              {displayList.map((entry) => (
                <div
                  key={entry.id}
                  className="border-border bg-surface rounded-xl border p-4 shadow-sm"
                >
                  <p className="text-ink text-sm font-semibold">
                    {entry.name || '—'}
                  </p>
                  <p className="text-ink-muted mt-0.5 text-xs">
                    {entry.startDate || '—'} →{' '}
                    {entry.isCurrent ? 'Hiện tại' : entry.endDate || '—'}
                  </p>
                  {entry.techStack && entry.techStack.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entry.techStack.map((t) => (
                        <Badge key={t} variant="default">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {entry.description && (
                    <p className="text-ink mt-2 text-sm">{entry.description}</p>
                  )}
                  {entry.url && (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand mt-1 inline-block text-xs hover:underline"
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
              <div
                key={entry.id}
                className="border-border bg-surface rounded-xl border p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-ink text-sm font-medium">Dự án #{idx + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntry(entry.id)}
                    className="text-danger hover:text-danger hover:bg-danger-subtle h-7 gap-1 px-2 text-xs"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </Button>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`project-name-${entry.id}`}>Tên dự án</Label>
                    <Input
                      id={`project-name-${entry.id}`}
                      value={entry.name}
                      onChange={(e) => setEntry(entry.id, 'name', e.target.value)}
                      placeholder="InterviewCoach"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`project-start-${entry.id}`}>Ngày bắt đầu</Label>
                      <Input
                        id={`project-start-${entry.id}`}
                        type="date"
                        value={entry.startDate}
                        onChange={(e) =>
                          setEntry(entry.id, 'startDate', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`project-end-${entry.id}`}>Ngày kết thúc</Label>
                      <Input
                        id={`project-end-${entry.id}`}
                        type="date"
                        value={entry.endDate}
                        disabled={entry.isCurrent}
                        onChange={(e) =>
                          setEntry(entry.id, 'endDate', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id={`project-current-${entry.id}`}
                      checked={entry.isCurrent}
                      onCheckedChange={(checked) =>
                        setEntry(entry.id, 'isCurrent', !!checked)
                      }
                    />
                    <Label
                      htmlFor={`project-current-${entry.id}`}
                      className="cursor-pointer font-normal"
                    >
                      Dự án đang thực hiện
                    </Label>
                  </div>

                  <div>
                    <p className="text-ink mb-1.5 text-sm font-medium">
                      Tech stack
                    </p>
                    {availableTechs.length === 0 ? (
                      <ProfileEmptyState
                        message="Thêm kỹ năng ở mục Kỹ năng chuyên môn trước"
                        className="text-xs"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {availableTechs.map((tech) => {
                          const selected = (entry.techStack ?? []).includes(
                            tech.name
                          )
                          return (
                            <Badge
                              key={tech.id}
                              variant={selected ? 'brand' : 'default'}
                              interactive
                              onClick={() => toggleEntryTech(entry.id, tech.name)}
                              className="text-xs"
                            >
                              {tech.name}
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`project-url-${entry.id}`}>Link dự án</Label>
                    <Input
                      id={`project-url-${entry.id}`}
                      value={entry.url}
                      onChange={(e) => setEntry(entry.id, 'url', e.target.value)}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`project-desc-${entry.id}`}>Mô tả</Label>
                    <Textarea
                      id={`project-desc-${entry.id}`}
                      value={entry.description}
                      onChange={(e) =>
                        setEntry(entry.id, 'description', e.target.value)
                      }
                      placeholder="Mô tả ngắn về dự án, vai trò, thành tích..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addEntry}
              className="self-start gap-1 text-sm"
            >
              <Plus className="size-4" />
              Thêm dự án
            </Button>

            {error && <p className="text-danger text-sm">{error}</p>}
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
    </div>
  )
}
