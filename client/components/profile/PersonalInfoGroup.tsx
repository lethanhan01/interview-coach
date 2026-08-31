'use client'

import { useState } from 'react'
import { PencilLine } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import ProfileSection from './ProfileSection'
import ProfileField from './ProfileField'

interface PersonalInfoData {
  firstname?: string
  lastname?: string
}

interface Props {
  data: PersonalInfoData
  onSave: (data: PersonalInfoData) => Promise<void>
}

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
            label="Họ và tên"
            value={[data.lastname, data.firstname].filter(Boolean).join(' ') || undefined}
          />
        </dl>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-lastname">Họ</Label>
              <Input
                id="profile-lastname"
                value={form.lastname ?? ''}
                onChange={(e) => set('lastname', e.target.value)}
                placeholder="Nguyễn Văn"
                disabled={saving}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-firstname">Tên</Label>
              <Input
                id="profile-firstname"
                value={form.firstname ?? ''}
                onChange={(e) => set('firstname', e.target.value)}
                placeholder="A"
                disabled={saving}
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
  )
}

