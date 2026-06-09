'use client'

import { TECH_STACK_OPTIONS } from '@/components/profile/constants'
import type { JdFormData } from '@/app/(app)/setup/page'

interface JdFormProps {
  value: JdFormData
  onChange: (data: JdFormData) => void
}

const inputCls =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand'
const textareaCls =
  'w-full resize-none rounded-xl border border-border bg-surface p-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tên công ty" required>
          <input
            value={value.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder="VD: FPT Software, Shopee..."
            className={inputCls}
          />
        </Field>
        <Field label="Website công ty">
          <input
            value={value.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://company.com"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Vị trí tuyển dụng" required>
          <input
            value={value.position}
            onChange={(e) => set('position', e.target.value)}
            placeholder="VD: Frontend Developer"
            className={inputCls}
          />
        </Field>
        <Field label="Số lượng tuyển">
          <input
            value={value.headcount}
            onChange={(e) => set('headcount', e.target.value)}
            placeholder="VD: 2 người"
            className={inputCls}
          />
        </Field>
        <Field label="Địa điểm làm việc">
          <input
            value={value.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="VD: Hà Nội / Remote"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Yêu cầu" required>
        <textarea
          value={value.requirements}
          onChange={(e) => set('requirements', e.target.value)}
          rows={5}
          placeholder="Liệt kê yêu cầu về kinh nghiệm, kỹ năng, bằng cấp..."
          className={textareaCls}
        />
        {value.requirements.trim().length > 0 && value.requirements.trim().length < 30 && (
          <span className="text-xs text-ink-faint">Tối thiểu 30 ký tự</span>
        )}
      </Field>

      <Field label="Nội dung công việc" required>
        <textarea
          value={value.jobContent}
          onChange={(e) => set('jobContent', e.target.value)}
          rows={5}
          placeholder="Mô tả các công việc, nhiệm vụ chính..."
          className={textareaCls}
        />
        {value.jobContent.trim().length > 0 && value.jobContent.trim().length < 30 && (
          <span className="text-xs text-ink-faint">Tối thiểu 30 ký tự</span>
        )}
      </Field>

      <Field label="Tech Stack">
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
      </Field>

      <Field label="Quyền lợi nhân viên">
        <textarea
          value={value.benefits}
          onChange={(e) => set('benefits', e.target.value)}
          rows={3}
          placeholder="VD: Bảo hiểm sức khỏe, 12 ngày phép, MacBook..."
          className={textareaCls}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Lương">
          <input
            value={value.salary}
            onChange={(e) => set('salary', e.target.value)}
            placeholder="VD: 15-25 triệu VNĐ"
            className={inputCls}
          />
        </Field>
        <Field label="Thưởng">
          <input
            value={value.bonus}
            onChange={(e) => set('bonus', e.target.value)}
            placeholder="VD: Tháng 13, thưởng KPI hàng quý"
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  )
}
