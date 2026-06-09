'use client'

import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { TECH_STACK_OPTIONS } from '@/components/profile/constants'
import type { JdFormData } from '@/app/(app)/setup/page'
import { POSITION_OPTIONS, BONUS_OPTIONS } from '@/app/(app)/setup/page'

interface JdFormProps {
  value: JdFormData
  onChange: (data: JdFormData) => void
}

const selectCls =
  'w-full px-4 py-2.5 rounded-xl text-sm text-ink bg-surface border border-border outline-none transition-colors focus:ring-2 focus:ring-brand focus:border-brand'

function SelectField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  )
}

export default function JdForm({ value, onChange }: JdFormProps) {
  const set = (field: keyof JdFormData, val: string) => onChange({ ...value, [field]: val })

  const toggleTech = (tech: string) =>
    onChange({
      ...value,
      techStack: value.techStack.includes(tech)
        ? value.techStack.filter((t) => t !== tech)
        : [...value.techStack, tech],
    })

  const reqHint =
    value.requirements.trim().length > 0 && value.requirements.trim().length < 30
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
        <h2 className="mb-4 text-base font-semibold text-ink">Thông tin công ty</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Tên công ty"
            value={value.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder="VD: FPT Software, Shopee..."
          />
          <Input
            label="Website công ty"
            value={value.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://company.com"
          />
        </div>
      </Card>

      {/* Vị trí tuyển dụng */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink">Vị trí tuyển dụng</h2>
        <select
          value={value.position}
          onChange={(e) => set('position', e.target.value)}
          className={selectCls}
        >
          <option value="">Chọn vị trí...</option>
          {POSITION_OPTIONS.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Số lượng tuyển"
            value={value.headcount}
            onChange={(e) => set('headcount', e.target.value)}
            placeholder="VD: 2 người"
          />
          <Input
            label="Địa điểm làm việc"
            value={value.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="VD: Hà Nội / Remote"
          />
        </div>
      </Card>

      {/* Nội dung & Yêu cầu */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink">Nội dung & Yêu cầu</h2>
        <div className="flex flex-col gap-4">
          <Textarea
            label="Yêu cầu"
            value={value.requirements}
            onChange={(e) => set('requirements', e.target.value)}
            rows={5}
            placeholder="Liệt kê yêu cầu về kinh nghiệm, kỹ năng, bằng cấp..."
            hint={reqHint}
          />
          <Textarea
            label="Nội dung công việc"
            value={value.jobContent}
            onChange={(e) => set('jobContent', e.target.value)}
            rows={5}
            placeholder="Mô tả các công việc, nhiệm vụ chính..."
            hint={jobHint}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Tech Stack</p>
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
              {Object.entries(TECH_STACK_OPTIONS).map(([category, techs]) => (
                <div key={category}>
                  <p className="mb-2 text-xs font-medium text-ink-muted">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {techs.map((tech) => (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => toggleTech(tech)}
                        className={[
                          'rounded-full border px-3 py-1 text-xs transition-colors',
                          value.techStack.includes(tech)
                            ? 'border-brand bg-brand-50 text-brand'
                            : 'border-border text-ink-muted hover:border-brand-muted',
                        ].join(' ')}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {value.techStack.length > 0 && (
                <p className="text-xs text-ink-muted">Đã chọn: {value.techStack.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Phúc lợi & Lương */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink">Phúc lợi & Lương</h2>
        <div className="flex flex-col gap-4">
          <Input
            label="Lương"
            value={value.salary}
            onChange={(e) => set('salary', e.target.value)}
            placeholder="VD: 15-25 triệu VNĐ"
          />
          <SelectField label="Thưởng">
            <select
              value={value.bonus}
              onChange={(e) => set('bonus', e.target.value)}
              className={selectCls}
            >
              <option value="">Chọn hình thức thưởng...</option>
              {BONUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </SelectField>
          <Textarea
            label="Quyền lợi nhân viên"
            value={value.benefits}
            onChange={(e) => set('benefits', e.target.value)}
            rows={3}
            placeholder="VD: Bảo hiểm sức khỏe, 12 ngày phép, MacBook..."
          />
        </div>
      </Card>
    </div>
  )
}
