'use client'

import { useEffect, useRef, useState } from 'react'
import { Briefcase, Loader2, PencilLine, Search, Sparkles, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import ProfileSection from '@/components/profile/ProfileSection'
import ProfileField from '@/components/profile/ProfileField'
import {
  getJdLevelLabel,
  JD_LEVEL_OPTIONS,
  normalizeJdLevel,
  normalizePosition,
  POSITION_OPTIONS,
} from '@/lib/interview-options'
import { mapJdLevelToSfia } from '@/lib/setup-types'
import { onetService, type OnetOccupation } from '@/services'

export interface CareerInfoData {
  targetPosition?: string
  targetRoleCategory?: string
  targetLevel?: string
  onetSocCode?: string
  onetOccupationTitle?: string
  targetSfiaLevel?: number
}

interface Props {
  data: CareerInfoData
  onSave: (data: CareerInfoData) => Promise<void>
}

function normalizeCareerInfo(data: CareerInfoData): CareerInfoData {
  const normLevel = normalizeCareerLevel(data.targetLevel)
  return {
    ...data,
    targetPosition: normalizePosition(data.targetPosition),
    targetLevel: normLevel,
    onetSocCode: data.onetSocCode?.trim() || undefined,
    onetOccupationTitle: data.onetOccupationTitle?.trim() || undefined,
    targetSfiaLevel:
      data.targetSfiaLevel ?? (normLevel ? mapJdLevelToSfia(normLevel) : undefined),
  }
}

function normalizeCareerLevel(value?: string) {
  const normalized = normalizeJdLevel(value)
  if (normalized) return normalized
  return value?.trim() ?? ''
}

function buildLevelOptions(value?: string) {
  const normalized = normalizeCareerLevel(value)
  const known = JD_LEVEL_OPTIONS.some((option) => option.value === normalized)
  return { normalized, fallback: normalized && !known ? normalized : '' }
}

export default function CareerInfoGroup({ data, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<CareerInfoData>(() =>
    normalizeCareerInfo(data)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // O*NET Combobox state
  const [onetQuery, setOnetQuery] = useState('')
  const [onetResults, setOnetResults] = useState<OnetOccupation[]>([])
  const [isSearchingOnet, setIsSearchingOnet] = useState(false)
  const [isOnetDropdownOpen, setIsOnetDropdownOpen] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)

  // Click outside to close O*NET dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(event.target as Node)
      ) {
        setIsOnetDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Debounced search for O*NET occupations
  useEffect(() => {
    let cancelled = false
    if (!isOnetDropdownOpen) return

    const timer = setTimeout(() => {
      setIsSearchingOnet(true)
      onetService
        .searchOccupations(onetQuery, 8)
        .then((items) => {
          if (!cancelled) {
            setOnetResults(items)
            setIsSearchingOnet(false)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setOnetResults([])
            setIsSearchingOnet(false)
          }
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [onetQuery, isOnetDropdownOpen])

  function handleEdit() {
    setForm(normalizeCareerInfo(data))
    setOnetQuery('')
    setError(null)
    setIsEditing(true)
  }

  function handleCancel() {
    setForm(normalizeCareerInfo(data))
    setError(null)
    setIsEditing(false)
  }

  function handleSelectOnet(occ: OnetOccupation) {
    setForm((prev) => ({
      ...prev,
      onetSocCode: occ.socCode,
      onetOccupationTitle: occ.title,
      targetPosition: prev.targetPosition || occ.title,
    }))
    setIsOnetDropdownOpen(false)
  }

  function handleClearOnet() {
    setForm((prev) => ({
      ...prev,
      onetSocCode: undefined,
      onetOccupationTitle: undefined,
    }))
  }

  function handleLevelChange(val: string) {
    const sfia = mapJdLevelToSfia(val)
    setForm((prev) => ({
      ...prev,
      targetLevel: val,
      targetSfiaLevel: sfia,
    }))
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

  const displayPosition = data.targetPosition || data.onetOccupationTitle || ''
  const displayLevel = normalizeCareerLevel(data.targetLevel)
  const displaySfiaLevel =
    data.targetSfiaLevel ?? (displayLevel ? mapJdLevelToSfia(displayLevel) : undefined)
  const levelOptions = buildLevelOptions(form.targetLevel)

  return (
    <div id="career">
      <ProfileSection
        title="Định hướng nghề nghiệp"
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
          <dl className="flex flex-col gap-3 text-sm">
            <ProfileField
              label="Vị trí mục tiêu"
              value={
                displayPosition ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{displayPosition}</span>
                    {data.onetSocCode && (
                      <Badge variant="brand" className="text-xs font-mono">
                        SOC: {data.onetSocCode}
                      </Badge>
                    )}
                  </div>
                ) : undefined
              }
            />
            <ProfileField
              label="Mức kinh nghiệm"
              value={
                displayLevel ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{getJdLevelLabel(displayLevel)}</span>
                    {displaySfiaLevel && (
                      <Badge variant="outline" className="text-xs">
                        SFIA Level {displaySfiaLevel}
                      </Badge>
                    )}
                  </div>
                ) : undefined
              }
            />
          </dl>
        ) : (
          <div className="flex flex-col gap-4">
            {/* O*NET Occupation Combobox */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="onet-occupation">Chức danh chuẩn O*NET (Taxonomy)</Label>
                <span className="text-brand flex items-center gap-1 text-xs font-medium">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Chuẩn hóa câu hỏi & kỹ năng
                </span>
              </div>

              {form.onetSocCode && form.onetOccupationTitle ? (
                <div className="border-border bg-surface-1 flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="bg-brand text-brand-fg flex size-8 shrink-0 items-center justify-center rounded-md">
                      <Briefcase className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-ink truncate text-sm font-semibold">
                        {form.onetOccupationTitle}
                      </p>
                      <p className="text-ink-muted text-xs">
                        Mã O*NET SOC: {form.onetSocCode}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearOnet}
                    aria-label="Bỏ chọn chức danh O*NET"
                    className="text-ink-muted hover:text-ink shrink-0 h-8 px-2"
                  >
                    <X className="size-4" aria-hidden="true" />
                    <span className="ml-1 text-xs">Đổi</span>
                  </Button>
                </div>
              ) : (
                <div ref={comboboxRef} className="relative">
                  <div className="relative">
                    <Input
                      id="onet-occupation"
                      type="search"
                      value={onetQuery}
                      onChange={(e) => {
                        setOnetQuery(e.target.value)
                        setIsOnetDropdownOpen(true)
                      }}
                      onFocus={() => setIsOnetDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsOnetDropdownOpen(false)
                      }}
                      placeholder="Tìm kiếm chức danh O*NET (VD: Software Developers, Data Scientists...)"
                      aria-expanded={isOnetDropdownOpen}
                      aria-autocomplete="list"
                      aria-label="Tìm kiếm chức danh chuẩn O*NET"
                      className="pr-9"
                    />
                    <div className="text-ink-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      {isSearchingOnet ? (
                        <Loader2 className="text-brand size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Search className="size-4" aria-hidden="true" />
                      )}
                    </div>
                  </div>

                  {isOnetDropdownOpen && (
                    <div
                      role="listbox"
                      aria-label="Danh sách chức danh O*NET gợi ý"
                      className="border-border bg-surface-1 absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border p-1 shadow-lg"
                    >
                      {isSearchingOnet && onetResults.length === 0 ? (
                        <div className="text-ink-muted flex items-center justify-center gap-2 py-4 text-xs">
                          <Loader2 className="text-brand size-3.5 animate-spin" aria-hidden="true" />
                          Đang tìm kiếm chức danh O*NET...
                        </div>
                      ) : onetResults.length === 0 ? (
                        <div className="text-ink-muted px-3 py-3 text-center text-xs">
                          {onetQuery.trim() ? 'Không tìm thấy chức danh O*NET phù hợp.' : 'Gõ để tìm kiếm chức danh O*NET...'}
                        </div>
                      ) : (
                        onetResults.map((occ) => (
                          <button
                            key={occ.socCode}
                            type="button"
                            role="option"
                            aria-selected={form.onetSocCode === occ.socCode}
                            onClick={() => handleSelectOnet(occ)}
                            className="hover:bg-surface-2 focus-visible:bg-surface-2 flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none"
                          >
                            <span className="text-ink font-medium">{occ.title}</span>
                            <span className="text-ink-muted text-xs">
                              Mã SOC: {occ.socCode}
                              {occ.description ? ` · ${occ.description.slice(0, 90)}...` : ''}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vị trí mục tiêu hiển thị */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="target-position">Vị trí mục tiêu (Tên hiển thị)</Label>
              <Input
                id="target-position"
                value={form.targetPosition ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, targetPosition: e.target.value }))
                }
                placeholder="VD: Senior Frontend Engineer, Full-stack Developer..."
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-ink-muted text-xs py-0.5">Vị trí IT phổ biến:</span>
                {POSITION_OPTIONS.slice(0, 5).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, targetPosition: pos }))
                    }
                    className="text-brand hover:underline text-xs bg-brand-subtle px-1.5 py-0.5 rounded"
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Mức kinh nghiệm & SFIA */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="target-level">Mức kinh nghiệm</Label>
                {form.targetLevel && (
                  <span className="text-ink-muted text-xs">
                    Ánh xạ SFIA Level: <strong className="text-ink font-semibold">{mapJdLevelToSfia(form.targetLevel)}</strong>
                  </span>
                )}
              </div>
              <Select
                value={levelOptions.normalized || undefined}
                onValueChange={handleLevelChange}
              >
                <SelectTrigger id="target-level" aria-label="Mức kinh nghiệm">
                  <SelectValue placeholder="Chọn mức kinh nghiệm" />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.fallback && (
                    <SelectItem value={levelOptions.fallback}>
                      Giá trị hiện tại: {levelOptions.fallback}
                    </SelectItem>
                  )}
                  {JD_LEVEL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label} (SFIA Level {mapJdLevelToSfia(o.value)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}
            <div className="flex gap-2 pt-2">
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
