'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { prepService, sessionService } from '@/services'
import type {
  ContextPack,
  OutputLanguage,
  SaveJobDescriptionPayload,
  SavedJobDescription,
  Session,
  SessionType,
} from '@/lib/types'

import {
  type JdFormData,
  type InterviewDuration,
  DURATION_OPTIONS,
  EMPTY_JD,
  isJdValid,
} from '@/lib/setup-types'
import Button from '@/components/ui/Button'
import JdForm from '@/components/setup/JdForm'
import ConfigForm from '@/components/setup/ConfigForm'
import ConfirmStep from '@/components/setup/ConfirmStep'
import SavedJdPicker from '@/components/setup/SavedJdPicker'
import { ArrowLeft } from 'lucide-react'
import { getJdLevelLabel, normalizeJdLevel } from '@/lib/interview-options'
import { cn } from '@/lib/utils'

// ── Constants & Types (re-exported from @/lib/setup-types) ───────────────────
// The actual definitions live in lib/setup-types.ts so that components/setup/*
// can import them without depending on the app layer.
export type { JdFormData, InterviewDuration } from '@/lib/setup-types'
export { DURATION_OPTIONS, EMPTY_JD, isJdValid } from '@/lib/setup-types'

// ── Private helpers ───────────────────────────────────────────────────────────

function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function normalizeJdFormData(
  value: Partial<Record<keyof JdFormData, unknown>> | null | undefined
): JdFormData {
  return {
    company: text(value?.company),
    website: text(value?.website),
    position: text(value?.position),
    level: text(value?.level),
    headcount: text(value?.headcount),
    location: text(value?.location),
    requirements: text(value?.requirements),
    jobContent: text(value?.jobContent),
    techStack: stringArray(value?.techStack),
    benefits: text(value?.benefits),
    salary: text(value?.salary),
    bonus: text(value?.bonus),
  }
}

const JD_DRAFT_KEY = 'interviewcoach_jd_draft'

function extractSerializedJdLevel(jobDescription: string): string {
  const match = jobDescription.match(/^Level yêu cầu:\s*(.+)$/im)
  return normalizeJdLevel(match?.[1])
}

