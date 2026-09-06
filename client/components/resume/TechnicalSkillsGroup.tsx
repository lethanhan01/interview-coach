'use client'

import { useEffect, useState } from 'react'
import { Flame, Loader2, PencilLine, Plus, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import ProfileEmptyState from '@/components/profile/ProfileEmptyState'
import ProfileSection from '@/components/profile/ProfileSection'
import { TECH_CATEGORIES, TECH_OPTIONS } from './constants'
import type { TechCategory } from './constants'
import type { TechnicalSkillEntry } from '@/lib/types'
import { onetService, type OnetTech } from '@/services'

interface Props {
  data: TechnicalSkillEntry[]
  onetSocCode?: string | null
  targetPosition?: string | null
  onSave: (patch: Record<string, unknown>) => Promise<void>
}

/**
 * Tự động phát hiện danh mục công nghệ dựa trên từ điển TECH_OPTIONS hoặc luật chuỗi từ khóa.
 */
export function detectTechCategory(techName: string): TechCategory {
  const clean = techName.trim().toLowerCase()
  for (const cat of TECH_CATEGORIES) {
    const options = TECH_OPTIONS[cat.key]
    if (options && options.some((o) => o.toLowerCase() === clean)) {
      return cat.key
    }
  }
  // Heuristics nhận diện danh mục phổ biến
  if (
    clean.includes('sql') ||
    clean.includes('db') ||
    clean.includes('mongo') ||
    clean.includes('redis') ||
    clean.includes('oracle')
  ) {
    return 'database'
  }
  if (
    clean.includes('cloud') ||
    clean.includes('aws') ||
    clean.includes('azure') ||
    clean.includes('docker') ||
    clean.includes('k8s') ||
    clean.includes('kubernetes') ||
    clean.includes('gcp')
  ) {
    return 'platform'
  }
  if (
    clean.includes('git') ||
    clean.includes('jira') ||
    clean.includes('jenkins') ||
    clean.includes('test') ||
    clean.includes('ci/cd') ||
    clean.includes('postman') ||
    clean.includes('figma')
  ) {
    return 'devtool'
  }
  if (
    clean.includes('linux') ||
    clean.includes('windows') ||
    clean.includes('os') ||
    clean.includes('rtos') ||
    clean.includes('unix')
  ) {
    return 'os'
  }
  if (
    clean.includes('script') ||
    clean.includes('python') ||
    clean.includes('java') ||
    clean.includes('golang') ||
    clean.includes('rust')
  ) {
    return 'language'
  }
  return 'framework'
}

export default function TechnicalSkillsGroup({
  data,
  onetSocCode,
  targetPosition,
  onSave,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [entries, setEntries] = useState<TechnicalSkillEntry[]>(data)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Gợi ý công nghệ từ O*NET
  const [onetTechs, setOnetTechs] = useState<OnetTech[]>([])
  const [isLoadingTechs, setIsLoadingTechs] = useState(false)

  // State thêm kỹ năng theo form nhanh
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState<TechCategory>('framework')
  const [customMonths, setCustomMonths] = useState('')

  // State thêm theo danh mục (cũ)
  const [addState, setAddState] = useState<
    Record<string, { name: string; usagePeriod: string }>
  >({})

  // Fetch O*NET Tools & Technologies khi có onetSocCode
  useEffect(() => {
    let cancelled = false
    if (onetSocCode) {
      setIsLoadingTechs(true)
      onetService
        .getOccupationTech(onetSocCode)
        .then((items) => {
          if (!cancelled) {
            setOnetTechs(items)
            setIsLoadingTechs(false)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setOnetTechs([])
            setIsLoadingTechs(false)
          }
        })
    } else {
      setOnetTechs([])
    }

    return () => {
      cancelled = true
    }
  }, [onetSocCode])

  function handleEdit() {
    setEntries(data)
    setAddState({})
    setCustomName('')
    setCustomMonths('')
    setIsEditing(true)
    setError(null)
  }

  function handleCancel() {
    setIsEditing(false)
    setError(null)
  }

  function addEntry(category: TechCategory, name: string, monthsStr: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const months = parseInt(monthsStr, 10)
    if (isNaN(months) || months < 0) return
    if (entries.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Kỹ năng "${trimmed}" đã có trong hồ sơ.`)
      return
    }

    setError(null)
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), category, name: trimmed, usagePeriod: months },
    ])
  }

  function handleQuickAddOnet(tech: OnetTech) {
    const cat = detectTechCategory(tech.example)
    setCustomName(tech.example)
    setCustomCategory(cat)
    // Mặc định 12 tháng kinh nghiệm nếu chưa nhập
    if (!customMonths) setCustomMonths('12')
  }

  function handleAddCustom() {
    if (!customName.trim()) return
    const months = customMonths ? customMonths : '12'
    addEntry(customCategory, customName, months)
    setCustomName('')
    setCustomMonths('')
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

  const existingNames = new Set(
    (isEditing ? entries : data).map((e) => e.name.toLowerCase())
  )
  const filteredOnetTechs = onetTechs.filter(
    (t) => !existingNames.has(t.example.toLowerCase())
  )

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
        {/* Khu vực Gợi ý công nghệ O*NET khi đang chỉnh sửa */}
        {isEditing && (
          <div className="mb-6 rounded-xl border border-brand/20 bg-brand-subtle/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Gợi ý công nghệ O*NET {onetSocCode ? `[${onetSocCode}]` : ''}
              </div>
              {isLoadingTechs && (
                <div className="flex items-center gap-1 text-xs text-ink-muted">
                  <Loader2 className="size-3 animate-spin text-brand" />
                  Đang tải...
                </div>
              )}
            </div>

            {onetSocCode ? (
              filteredOnetTechs.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs text-ink-muted">
                    Bấm vào công nghệ bên dưới để thêm nhanh vào hồ sơ năng lực:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {filteredOnetTechs.slice(0, 30).map((t) => (
                      <button
                        key={t.example}
                        type="button"
                        onClick={() => handleQuickAddOnet(t)}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                          t.isHotTechnology
                            ? 'bg-brand/15 text-brand hover:bg-brand/25 border border-brand/30'
                            : 'bg-surface border border-border text-ink hover:bg-surface-2'
                        }`}
                      >
                        {t.isHotTechnology && (
                          <Flame className="size-3 text-orange-500" aria-label="Hot Technology" />
                        )}
                        <span>{t.example}</span>
                        <Plus className="size-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-muted">
                  {isLoadingTechs
                    ? 'Đang tìm kiếm gợi ý công nghệ...'
                    : 'Đã thêm hết công nghệ gợi ý hoặc chưa có dữ liệu O*NET.'}
                </p>
              )
            ) : (
              <p className="text-xs text-ink-muted">
                Hãy chọn <strong>Chức danh chuẩn O*NET</strong> ở mục Định hướng nghề nghiệp để nhận gợi ý công nghệ chuyên sâu phù hợp vị trí mục tiêu.
              </p>
            )}

            {/* Khung nhập nhanh kỹ năng (Quick Custom Add) */}
            <div className="mt-3.5 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[160px]">
                <Input
                  value={customName}
                  onChange={(e) => {
                    const val = e.target.value
                    setCustomName(val)
                    if (val) setCustomCategory(detectTechCategory(val))
                  }}
                  placeholder="Gõ tên kỹ năng (VD: React, Docker, Python...)"
                  className="h-9 text-xs"
                />
              </div>

              <div className="w-36">
                <Select
                  value={customCategory}
                  onValueChange={(val) => setCustomCategory(val as TechCategory)}
                >
                  <SelectTrigger aria-label="Danh mục kỹ năng" className="h-9 text-xs">
                    <SelectValue placeholder="Danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {TECH_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.key} value={cat.key} className="text-xs">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-24">
                <Input
                  type="number"
                  min={0}
                  placeholder="Tháng"
                  value={customMonths}
                  onChange={(e) => setCustomMonths(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handleAddCustom}
                disabled={!customName.trim()}
                className="h-9 text-xs"
              >
                <Plus className="size-3.5 mr-1" />
                Thêm
              </Button>
            </div>
          </div>
        )}

        {/* Danh sách kỹ năng theo từng danh mục */}
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
              <div className="flex items-center justify-between mb-2">
                <p className="text-ink-muted text-xs font-semibold uppercase tracking-wide">
                  {label}
                </p>
                <span className="text-ink-muted text-xs">
                  {displayEntries.length} kỹ năng
                </span>
              </div>

              <div className="mb-2 flex flex-wrap gap-2">
                {displayEntries.length === 0 && !isEditing && (
                  <ProfileEmptyState message="Chưa thêm" className="text-xs" />
                )}
                {displayEntries.map((e) => (
                  <Badge
                    key={e.id}
                    variant="default"
                    className="px-2.5 py-0.5"
                    onDismiss={isEditing ? () => removeEntry(e.id) : undefined}
                    dismissLabel={`Xóa kỹ năng ${e.name}`}
                  >
                    {e.name}
                    <span className="text-ink-muted ml-1">· {e.usagePeriod}th</span>
                  </Badge>
                ))}
              </div>

              {/* Thêm từ dropdown danh mục có sẵn */}
              {isEditing && available.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1">
                    <Select
                      value={s.name || undefined}
                      onValueChange={(val) =>
                        setAddState((prev) => ({
                          ...prev,
                          [key]: { ...s, name: val },
                        }))
                      }
                    >
                      <SelectTrigger aria-label={`Chọn ${label}`} className="h-8 text-xs">
                        <SelectValue placeholder={`Chọn từ danh mục ${label}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {available.map((n) => (
                          <SelectItem key={n} value={n} className="text-xs">
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
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
                    className="w-20 h-8 text-xs"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => {
                      if (!s.name) return
                      addEntry(key, s.name, s.usagePeriod || '12')
                      setAddState((prev) => ({
                        ...prev,
                        [key]: { name: '', usagePeriod: '' },
                      }))
                    }}
                    className="h-8 px-3 text-xs"
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
                Lưu kỹ năng
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
