'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import type { SessionType, ContextPack } from '@/lib/types'
import Button from '@/components/ui/Button'
import JdForm from '@/components/setup/JdForm'
import ConfigForm from '@/components/setup/ConfigForm'
import ConfirmStep from '@/components/setup/ConfirmStep'

// ── Constants & Types ─────────────────────────────────────────────────────────

export const DURATION_OPTIONS = [
  { value: 30 as const, label: '30 phút', numQuestions: 5 },
  { value: 60 as const, label: '1 tiếng', numQuestions: 8 },
  { value: 90 as const, label: '1 tiếng rưỡi', numQuestions: 10 },
]

export const INTERVIEWER_STYLES = [
  {
    value: 'friendly' as const,
    label: 'Thân thiện & Nhẹ nhàng',
    description: 'Người phỏng vấn cởi mở, tạo không khí thoải mái, phù hợp cho fresher',
  },
  {
    value: 'professional' as const,
    label: 'Chuyên nghiệp & Trung lập',
    description: 'Phong cách chuẩn mực, tập trung vào năng lực thực tế',
  },
  {
    value: 'challenging' as const,
    label: 'Thách thức & Áp lực',
    description: 'Câu hỏi khó, đào sâu, mô phỏng phỏng vấn công ty lớn / nước ngoài',
  },
] as const

export type InterviewDuration = 30 | 60 | 90
export type InterviewerStyle = 'friendly' | 'professional' | 'challenging'

export interface JdFormData {
  company: string
  website: string
  position: string
  headcount: string
  location: string
  requirements: string
  jobContent: string
  techStack: string[]
  benefits: string
  salary: string
  bonus: string
}

export const EMPTY_JD: JdFormData = {
  company: '',
  website: '',
  position: '',
  headcount: '',
  location: '',
  requirements: '',
  jobContent: '',
  techStack: [],
  benefits: '',
  salary: '',
  bonus: '',
}

export const POSITION_OPTIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full-stack Developer',
  'Mobile Developer (iOS)',
  'Mobile Developer (Android)',
  'Flutter Developer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Data Analyst',
  'Data Engineer',
  'AI/ML Engineer',
  'QA/Tester',
  'UI/UX Designer',
  'Business Analyst',
  'Product Manager',
]

export const BONUS_OPTIONS = [
  'Tháng 13 (1 lần/năm)',
  '2 lần/năm',
  'Hàng quý',
  'Theo KPI',
  'Linh hoạt',
  'Không có',
]

const JD_DRAFT_KEY = 'interviewcoach_jd_draft'

export function isJdValid(form: JdFormData): boolean {
  return (
    form.company.trim().length > 0 &&
    form.position.trim().length > 0 &&
    form.requirements.trim().length >= 30 &&
    form.jobContent.trim().length >= 30
  )
}

export function serializeJd(form: JdFormData, style: InterviewerStyle): string {
  const lines: string[] = [
    `Tên công ty: ${form.company}`,
    form.website ? `Website: ${form.website}` : '',
    `Vị trí tuyển dụng: ${form.position}`,
    form.headcount ? `Số lượng tuyển: ${form.headcount}` : '',
    form.location ? `Địa điểm làm việc: ${form.location}` : '',
    '',
    'Yêu cầu:',
    form.requirements,
    '',
    'Nội dung công việc:',
    form.jobContent,
    form.techStack.length > 0 ? `\nTech Stack: ${form.techStack.join(', ')}` : '',
    form.benefits ? `\nQuyền lợi:\n${form.benefits}` : '',
    form.salary ? `\nLương: ${form.salary}` : '',
    form.bonus ? `\nThưởng: ${form.bonus}` : '',
    `\nPhong cách phỏng vấn: ${INTERVIEWER_STYLES.find((s) => s.value === style)!.label}`,
  ]
  return lines.filter(Boolean).join('\n')
}