export function serializeJd(form: JdFormData): string {
  const lines: string[] = [
    `Tên công ty: ${form.company}`,
    form.website ? `Website: ${form.website}` : '',
    `Vị trí tuyển dụng: ${form.position}`,
    `Level yêu cầu: ${getJdLevelLabel(form.level)}`,
    form.headcount ? `Số lượng tuyển: ${form.headcount}` : '',
    form.location ? `Địa điểm làm việc: ${form.location}` : '',
    '',
    'Yêu cầu:',
    form.requirements,
    '',
    'Nội dung công việc:',
    form.jobContent,
    form.techStack.length > 0
      ? `\nTech Stack: ${form.techStack.join(', ')}`
      : '',
    form.benefits ? `\nQuyền lợi:\n${form.benefits}` : '',
    form.salary ? `\nLương: ${form.salary}` : '',
    form.bonus ? `\nThưởng: ${form.bonus}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

function optional(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function toSavedJobDescriptionPayload(
  form: JdFormData
): SaveJobDescriptionPayload {
  return {
    companyName: form.company.trim(),
    companyWebsite: optional(form.website),
    jobTitle: form.position.trim(),
    level: form.level.trim(),
    headcount: optional(form.headcount),
    location: optional(form.location),
    requirements: form.requirements.trim(),
    jobContent: form.jobContent.trim(),
    techStack: form.techStack,
    benefits: optional(form.benefits),
    salary: optional(form.salary),
    bonus: optional(form.bonus),
  }
}

function resolveSessionLanguage(contextPack: ContextPack): OutputLanguage {
  return contextPack === 'Western' ? 'en' : 'vi'
}

function resolveSavedJobDescriptionLevel(
  item: SavedJobDescription,
  sessions: Session[] = []
): string {
  const savedLevel = normalizeJdLevel(item.level)
  if (savedLevel) return savedLevel

  return (
    sessions
      .filter((session) => session.savedJobDescriptionId === item.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((session) => extractSerializedJdLevel(session.jobDescription))
      .find(Boolean) ?? ''
  )
}

function hydrateSavedJobDescriptionLevels(
  items: SavedJobDescription[],
  sessions: Session[]
): SavedJobDescription[] {
  return items.map((item) => {
    const level = resolveSavedJobDescriptionLevel(item, sessions)
    return level && level !== item.level ? { ...item, level } : item
  })
}

function savedJobDescriptionToForm(
  item: SavedJobDescription,
  sessions: Session[] = []
): JdFormData {
  return normalizeJdFormData({
    company: item.companyName,
    website: item.companyWebsite,
    position: item.jobTitle,
    level: resolveSavedJobDescriptionLevel(item, sessions),
    headcount: item.headcount,
    location: item.location,
    requirements: item.requirements,
    jobContent: item.jobContent,
    techStack: item.techStack,
    benefits: item.benefits,
    salary: item.salary,
    bonus: item.bonus,
  })
}

// ── Stepper ───────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3
const STEP_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Job Description',
  2: 'Cấu hình',
  3: 'Xác nhận',
}

// ── Page ─────────────────────────────────────────────────────────────────────

function SetupPageLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="border-brand size-8 animate-spin rounded-full border-2 border-t-transparent" />
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={<SetupPageLoading />}>
      <SetupPageContent />
    </Suspense>
  )
}

function SetupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>(0)
  const [jdPickerReady, setJdPickerReady] = useState(false)
  const [jd, setJd] = useState<JdFormData>(() => {
    if (typeof window === 'undefined') return EMPTY_JD
    try {
      const saved = localStorage.getItem(JD_DRAFT_KEY)
      if (saved)
        return normalizeJdFormData(JSON.parse(saved) as Partial<JdFormData>)
    } catch {
      // ignore malformed data
    }
    return EMPTY_JD
  })
  const [sessionType, setSessionType] = useState<SessionType>('hr')
  const [contextPack, setContextPack] = useState<ContextPack>('VN')
  const [duration, setDuration] = useState<InterviewDuration>(30)
  const [savedJobDescriptions, setSavedJobDescriptions] = useState<
    SavedJobDescription[]
  >([])
  const [selectedSavedJobDescriptionId, setSelectedSavedJobDescriptionId] =
    useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const jdHasContent =
    jd.company.trim().length > 0 ||
    jd.position.trim().length > 0 ||
    jd.level.trim().length > 0 ||
    jd.requirements.trim().length > 0 ||
    jd.jobContent.trim().length > 0

  useEffect(() => {
    try {
      localStorage.setItem(JD_DRAFT_KEY, JSON.stringify(jd))
    } catch {
      // ignore storage errors
    }
  }, [jd])

  useEffect(() => {
    let cancelled = false
    const jdId = searchParams.get('jdId')
    const isNew = searchParams.get('new') === '1'

    async function loadSavedJobDescriptions() {
      try {
        const itemsData = await prepService.getSavedJobDescriptions()
        if (!cancelled) {
          let items = itemsData
          let sessions: Session[] = []

          if (items.some((item) => !normalizeJdLevel(item.level))) {
            try {
              sessions = await sessionService.getSessions()
              items = hydrateSavedJobDescriptionLevels(items, sessions)
            } catch {
              // Best-effort fallback for legacy JD records saved before level existed.
            }
          }

          if (cancelled) return
          setSavedJobDescriptions(items)

          if (jdId) {
            // Đến từ jd-library với JD cụ thể → pre-fill và vào step 1
            const match = items.find((i) => i.id === jdId)
            if (match) {
              setJd(savedJobDescriptionToForm(match, sessions))
              setSelectedSavedJobDescriptionId(match.id)
            }
            setStep(1)
          } else if (isNew || items.length === 0) {
            // Tạo mới hoặc chưa có JD nào → vào thẳng step 1
            setStep(1)
          }
          // else: có JD, không có param → hiện picker (step 0)
          setJdPickerReady(true)
        }
      } catch {
        if (!cancelled) {
          setSavedJobDescriptions([])
          setStep(1)
          setJdPickerReady(true)
        }
      }
    }

    void loadSavedJobDescriptions()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateJd(data: JdFormData) {
    setJd(normalizeJdFormData(data))
    setSelectedSavedJobDescriptionId('')
  }

  function selectSavedJobDescription(id: string) {
    setSelectedSavedJobDescriptionId(id)
    const item = savedJobDescriptions.find((saved) => saved.id === id)
    if (item) setJd(savedJobDescriptionToForm(item))
  }

  function handlePickerSelect(item: SavedJobDescription) {
    setJd(savedJobDescriptionToForm(item))
    setSelectedSavedJobDescriptionId(item.id)
    setStep(1)
  }

  function handlePickerNew() {
    setJd(EMPTY_JD)
    setSelectedSavedJobDescriptionId('')
    setStep(1)
  }

  function resetJd() {
    setJd(EMPTY_JD)
    setSelectedSavedJobDescriptionId('')
    try {
      localStorage.removeItem(JD_DRAFT_KEY)
    } catch {
      // ignore
    }
  }

  const numQuestions = DURATION_OPTIONS.find(
    (d) => d.value === duration
  )!.numQuestions

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      const jobDescription = serializeJd(jd)
      const savedJobDescription = await prepService.saveJobDescription(
        toSavedJobDescriptionPayload(jd)
      )
      const data = await sessionService.createSession({
        jobDescription,
        sessionType,
        contextPack,
        language: resolveSessionLanguage(contextPack),
        numQuestions,
        targetRoles: [jd.position],
        savedJobDescriptionId: savedJobDescription.id,
      })
      router.push(`/sessions/${data.id}`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể tạo phiên phỏng vấn'
      )
      setSubmitting(false)
    }
  }


  // Hiện loading spinner khi đang fetch danh sách JD (chỉ ở step 0)
  if (step === 0 && !jdPickerReady) {
    return <SetupPageLoading />
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step 0 — Saved JD Picker (no stepper) */}
      {step === 0 && (
        <SavedJdPicker
          items={savedJobDescriptions}
          onSelect={handlePickerSelect}
          onNew={handlePickerNew}
        />
      )}

      {/* Stepper — only shown from step 1 onwards */}
      {step >= 1 && (
        <>
          {/* Back to JD library */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/jd-library')}
            className="text-ink-muted hover:text-brand mb-6 -ml-2 flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Thư viện JD
          </Button>

          <div className="mb-10 flex items-start gap-2">
            {([1, 2, 3] as (1 | 2 | 3)[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-150',
                      s === step
                        ? 'bg-brand ring-brand-subtle-border text-white ring-4'
                        : s < step
                          ? 'bg-brand text-white'
                          : 'bg-border text-ink-faint'
                    )}
                  >
                    {s < step ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
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
                    className={cn(
                      'hidden text-xs sm:block',
                      s === step ? 'text-ink font-medium' : 'text-ink-faint'
                    )}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'mb-4 h-px w-10 transition-all duration-150',
                      s < step ? 'bg-brand' : 'bg-border'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Step 1 — Job Description Form */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-ink text-xl font-semibold">
              Thông tin Job Description
            </h1>
            <p className="text-ink-muted mt-1 text-sm">
              Điền thông tin JD để AI tạo câu hỏi phỏng vấn phù hợp nhất.
            </p>
          </div>
          <JdForm
            value={jd}
            onChange={updateJd}
            savedJobDescriptions={savedJobDescriptions}
            selectedSavedJobDescriptionId={selectedSavedJobDescriptionId}
            onSelectSavedJobDescription={selectSavedJobDescription}
          />
          <div className="flex items-center justify-between">
            {savedJobDescriptions.length > 0 ? (
              <Button variant="ghost" onClick={() => setStep(0)}>
                Quay lại
              </Button>
            ) : jdHasContent ? (
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
          <h1 className="text-ink text-xl font-semibold">
            Cấu hình phiên phỏng vấn
          </h1>
          <ConfigForm
            sessionType={sessionType}
            setSessionType={setSessionType}
            contextPack={contextPack}
            setContextPack={setContextPack}
            duration={duration}
            setDuration={setDuration}
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
            <h1 className="text-ink text-xl font-semibold">Xác nhận</h1>
            <p className="text-ink-muted mt-1 text-sm">
              Kiểm tra lại trước khi bắt đầu phiên phỏng vấn.
            </p>
          </div>
          <ConfirmStep
            jd={jd}
            sessionType={sessionType}
            contextPack={contextPack}
            duration={duration}
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
