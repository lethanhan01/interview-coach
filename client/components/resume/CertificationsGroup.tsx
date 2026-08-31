'use client'

import { useState } from 'react'
import { PencilLine, Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import ProfileEmptyState from '@/components/profile/ProfileEmptyState'
import ProfileSection from '@/components/profile/ProfileSection'
import type { CertificationEntry, AwardEntry } from '@/lib/types'

interface CertGroupData {
  certifications: CertificationEntry[]
  awards: AwardEntry[]
}

interface Props {
  data: CertGroupData
  onSave: (patch: Record<string, unknown>) => Promise<void>
}

function emptyCert(type: CertificationEntry['type']): CertificationEntry {
  return {
    id: crypto.randomUUID(),
    type,
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    score: '',
  }
}

function emptyAward(): AwardEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    organization: '',
    date: '',
    description: '',
  }
}

export default function CertificationsGroup({ data, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [certs, setCerts] = useState<CertificationEntry[]>(data.certifications)
  const [awards, setAwards] = useState<AwardEntry[]>(data.awards)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEdit() {
    setCerts(data.certifications)
    setAwards(data.awards)
    setIsEditing(true)
    setError(null)
  }

  function handleCancel() {
    setIsEditing(false)
    setError(null)
  }

  function updateCert(
    id: string,
    field: keyof CertificationEntry,
    value: string
  ) {
    setCerts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  function updateAward(id: string, field: keyof AwardEntry, value: string) {
    setAwards((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave({ certifications: certs, awards })
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const currentCerts = isEditing ? certs : data.certifications
  const currentAwards = isEditing ? awards : data.awards
  const professionalCerts = currentCerts.filter(
    (c) => c.type === 'professional'
  )
  const languageCerts = currentCerts.filter((c) => c.type === 'language')

  return (
    <div id="certifications">
      <ProfileSection
        title="Chứng chỉ & Giải thưởng"
        action={
          !isEditing ? (
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <PencilLine className="h-4 w-4" aria-hidden="true" />
              Chỉnh sửa
            </Button>
          ) : undefined
        }
      >
        {/* Professional certs */}
        <div className="mb-5">
          <p className="text-ink-muted mb-2 text-xs font-semibold uppercase tracking-wide">
            Chứng chỉ chuyên môn
          </p>
          {professionalCerts.length === 0 && !isEditing && (
            <ProfileEmptyState message="Chưa thêm" className="text-xs" />
          )}
          {professionalCerts.map((c) => (
            <div
              key={c.id}
              className="border-border bg-surface mb-3 rounded-xl border p-4 shadow-sm"
            >
              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`cert-name-${c.id}`}>Tên chứng chỉ</Label>
                    <Input
                      id={`cert-name-${c.id}`}
                      placeholder="Tên chứng chỉ"
                      value={c.name}
                      onChange={(e) => updateCert(c.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`cert-issuer-${c.id}`}>Đơn vị cấp</Label>
                    <Input
                      id={`cert-issuer-${c.id}`}
                      placeholder="Đơn vị cấp"
                      value={c.issuer}
                      onChange={(e) => updateCert(c.id, 'issuer', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`cert-issue-date-${c.id}`}>Ngày cấp</Label>
                      <Input
                        id={`cert-issue-date-${c.id}`}
                        type="date"
                        value={c.issueDate}
                        onChange={(e) =>
                          updateCert(c.id, 'issueDate', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`cert-exp-date-${c.id}`}>Ngày hết hạn</Label>
                      <Input
                        id={`cert-exp-date-${c.id}`}
                        type="date"
                        value={c.expiryDate ?? ''}
                        onChange={(e) =>
                          updateCert(c.id, 'expiryDate', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCerts((prev) => prev.filter((x) => x.id !== c.id))
                    }
                    className="text-danger hover:text-danger hover:bg-danger-subtle self-start h-7 gap-1 px-2 text-xs"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-ink text-sm font-medium">{c.name}</p>
                  <p className="text-ink-muted text-xs">
                    {c.issuer}
                    {c.issueDate && ` · ${c.issueDate}`}
                    {c.expiryDate && ` → ${c.expiryDate}`}
                  </p>
                </div>
              )}
            </div>
          ))}
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setCerts((prev) => [...prev, emptyCert('professional')])
              }
              className="gap-1 text-xs"
            >
              <Plus className="size-3.5" />
              Thêm chứng chỉ chuyên môn
            </Button>
          )}
        </div>

        {/* Language certs */}
        <div className="mb-5">
          <p className="text-ink-muted mb-2 text-xs font-semibold uppercase tracking-wide">
            Chứng chỉ ngoại ngữ
          </p>
          {languageCerts.length === 0 && !isEditing && (
            <ProfileEmptyState message="Chưa thêm" className="text-xs" />
          )}
          {languageCerts.map((c) => (
            <div
              key={c.id}
              className="border-border bg-surface mb-3 rounded-xl border p-4 shadow-sm"
            >
              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`lang-cert-name-${c.id}`}>Tên chứng chỉ</Label>
                    <Input
                      id={`lang-cert-name-${c.id}`}
                      placeholder="Ví dụ: IELTS, TOEIC"
                      value={c.name}
                      onChange={(e) => updateCert(c.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`lang-cert-score-${c.id}`}>Điểm</Label>
                      <Input
                        id={`lang-cert-score-${c.id}`}
                        placeholder="Ví dụ: 7.0"
                        value={c.score ?? ''}
                        onChange={(e) =>
                          updateCert(c.id, 'score', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`lang-cert-issuer-${c.id}`}>Đơn vị cấp</Label>
                      <Input
                        id={`lang-cert-issuer-${c.id}`}
                        placeholder="Đơn vị cấp"
                        value={c.issuer}
                        onChange={(e) =>
                          updateCert(c.id, 'issuer', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`lang-cert-issue-${c.id}`}>Ngày cấp</Label>
                      <Input
                        id={`lang-cert-issue-${c.id}`}
                        type="date"
                        value={c.issueDate}
                        onChange={(e) =>
                          updateCert(c.id, 'issueDate', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`lang-cert-exp-${c.id}`}>Ngày hết hạn</Label>
                      <Input
                        id={`lang-cert-exp-${c.id}`}
                        type="date"
                        value={c.expiryDate ?? ''}
                        onChange={(e) =>
                          updateCert(c.id, 'expiryDate', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCerts((prev) => prev.filter((x) => x.id !== c.id))
                    }
                    className="text-danger hover:text-danger hover:bg-danger-subtle self-start h-7 gap-1 px-2 text-xs"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-ink text-sm font-medium">
                    {c.name}
                    {c.score && ` — ${c.score}`}
                  </p>
                  <p className="text-ink-muted text-xs">
                    {c.issuer}
                    {c.issueDate && ` · ${c.issueDate}`}
                    {c.expiryDate && ` → ${c.expiryDate}`}
                  </p>
                </div>
              )}
            </div>
          ))}
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCerts((prev) => [...prev, emptyCert('language')])}
              className="gap-1 text-xs"
            >
              <Plus className="size-3.5" />
              Thêm chứng chỉ ngoại ngữ
            </Button>
          )}
        </div>

        {/* Awards */}
        <div>
          <p className="text-ink-muted mb-2 text-xs font-semibold uppercase tracking-wide">
            Giải thưởng
          </p>
          {currentAwards.length === 0 && !isEditing && (
            <ProfileEmptyState message="Chưa thêm" className="text-xs" />
          )}
          {currentAwards.map((a) => (
            <div
              key={a.id}
              className="border-border bg-surface mb-3 rounded-xl border p-4 shadow-sm"
            >
              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`award-name-${a.id}`}>Tên giải thưởng</Label>
                    <Input
                      id={`award-name-${a.id}`}
                      placeholder="Tên giải thưởng"
                      value={a.name}
                      onChange={(e) => updateAward(a.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`award-org-${a.id}`}>Tổ chức trao</Label>
                      <Input
                        id={`award-org-${a.id}`}
                        placeholder="Tổ chức trao"
                        value={a.organization}
                        onChange={(e) =>
                          updateAward(a.id, 'organization', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`award-date-${a.id}`}>Ngày nhận</Label>
                      <Input
                        id={`award-date-${a.id}`}
                        type="date"
                        value={a.date}
                        onChange={(e) =>
                          updateAward(a.id, 'date', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`award-desc-${a.id}`}>Mô tả</Label>
                    <Textarea
                      id={`award-desc-${a.id}`}
                      placeholder="Mô tả (tùy chọn)"
                      value={a.description}
                      onChange={(e) =>
                        updateAward(a.id, 'description', e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setAwards((prev) => prev.filter((x) => x.id !== a.id))
                    }
                    className="text-danger hover:text-danger hover:bg-danger-subtle self-start h-7 gap-1 px-2 text-xs"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-ink text-sm font-medium">{a.name}</p>
                  <p className="text-ink-muted text-xs">
                    {a.organization}
                    {a.date && ` · ${a.date}`}
                  </p>
                  {a.description && (
                    <p className="text-ink-muted mt-1 text-xs">{a.description}</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAwards((prev) => [...prev, emptyAward()])}
              className="gap-1 text-xs"
            >
              <Plus className="size-3.5" />
              Thêm giải thưởng
            </Button>
          )}
        </div>

        {isEditing && (
          <>
            {error && <p className="text-danger mt-3 text-xs">{error}</p>}
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
