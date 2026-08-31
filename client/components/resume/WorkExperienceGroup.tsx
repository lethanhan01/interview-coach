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

function newEntry(): WorkExperienceEntry {
  return { ...EMPTY_ENTRY, id: crypto.randomUUID(), techStack: [] }
}

export default function WorkExperienceGroup({
  data,
  availableTechs,
  onSave,
}: Props) {
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

  function setEntry(
    id: string,
    field: keyof WorkExperienceEntry,
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
    <div id="experience">
      <ProfileSection
        title="Kinh nghiệm làm việc"
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
                    {entry.position || '—'}
                  </p>
                  <p className="text-ink-muted text-sm">{entry.company || '—'}</p>
                  <p className="text-ink-muted mt-1 text-xs">
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
                  <p className="text-ink text-sm font-medium">
                    Vị trí #{idx + 1}
                  </p>
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor={`company-${entry.id}`}>Công ty</Label>
                    <Input
                      id={`company-${entry.id}`}
                      value={entry.company}
                      onChange={(e) =>
                        setEntry(entry.id, 'company', e.target.value)
                      }
                      placeholder="Google Vietnam"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor={`position-${entry.id}`}>Vị trí</Label>
                    <Input
                      id={`position-${entry.id}`}
                      value={entry.position}
                      onChange={(e) =>
                        setEntry(entry.id, 'position', e.target.value)
                      }
                      placeholder="Frontend Developer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`start-date-${entry.id}`}>Ngày bắt đầu</Label>
                    <Input
                      id={`start-date-${entry.id}`}
                      type="date"
                      value={entry.startDate}
                      onChange={(e) =>
                        setEntry(entry.id, 'startDate', e.target.value)
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`end-date-${entry.id}`}>Ngày kết thúc</Label>
                    <Input
                      id={`end-date-${entry.id}`}
                      type="date"
                      value={entry.endDate}
                      disabled={entry.isCurrent}
                      onChange={(e) =>
                        setEntry(entry.id, 'endDate', e.target.value)
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2 sm:col-span-2 pt-1">
                    <Checkbox
                      id={`current-${entry.id}`}
                      checked={entry.isCurrent}
                      onCheckedChange={(checked) =>
                        setEntry(entry.id, 'isCurrent', !!checked)
                      }
                    />
                    <Label
                      htmlFor={`current-${entry.id}`}
                      className="cursor-pointer font-normal"
                    >
                      Đang làm việc tại đây
                    </Label>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor={`desc-${entry.id}`}>Mô tả</Label>
                    <Textarea
                      id={`desc-${entry.id}`}
                      value={entry.description}
                      onChange={(e) =>
                        setEntry(entry.id, 'description', e.target.value)
                      }
                      placeholder="Mô tả công việc, thành tích..."
                      rows={3}
                    />
                  </div>

                  <div className="sm:col-span-2">
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
              Thêm kinh nghiệm
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
