'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import type { JdFormData } from '@/lib/setup-types'
import { mapJdLevelToSfia } from '@/lib/setup-types'
import type { SavedJobDescription } from '@/lib/types'
import {
  BONUS_OPTIONS,
  JD_LEVEL_OPTIONS,
  POSITION_OPTIONS,
  TECH_STACK_OPTIONS,
} from '@/lib/interview-options'
import {
  FormField,
  FormLabel,
  FormControl,
} from '@/components/form'
import { onetService, type OnetOccupation, type OnetTech } from '@/services'
import { Briefcase, Loader2, Search, Sparkles, X } from 'lucide-react'

interface JdFormProps {
  value: JdFormData
  onChange: (data: JdFormData) => void
  savedJobDescriptions?: SavedJobDescription[]
  selectedSavedJobDescriptionId?: string
  onSelectSavedJobDescription?: (id: string) => void
}

export default function JdForm({ value, onChange }: JdFormProps) {
  const [techQuery, setTechQuery] = useState('')
  const [onetQuery, setOnetQuery] = useState('')
  const [onetResults, setOnetResults] = useState<OnetOccupation[]>([])
  const [isSearchingOnet, setIsSearchingOnet] = useState(false)
  const [isOnetDropdownOpen, setIsOnetDropdownOpen] = useState(false)
  const [onetTechSuggestions, setOnetTechSuggestions] = useState<OnetTech[]>([])
  const comboboxRef = useRef<HTMLDivElement>(null)

  const set = (field: keyof JdFormData, val: string) =>
    onChange({ ...value, [field]: val })

  // Đóng dropdown O*NET khi click ra ngoài
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

  // Tìm kiếm chức danh O*NET debounce khi mở dropdown
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

  // Lấy gợi ý công nghệ O*NET khi mã SOC thay đổi
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      if (value.onetSocCode) {
        onetService
          .getOccupationTech(value.onetSocCode)
          .then((techs) => {
            if (!cancelled) {
              setOnetTechSuggestions(techs)
            }
          })
          .catch(() => {
            if (!cancelled) {
              setOnetTechSuggestions([])
            }
          })
      } else {
        setOnetTechSuggestions([])
      }
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [value.onetSocCode])

  const handleSelectOnet = (occ: OnetOccupation) => {
    setIsOnetDropdownOpen(false)
    setOnetQuery('')
    const targetSfia =
      value.targetSfiaLevel ??
      (value.level ? mapJdLevelToSfia(value.level) : 3)
    onChange({
      ...value,
      onetSocCode: occ.socCode,
      onetOccupationTitle: occ.title,
      position: value.position.trim().length > 0 ? value.position : occ.title,
      targetSfiaLevel: targetSfia,
    })
  }

  const handleClearOnet = () => {
    setOnetTechSuggestions([])
    onChange({
      ...value,
      onetSocCode: undefined,
      onetOccupationTitle: undefined,
    })
  }

  const handleLevelChange = (val: string) => {
    const suggestedSfia = mapJdLevelToSfia(val)
    onChange({
      ...value,
      level: val,
      targetSfiaLevel: suggestedSfia,
    })
  }

  const toggleTech = (tech: string) =>
    onChange({
      ...value,
      techStack: value.techStack.includes(tech)
        ? value.techStack.filter((t) => t !== tech)
        : [...value.techStack, tech],
    })

  const removeTech = (tech: string) =>
    onChange({
      ...value,
      techStack: value.techStack.filter((t) => t !== tech),
    })

  const normalizedTechQuery = techQuery.trim().toLowerCase()
  const filteredTechGroups = useMemo(
    () =>
      Object.entries(TECH_STACK_OPTIONS)
        .map(
          ([category, techs]) =>
            [
              category,
              normalizedTechQuery
                ? techs.filter((tech) =>
                    tech.toLowerCase().includes(normalizedTechQuery)
                  )
                : techs,
            ] as const
        )
        .filter(([, techs]) => techs.length > 0),
    [normalizedTechQuery]
  )

  const reqHint =
    value.requirements.trim().length > 0 &&
    value.requirements.trim().length < 30
      ? 'Tối thiểu 30 ký tự'
      : undefined

  const jobHint =
    value.jobContent.trim().length > 0 && value.jobContent.trim().length < 30
      ? 'Tối thiểu 30 ký tự'
      : undefined

  return (
    <div className="flex flex-col gap-4">
      {/* Thông tin công ty */}
      <Card>
        <h2 className="text-ink mb-4 text-base font-semibold">
          Thông tin công ty
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField name="company">
            <FormLabel>Tên công ty</FormLabel>
            <FormControl>
              <Input
                value={value.company}
                onChange={(e) => set('company', e.target.value)}
                placeholder="VD: FPT Software, Shopee..."
              />
            </FormControl>
          </FormField>
          <FormField name="website">
            <FormLabel>Website công ty</FormLabel>
            <FormControl>
              <Input
                value={value.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://company.com"
              />
            </FormControl>
          </FormField>
        </div>
      </Card>

      {/* Vị trí tuyển dụng */}
      <Card>
        <h2 className="text-ink mb-4 text-base font-semibold">
          Vị trí tuyển dụng
        </h2>

        {/* Chức danh chuẩn O*NET (AI Matching) */}
        <div className="mb-4">
          <FormField name="onetOccupation">
            <div className="mb-1.5 flex items-center justify-between">
              <FormLabel>Chức danh chuẩn O*NET (AI Matching)</FormLabel>
              <span className="text-brand flex items-center gap-1 text-xs font-medium">
                <Sparkles className="size-3" aria-hidden="true" />
                Khuyến nghị để tối ưu phỏng vấn
              </span>
            </div>
            <FormControl>
              {value.onetSocCode && value.onetOccupationTitle ? (
                <div className="border-brand-subtle-border bg-brand-subtle/50 flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="bg-brand text-brand-fg flex size-7 shrink-0 items-center justify-center rounded-md">
                      <Briefcase className="size-3.5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-ink truncate text-sm font-semibold">
                        {value.onetOccupationTitle}
                      </p>
                      <p className="text-ink-muted text-xs">
                        Mã SOC: {value.onetSocCode}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearOnet}
                    aria-label="Bỏ chọn chức danh O*NET"
                    className="text-ink-muted hover:text-ink shrink-0"
                  >
                    <X className="size-4" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only sm:ml-1 sm:text-xs">
                      Bỏ chọn
                    </span>
                  </Button>
                </div>
              ) : (
                <div ref={comboboxRef} className="relative">
                  <div className="relative">
                    <Input
                      type="search"
                      value={onetQuery}
                      onChange={(e) => {
                        setOnetQuery(e.target.value)
                        setIsOnetDropdownOpen(true)
                      }}
                      onFocus={() => setIsOnetDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsOnetDropdownOpen(false)
                        }
                      }}
                      placeholder="Tìm kiếm chức danh O*NET (VD: Software Developers, Data Scientists...)"
                      aria-expanded={isOnetDropdownOpen}
                      aria-autocomplete="list"
                      aria-label="Tìm kiếm chức danh chuẩn O*NET"
                      className="pr-9"
                    />
                    <div className="text-ink-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      {isSearchingOnet ? (
                        <Loader2
                          className="text-brand size-4 animate-spin"
                          aria-hidden="true"
                        />
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
                          <Loader2
                            className="text-brand size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                          Đang tìm kiếm chức danh O*NET...
                        </div>
                      ) : onetResults.length === 0 ? (
                        <div className="text-ink-muted px-3 py-3 text-center text-xs">
                          Không tìm thấy chức danh O*NET phù hợp.
                        </div>
                      ) : (
                        onetResults.map((occ) => (
                          <button
                            key={occ.socCode}
                            type="button"
                            role="option"
                            aria-selected={value.onetSocCode === occ.socCode}
                            onClick={() => handleSelectOnet(occ)}
                            className="hover:bg-surface-2 focus-visible:bg-surface-2 flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none"
                          >
                            <div className="min-w-0">
                              <p className="text-ink truncate font-medium">
                                {occ.title}
                              </p>
                              {occ.matchedTitle &&
                                occ.matchedTitle !== occ.title && (
                                  <p className="text-ink-faint truncate text-[11px]">
                                    Khớp với: {occ.matchedTitle}
                                  </p>
                                )}
                            </div>
                            <Badge
                              variant="outline"
                              className="shrink-0 font-mono text-[10px]"
                            >
                              {occ.socCode}
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </FormControl>
          </FormField>
        </div>

        <FormField name="position" isRequired>
          <FormLabel>Vị trí</FormLabel>
          <FormControl>
            <Select
              value={value.position}
              onValueChange={(val) => set('position', val)}
            >
              <SelectTrigger id="jd-position" aria-label="Vị trí">
                <SelectValue placeholder="Chọn vị trí..." />
              </SelectTrigger>
              <SelectContent>
                {POSITION_OPTIONS.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        </FormField>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField name="level" isRequired>
            <FormLabel>Level yêu cầu</FormLabel>
            <FormControl>
              <Select value={value.level} onValueChange={handleLevelChange}>
                <SelectTrigger id="jd-level" aria-label="Level yêu cầu">
                  <SelectValue placeholder="Chọn level..." />
                </SelectTrigger>
                <SelectContent>
                  {JD_LEVEL_OPTIONS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormField>
          <FormField name="headcount">
            <FormLabel>Số lượng tuyển</FormLabel>
            <FormControl>
              <Input
                value={value.headcount}
                onChange={(e) => set('headcount', e.target.value)}
                placeholder="VD: 2 người"
              />
            </FormControl>
          </FormField>
          <FormField name="location">
            <FormLabel>Địa điểm làm việc</FormLabel>
            <FormControl>
              <Input
                value={value.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="VD: Hà Nội / Remote"
              />
            </FormControl>
          </FormField>
        </div>
      </Card>

      {/* Nội dung & Yêu cầu */}
      <Card>
        <h2 className="text-ink mb-4 text-base font-semibold">
          Nội dung & Yêu cầu
        </h2>
        <div className="flex flex-col gap-4">
          <FormField name="requirements">
            <FormLabel>Yêu cầu</FormLabel>
            <FormControl>
              <Textarea
                value={value.requirements}
                onChange={(e) => set('requirements', e.target.value)}
                rows={5}
                placeholder="Liệt kê yêu cầu về kinh nghiệm, kỹ năng, bằng cấp..."
              />
            </FormControl>
            {reqHint && (
              <p className="text-muted-foreground text-xs">{reqHint}</p>
            )}
          </FormField>
          <FormField name="jobContent">
            <FormLabel>Nội dung công việc</FormLabel>
            <FormControl>
              <Textarea
                value={value.jobContent}
                onChange={(e) => set('jobContent', e.target.value)}
                rows={5}
                placeholder="Mô tả các công việc, nhiệm vụ chính..."
              />
            </FormControl>
            {jobHint && (
              <p className="text-muted-foreground text-xs">{jobHint}</p>
            )}
          </FormField>

          <div>
            <p className="text-ink mb-1.5 text-sm font-medium">Tech Stack</p>
            <div className="border-border bg-surface flex flex-col gap-4 rounded-lg border p-4">
              {/* Gợi ý công nghệ từ O*NET khi có occupation */}
              {onetTechSuggestions.length > 0 && (
                <div className="border-brand-subtle-border bg-brand-subtle/40 rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-brand flex items-center gap-1.5 text-xs font-semibold">
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      Gợi ý công nghệ O*NET cho {value.onetOccupationTitle}
                    </span>
                    <span className="text-ink-muted text-xs">
                      Bấm để thêm nhanh vào Tech Stack
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {onetTechSuggestions.map((tech) => {
                      const selected = value.techStack.includes(tech.example)
                      return (
                        <Badge
                          key={tech.example}
                          variant={selected ? 'brand' : 'default'}
                          interactive
                          onClick={() => toggleTech(tech.example)}
                          aria-pressed={selected}
                          className="text-xs"
                        >
                          {selected ? '✓ ' : '+ '}
                          {tech.example}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              <FormField name="techQuery">
                <FormLabel>Tìm kiếm tech stack</FormLabel>
                <FormControl>
                  <Input
                    type="search"
                    value={techQuery}
                    onChange={(e) => setTechQuery(e.target.value)}
                    placeholder="VD: PyTorch, Terraform, Playwright..."
                  />
                </FormControl>
              </FormField>

              {value.techStack.length > 0 && (
                <div>
                  <p className="text-ink-muted mb-2 text-xs font-medium">
                    Đã chọn ({value.techStack.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {value.techStack.map((tech) => (
                      <Badge
                        key={tech}
                        variant="brand"
                        onDismiss={() => removeTech(tech)}
                        dismissLabel={`Bỏ chọn ${tech}`}
                        className="text-xs"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {filteredTechGroups.length === 0 ? (
                <p className="border-border text-ink-muted rounded-lg border border-dashed px-3 py-2 text-xs">
                  Không tìm thấy tech stack phù hợp.
                </p>
              ) : (
                filteredTechGroups.map(([category, techs]) => (
                  <div key={category}>
                    <p className="text-ink-muted mb-2 text-xs font-medium">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {techs.map((tech) => {
                        const selected = value.techStack.includes(tech)
                        return (
                          <Badge
                            key={tech}
                            variant={selected ? 'brand' : 'default'}
                            interactive
                            onClick={() => toggleTech(tech)}
                            aria-pressed={selected}
                            className="text-xs"
                          >
                            {tech}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
              {value.techStack.length > 0 && (
                <p className="text-ink-muted text-xs">
                  Tech stack sẽ lưu: {value.techStack.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Phúc lợi & Lương */}
      <Card>
        <h2 className="text-ink mb-4 text-base font-semibold">
          Phúc lợi & Lương
        </h2>
        <div className="flex flex-col gap-4">
          <FormField name="salary">
            <FormLabel>Lương</FormLabel>
            <FormControl>
              <Input
                value={value.salary}
                onChange={(e) => set('salary', e.target.value)}
                placeholder="VD: 15-25 triệu VNĐ"
              />
            </FormControl>
          </FormField>

          <FormField name="bonus">
            <FormLabel>Thưởng</FormLabel>
            <FormControl>
              <Select
                value={value.bonus || ''}
                onValueChange={(val) => set('bonus', val)}
              >
                <SelectTrigger id="jd-bonus" aria-label="Thưởng">
                  <SelectValue placeholder="Chọn hình thức thưởng..." />
                </SelectTrigger>
                <SelectContent>
                  {BONUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormField>
          <FormField name="benefits">
            <FormLabel>Quyền lợi nhân viên</FormLabel>
            <FormControl>
              <Textarea
                value={value.benefits}
                onChange={(e) => set('benefits', e.target.value)}
                rows={3}
                placeholder="VD: Bảo hiểm sức khỏe, 12 ngày phép, MacBook..."
              />
            </FormControl>
          </FormField>
        </div>
      </Card>
    </div>
  )
}
