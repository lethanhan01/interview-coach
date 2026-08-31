'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
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
} from '@/components/form'

interface JdFormProps {
  value: JdFormData
  onChange: (data: JdFormData) => void
  savedJobDescriptions?: SavedJobDescription[]
  selectedSavedJobDescriptionId?: string
  onSelectSavedJobDescription?: (id: string) => void
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
              <Select
                value={value.level}
                onValueChange={(val) => set('level', val)}
              >
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

