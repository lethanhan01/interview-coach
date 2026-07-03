'use client'

import { useState } from 'react'
import { PencilLine } from 'lucide-react'
import Button from '@/components/ui/Button'
import ProfileSection from './ProfileSection'
import ProfileField from './ProfileField'
import {
  getJdLevelLabel,
  JD_LEVEL_OPTIONS,
  normalizeJdLevel,
  normalizePosition,
  POSITION_OPTIONS,
} from '@/lib/interview-options'

interface CareerInfoData {
  targetPosition?: string
  targetRoleCategory?: string
  targetLevel?: string
}

interface Props {
  data: CareerInfoData
  onSave: (data: CareerInfoData) => Promise<void>
}

const FIELD_CLASS =
  'w-full rounded-xl border border-border px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none'

function normalizeCareerInfo(data: CareerInfoData): CareerInfoData {
  return {
    ...data,
    targetPosition: normalizePosition(data.targetPosition),
    targetLevel: normalizeCareerLevel(data.targetLevel),
  }
}

function normalizeCareerLevel(value?: string) {
  const normalized = normalizeJdLevel(value)
  if (normalized) return normalized
  return value?.trim() ?? ''
}

function buildPositionOptions(value?: string) {
  const normalized = normalizePosition(value)
  const fallback = normalized && !POSITION_OPTIONS.includes(normalized) ? normalized : ''
  return { normalized, fallback }
}

function buildLevelOptions(value?: string) {
  const normalized = normalizeCareerLevel(value)
  const known = JD_LEVEL_OPTIONS.some((option) => option.value === normalized)
  return { normalized, fallback: normalized && !known ? normalized : '' }
}

export default function CareerInfoGroup({ data, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<CareerInfoData>(() => normalizeCareerInfo(data))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setForm(normalizeCareerInfo(data))
    setError(null)
    setIsEditing(true)
  }

  function handleCancel() {
    setForm(normalizeCareerInfo(data))
    setError(null)
    setIsEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const normalized = normalizeCareerInfo(form)
      await onSave(normalized)
      setForm(normalized)
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

  const displayPosition = normalizePosition(data.targetPosition)
  const displayLevel = normalizeCareerLevel(data.targetLevel)
  const positionOptions = buildPositionOptions(form.targetPosition)
  const levelOptions = buildLevelOptions(form.targetLevel)

  return (
    <ProfileSection
      title="Định hướng nghề nghiệp"
      action={!isEditing ? (
        <Button variant="ghost" size="sm" onClick={handleEdit}>
          <PencilLine className="h-4 w-4" aria-hidden="true" />
          Chỉnh sửa
        </Button>
      ) : undefined}
    >
      {!isEditing ? (
        <dl className="flex flex-col gap-3 text-sm">
          <ProfileField
            label="Vị trí mục tiêu"
            value={displayPosition || undefined}
          />
          <ProfileField
            label="Mức kinh nghiệm"
            value={displayLevel ? getJdLevelLabel(displayLevel) : undefined}
          />
        </dl>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Vị trí mục tiêu</label>
            <select
              value={positionOptions.normalized}
              onChange={(e) => set('targetPosition', e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">Chọn vị trí mục tiêu</option>
              {positionOptions.fallback && (
                <option value={positionOptions.fallback}>
                  Giá trị hiện tại: {positionOptions.fallback}
                </option>
              )}
              {POSITION_OPTIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mức kinh nghiệm</label>
            <select
              value={levelOptions.normalized}
              onChange={(e) => set('targetLevel', e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">Chọn mức kinh nghiệm</option>
              {levelOptions.fallback && (
                <option value={levelOptions.fallback}>
                  Giá trị hiện tại: {levelOptions.fallback}
                </option>
              )}
              {JD_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
