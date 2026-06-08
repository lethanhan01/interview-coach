'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import type { SessionType, ContextPack } from '@/lib/types'
import Button from '@/components/ui/Button'

type Step = 1 | 2 | 3

const SESSION_TYPES: { value: SessionType; label: string; description: string }[] = [
  { value: 'hr', label: 'HR / Behavioral', description: 'Câu hỏi về kinh nghiệm, soft skills, và tình huống' },
  { value: 'technical', label: 'Technical', description: 'Câu hỏi kỹ thuật chuyên sâu theo JD' },
  { value: 'mixed', label: 'Mixed', description: 'Kết hợp cả HR và Technical' },
]

const CONTEXT_PACKS: { value: ContextPack; label: string; desc: string }[] = [
  { value: 'VN', label: 'Việt Nam', desc: 'Phong cách phỏng vấn Việt Nam, rubric phù hợp văn hóa địa phương' },
  { value: 'Western', label: 'Western', desc: 'STAR method, behavioral focus, phong cách công ty nước ngoài' },
]

const STEP_LABELS: Record<Step, string> = {
  1: 'Job Description',
  2: 'Cấu hình',
  3: 'Xác nhận',
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [jd, setJd] = useState('')
  const [sessionType, setSessionType] = useState<SessionType>('hr')
  const [contextPack, setContextPack] = useState<ContextPack>('VN')
  const [numQuestions] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const jdValid = jd.trim().length >= 100

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      const data = await apiClient.post<{ id: string }>('/sessions', {
        jobDescription: jd.trim(),
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

      {/* Step 1 — Job Description */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-xl font-semibold text-ink">Dán Job Description</h1>
            <p className="mt-1 text-sm text-ink-muted">Tối thiểu 100 ký tự để AI tạo câu hỏi phù hợp.</p>
          </div>
          <label htmlFor="jd-input" className="sr-only">
            Nội dung Job Description
          </label>
          <textarea
            id="jd-input"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={12}
            placeholder="Dán nội dung JD vào đây..."
            className="w-full resize-none rounded-xl border border-border bg-surface p-4 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${jdValid ? 'text-success' : 'text-ink-faint'}`}>
              {jd.trim().length} / 100 ký tự
            </span>
            <Button onClick={() => setStep(2)} disabled={!jdValid}>
              Tiếp theo
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — Configuration */}
      {step === 2 && (
        <div className="flex flex-col gap-7">
          <div>
            <h1 className="text-xl font-semibold text-ink">Chọn loại phỏng vấn</h1>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-ink">Loại phỏng vấn</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SESSION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSessionType(t.value)}
                  className={[
                    'rounded-xl border-2 p-4 text-left transition-all duration-150',
                    sessionType === t.value
                      ? 'border-brand bg-brand-50 shadow-card'
                      : 'border-border bg-surface hover:border-brand-muted',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-ink">{t.label}</span>
                    {sessionType === t.value && (
                      <span className="size-4 rounded-full bg-brand flex items-center justify-center shrink-0">
                        <span className="size-1.5 rounded-full bg-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-ink">Context Pack</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CONTEXT_PACKS.map((cp) => (
                <button
                  key={cp.value}
                  type="button"
                  onClick={() => setContextPack(cp.value)}
                  className={[
                    'rounded-xl border-2 p-4 text-left transition-all duration-150',
                    contextPack === cp.value
                      ? 'border-brand bg-brand-50 shadow-card'
                      : 'border-border bg-surface hover:border-brand-muted',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-ink">{cp.label}</span>
                    {contextPack === cp.value && (
                      <span className="size-4 rounded-full bg-brand flex items-center justify-center shrink-0">
                        <span className="size-1.5 rounded-full bg-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">{cp.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Quay lại
            </Button>
            <Button onClick={() => setStep(3)}>
              Tiếp theo
            </Button>
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

          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm">
            <div className="flex justify-between py-2 border-b border-brand-200/50">
              <span className="text-ink-muted">Loại phỏng vấn</span>
              <span className="font-medium text-ink capitalize">{sessionType}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-brand-200/50">
              <span className="text-ink-muted">Context Pack</span>
              <span className="font-medium text-ink">{contextPack}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-brand-200/50">
              <span className="text-ink-muted">Số câu hỏi</span>
              <span className="font-medium text-ink">{numQuestions}</span>
            </div>
            <div className="flex justify-between py-2 gap-4">
              <span className="text-ink-muted shrink-0">JD</span>
              <span className="max-w-xs truncate font-medium text-ink text-right">{jd.slice(0, 60)}...</span>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

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
