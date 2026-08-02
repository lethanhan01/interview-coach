'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { JdFormData } from '@/lib/setup-types'
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
  FormDescription,
} from '@/components/form'

interface JdFormProps {
  value: JdFormData
  onChange: (data: JdFormData) => void
  savedJobDescriptions?: SavedJobDescription[]
  selectedSavedJobDescriptionId?: string
  onSelectSavedJobDescription?: (id: string) => void
}

const selectCls =
  'w-full px-4 py-2.5 rounded-lg text-sm text-ink bg-surface border border-border outline-none transition-colors focus:ring-2 focus:ring-brand focus:border-brand'

function SelectField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-ink text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function JdForm({ value, onChange }: JdFormProps) {
  const [techQuery, setTechQuery] = useState('')
  const set = (field: keyof JdFormData, val: string) =>
    onChange({ ...value, [field]: val })

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
        <SelectField label="Vị trí" htmlFor="jd-position">
          <select
            id="jd-position"
            value={value.position}
            onChange={(e) => set('position', e.target.value)}
            className={selectCls}
            required
          >
            <option value="">Chọn vị trí...</option>
            {POSITION_OPTIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </SelectField>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Level yêu cầu" htmlFor="jd-level">
            <select
              id="jd-level"
              value={value.level}
              onChange={(e) => set('level', e.target.value)}
              className={selectCls}
              required
            >
              <option value="">Chọn level...</option>
              {JD_LEVEL_OPTIONS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </SelectField>
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
                      <button
                        key={tech}
                        type="button"
                        onClick={() => removeTech(tech)}
                        aria-label={`Bỏ chọn ${tech}`}
                        className="border-brand-subtle-border bg-brand-subtle text-brand-subtle-fg hover:bg-surface-raised inline-flex max-w-full items-center gap-1 rounded-full border px-3 py-1 text-left text-xs transition-colors"
                      >
                        <span className="min-w-0 break-words">{tech}</span>
                        <X className="size-3 shrink-0" aria-hidden="true" />
                      </button>
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
                          <button
                            key={tech}
                            type="button"
                            onClick={() => toggleTech(tech)}
                            aria-pressed={selected}
                            className={[
                              'max-w-full rounded-full border px-3 py-1 text-left text-xs transition-colors',
                              'whitespace-normal break-words',
                              selected
                                ? 'border-brand-subtle-border bg-brand-subtle text-brand-subtle-fg'
                                : 'border-border text-ink-muted hover:border-brand-muted',
                            ].join(' ')}
                          >
                            {tech}
                          </button>
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

          <SelectField label="Thưởng" htmlFor="jd-bonus">
            <select
              id="jd-bonus"
              value={value.bonus}
              onChange={(e) => set('bonus', e.target.value)}
              className={selectCls}
            >
              <option value="">Chọn hình thức thưởng...</option>
              {BONUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </SelectField>
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
