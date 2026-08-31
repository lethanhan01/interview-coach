'use client'

import { useState } from 'react'
import { PencilLine } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import ProfileSection from '@/components/profile/ProfileSection'
import ProfileField from '@/components/profile/ProfileField'
import { EDUCATION_DEGREE_OPTIONS } from './constants'
import type { EducationEntry } from '@/lib/types'

interface Props {
  data: Partial<EducationEntry> | null | undefined
  onSave: (data: EducationEntry) => Promise<void>
}

const DEGREE_LABEL: Record<string, string> = Object.fromEntries(
  EDUCATION_DEGREE_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
)

function toText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function normalizeEducation(
  data: Partial<EducationEntry> | null | undefined
): EducationEntry {
  return {
    degree: toText(data?.degree),
    school: toText(data?.school),
    major: toText(data?.major),
    gpa: toText(data?.gpa),
    graduationYear: toText(data?.graduationYear),
  }
}

export default function EducationGroup({ data, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<EducationEntry>(() =>
    normalizeEducation(data)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setForm(normalizeEducation(data))
    setError(null)
    setIsEditing(true)
  }

  function handleCancel() {
    setForm(normalizeEducation(data))
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
    <div id="education">
      <ProfileSection
        title="Trình độ học vấn"
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
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <ProfileField
              label="Trình độ"
              value={data?.degree ? DEGREE_LABEL[data.degree] : undefined}
            />
            <ProfileField label="Trường" value={data?.school} />
            <ProfileField label="Ngành học" value={data?.major} />
            <ProfileField label="GPA / CPA" value={data?.gpa} />
            <ProfileField label="Năm tốt nghiệp" value={data?.graduationYear} />
          </dl>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="education-degree">Trình độ</Label>
                <Select
                  value={form.degree || undefined}
                  onValueChange={(val) => set('degree', val)}
                >
                  <SelectTrigger id="education-degree" aria-label="Trình độ học vấn">
                    <SelectValue placeholder="Chọn trình độ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_DEGREE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="education-grad-year">Năm tốt nghiệp</Label>
                <Input
                  id="education-grad-year"
                  value={form.graduationYear}
                  onChange={(e) => set('graduationYear', e.target.value)}
                  placeholder="2024"
                  maxLength={4}
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="education-school">Trường</Label>
                <Input
                  id="education-school"
                  value={form.school}
                  onChange={(e) => set('school', e.target.value)}
                  placeholder="Đại học Bách Khoa Hà Nội"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="education-major">Ngành học</Label>
                <Input
                  id="education-major"
                  value={form.major}
                  onChange={(e) => set('major', e.target.value)}
                  placeholder="Công nghệ thông tin"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="education-gpa">GPA / CPA</Label>
                <Input
                  id="education-gpa"
                  value={form.gpa}
                  onChange={(e) => set('gpa', e.target.value)}
                  placeholder="3.2 / 4.0"
                />
              </div>
            </div>

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
