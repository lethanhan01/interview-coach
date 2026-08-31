'use client'

import { useState } from 'react'
import { PencilLine } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import ProfileEmptyState from '@/components/profile/ProfileEmptyState'
import ProfileSection from '@/components/profile/ProfileSection'
import { TECH_CATEGORIES, TECH_OPTIONS } from './constants'
import type { TechCategory } from './constants'
import type { TechnicalSkillEntry } from '@/lib/types'

interface Props {
  data: TechnicalSkillEntry[]
  onSave: (patch: Record<string, unknown>) => Promise<void>
}

export default function TechnicalSkillsGroup({ data, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [entries, setEntries] = useState<TechnicalSkillEntry[]>(data)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addState, setAddState] = useState<
    Record<string, { name: string; usagePeriod: string }>
  >({})

  function handleEdit() {
    setEntries(data)
    setAddState({})
    setIsEditing(true)
    setError(null)
  }

  function handleCancel() {
    setIsEditing(false)
    setError(null)
  }

  function addEntry(category: TechCategory) {
    const s = addState[category]
    if (!s?.name) return
    const months = parseInt(s.usagePeriod, 10)
    if (isNaN(months) || months < 0) return
    if (entries.some((e) => e.category === category && e.name === s.name))
      return
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), category, name: s.name, usagePeriod: months },
    ])
    setAddState((prev) => ({
      ...prev,
      [category]: { name: '', usagePeriod: '' },
    }))
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave({ technicalSkills: entries })
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div id="skills">
      <ProfileSection
        title="Kỹ năng chuyên môn"
        action={
          !isEditing ? (
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <PencilLine className="h-4 w-4" aria-hidden="true" />
              Chỉnh sửa
            </Button>
          ) : undefined
        }
      >
        {TECH_CATEGORIES.map(({ key, label }) => {
          const displayEntries = (isEditing ? entries : data).filter(
            (e) => e.category === key
          )
          const s = addState[key] ?? { name: '', usagePeriod: '' }
          const usedNames = displayEntries.map((e) => e.name)
          const available = TECH_OPTIONS[key].filter(
            (n) => !usedNames.includes(n)
          )

          return (
            <div key={key} className="mb-5 last:mb-0">
              <p className="text-ink-muted mb-2 text-xs font-semibold uppercase tracking-wide">
                {label}
              </p>
              <div className="mb-2 flex flex-wrap gap-2">
                {displayEntries.length === 0 && !isEditing && (
                  <ProfileEmptyState message="Chưa thêm" className="text-xs" />
                )}
                {displayEntries.map((e) => (
                  <Badge key={e.id} variant="default" className="px-2.5 py-0.5">
                    {e.name}
                    <span className="text-ink-muted">· {e.usagePeriod}th</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeEntry(e.id)}
                        className="text-ink-muted hover:text-danger ml-1 leading-none"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && available.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={s.name}
                    onChange={(ev) =>
                      setAddState((prev) => ({
                        ...prev,
                        [key]: { ...s, name: ev.target.value },
                      }))
                    }
                    className="border-border bg-canvas text-ink focus:border-brand flex-1 rounded-xl border px-3 py-1.5 text-sm focus:outline-none"
                  >
                    <option value="">Chọn...</option>
                    {available.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    placeholder="Tháng"
                    value={s.usagePeriod}
                    onChange={(ev) =>
                      setAddState((prev) => ({
                        ...prev,
                        [key]: { ...s, usagePeriod: ev.target.value },
                      }))
                    }
                    className="border-border bg-canvas text-ink focus:border-brand w-20 rounded-xl border px-3 py-1.5 text-sm focus:outline-none"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => addEntry(key)}
                  >
                    Thêm
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        {isEditing && (
          <>
            {error && <p className="text-danger mb-2 mt-3 text-xs">{error}</p>}
            <div className="mt-4 flex gap-2">
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                onClick={handleSave}
              >
                Lưu
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                Hủy
              </Button>
            </div>
          </>
        )}
      </ProfileSection>
    </div>
  )
}
