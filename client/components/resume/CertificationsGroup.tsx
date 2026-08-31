'use client'

import { useState } from 'react'
import { PencilLine } from 'lucide-react'
import Button from '@/components/ui/Button'
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

const inputCls =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none'

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
              className="border-border bg-canvas mb-3 rounded-lg border p-3.5"
            >
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-ink-muted mb-1 block text-xs">
                      Tên chứng chỉ
                    </label>
                    <input
                      placeholder="Tên chứng chỉ"
                      value={c.name}
                      onChange={(e) => updateCert(c.id, 'name', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-ink-muted mb-1 block text-xs">
                      Đơn vị cấp
                    </label>
                    <input
                      placeholder="Đơn vị cấp"
                      value={c.issuer}
                      onChange={(e) => updateCert(c.id, 'issuer', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-ink-muted mb-1 block text-xs">
                        Ngày cấp
                      </label>
                      <input
                        type="date"
                        value={c.issueDate}
                        onChange={(e) =>
                          updateCert(c.id, 'issueDate', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-ink-muted mb-1 block text-xs">
                        Ngày hết hạn
                      </label>
                      <input
                        type="date"
                        value={c.expiryDate ?? ''}
                        onChange={(e) =>
                          updateCert(c.id, 'expiryDate', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCerts((prev) => prev.filter((x) => x.id !== c.id))
                    }
                    className="text-danger self-start text-xs hover:underline"
                  >
                    Xóa
                  </button>
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
              variant="ghost"
              size="sm"
              onClick={() =>
                setCerts((prev) => [...prev, emptyCert('professional')])
              }
            >
              + Thêm chứng chỉ chuyên môn
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
              className="border-border bg-canvas mb-3 rounded-lg border p-3.5"
            >
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-ink-muted mb-1 block text-xs">
                      Tên chứng chỉ
                    </label>
                    <input
                      placeholder="Ví dụ: IELTS, TOEIC"
                      value={c.name}
                      onChange={(e) => updateCert(c.id, 'name', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-ink-muted mb-1 block text-xs">
                        Điểm
                      </label>
                      <input
                        placeholder="Ví dụ: 7.0"
                        value={c.score ?? ''}
                        onChange={(e) =>
                          updateCert(c.id, 'score', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-ink-muted mb-1 block text-xs">
                        Đơn vị cấp
                      </label>
                      <input
                        placeholder="Đơn vị cấp"
                        value={c.issuer}
                        onChange={(e) =>
                          updateCert(c.id, 'issuer', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-ink-muted mb-1 block text-xs">
                        Ngày cấp
                      </label>
                      <input
                        type="date"
                        value={c.issueDate}
                        onChange={(e) =>
                          updateCert(c.id, 'issueDate', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-ink-muted mb-1 block text-xs">
                        Ngày hết hạn
                      </label>
                      <input
                        type="date"
                        value={c.expiryDate ?? ''}
                        onChange={(e) =>
                          updateCert(c.id, 'expiryDate', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCerts((prev) => prev.filter((x) => x.id !== c.id))
                    }
                    className="text-danger self-start text-xs hover:underline"
                  >
                    Xóa
                  </button>
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
              variant="ghost"
              size="sm"
              onClick={() => setCerts((prev) => [...prev, emptyCert('language')])}
            >
              + Thêm chứng chỉ ngoại ngữ
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
              className="border-border bg-canvas mb-3 rounded-lg border p-3.5"
            >
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-ink-muted mb-1 block text-xs">
                      Tên giải thưởng
                    </label>
                    <input
                      placeholder="Tên giải thưởng"
                      value={a.name}
                      onChange={(e) => updateAward(a.id, 'name', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 items-end gap-2">
                    <div>
                      <label className="text-ink-muted mb-1 block text-xs">
                        Tổ chức trao
                      </label>
                      <input
                        placeholder="Tổ chức trao"
                        value={a.organization}
                        onChange={(e) =>
                          updateAward(a.id, 'organization', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-ink-muted mb-1 block text-xs">
                        Ngày nhận
                      </label>
                      <input
                        type="date"
                        value={a.date}
                        onChange={(e) =>
                          updateAward(a.id, 'date', e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-ink-muted mb-1 block text-xs">
                      Mô tả
                    </label>
                    <textarea
                      placeholder="Mô tả (tùy chọn)"
                      value={a.description}
                      onChange={(e) =>
                        updateAward(a.id, 'description', e.target.value)
                      }
                      className={`${inputCls} resize-none`}
                      rows={2}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAwards((prev) => prev.filter((x) => x.id !== a.id))
                    }
                    className="text-danger self-start text-xs hover:underline"
                  >
                    Xóa
                  </button>
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
              variant="ghost"
              size="sm"
              onClick={() => setAwards((prev) => [...prev, emptyAward()])}
            >
              + Thêm giải thưởng
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