// ── Stepper ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3
const STEP_LABELS: Record<Step, string> = { 1: 'Job Description', 2: 'Cấu hình', 3: 'Xác nhận' }

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [jd, setJd] = useState<JdFormData>(() => {
    if (typeof window === 'undefined') return EMPTY_JD
    try {
      const saved = localStorage.getItem(JD_DRAFT_KEY)
      if (saved) return JSON.parse(saved) as JdFormData
    } catch {
      // ignore malformed data
    }
    return EMPTY_JD
  })
  const [sessionType, setSessionType] = useState<SessionType>('hr')
  const [contextPack, setContextPack] = useState<ContextPack>('VN')
  const [duration, setDuration] = useState<InterviewDuration>(30)
  const [interviewerStyle, setInterviewerStyle] = useState<InterviewerStyle>('professional')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const jdHasContent =
    jd.company.trim().length > 0 ||
    jd.position.trim().length > 0 ||
    jd.requirements.trim().length > 0 ||
    jd.jobContent.trim().length > 0

  useEffect(() => {
    try {
      localStorage.setItem(JD_DRAFT_KEY, JSON.stringify(jd))
    } catch {
      // ignore storage errors
    }
  }, [jd])

  function resetJd() {
    setJd(EMPTY_JD)
    try {
      localStorage.removeItem(JD_DRAFT_KEY)
    } catch {
      // ignore
    }
  }

  const numQuestions = DURATION_OPTIONS.find((d) => d.value === duration)!.numQuestions

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      const jobDescription = serializeJd(jd, interviewerStyle)
      const data = await apiClient.post<{ id: string }>('/sessions', {
        jobDescription,
        sessionType,
        contextPack,
        numQuestions,
      })
      router.push(`/sessions/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo phiên phỏng vấn')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Stepper */}
      <div className="mb-10 flex items-start gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-150',
                  s === step
                    ? 'bg-brand text-white ring-4 ring-brand-200'
                    : s < step
                      ? 'bg-brand text-white'
                      : 'bg-border text-ink-faint',
                ].join(' ')}
              >
                {s < step ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span
                className={[
                  'hidden text-xs sm:block',
                  s === step ? 'font-medium text-ink' : 'text-ink-faint',
                ].join(' ')}
              >
                {STEP_LABELS[s]}
              </span>
            </div>
            {s < 3 && (
              <div
                className={[
                  'mb-4 h-px w-10 transition-all duration-150',
                  s < step ? 'bg-brand' : 'bg-border',
                ].join(' ')}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Job Description Form */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-xl font-semibold text-ink">Thông tin Job Description</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Điền thông tin JD để AI tạo câu hỏi phỏng vấn phù hợp nhất.
            </p>
          </div>
          <JdForm value={jd} onChange={setJd} />
          <div className="flex items-center justify-between">
            {jdHasContent ? (
              <Button variant="ghost" onClick={resetJd}>
                Đặt lại
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={() => setStep(2)} disabled={!isJdValid(jd)}>
              Tiếp theo
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — Config */}
      {step === 2 && (
        <div className="flex flex-col gap-7">
          <h1 className="text-xl font-semibold text-ink">Cấu hình phiên phỏng vấn</h1>
          <ConfigForm
            sessionType={sessionType}
            setSessionType={setSessionType}
            contextPack={contextPack}
            setContextPack={setContextPack}
            duration={duration}
            setDuration={setDuration}
            interviewerStyle={interviewerStyle}
            setInterviewerStyle={setInterviewerStyle}
          />
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Quay lại
            </Button>
            <Button onClick={() => setStep(3)}>Tiếp theo</Button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-semibold text-ink">Xác nhận</h1>
            <p className="mt-1 text-sm text-ink-muted">Kiểm tra lại trước khi bắt đầu phiên phỏng vấn.</p>
          </div>
          <ConfirmStep
            jd={jd}
            sessionType={sessionType}
            contextPack={contextPack}
            duration={duration}
            interviewerStyle={interviewerStyle}
            error={error}
          />
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Quay lại
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Bắt đầu phỏng vấn
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
