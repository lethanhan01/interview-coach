'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import type { SessionType, ContextPack } from '@/lib/types'

type Step = 1 | 2 | 3

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: 'hr', label: 'HR / Behavioral' },
  { value: 'technical', label: 'Technical' },
  { value: 'mixed', label: 'Mixed' },
]

const CONTEXT_PACKS: { value: ContextPack; label: string; desc: string }[] = [
  { value: 'VN', label: 'Việt Nam', desc: 'Phong cách phỏng vấn Việt Nam, rubric phù hợp văn hóa địa phương' },
  { value: 'Western', label: 'Western', desc: 'STAR method, behavioral focus, phong cách công ty nước ngoài' },
]

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
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${s === step ? 'bg-black text-white' : s < step ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-400'}`}
            >
              {s}
            </div>
            {s < 3 && <div className={`h-px w-12 ${s < step ? 'bg-gray-800' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Dán Job Description</h1>
          <p className="text-sm text-gray-500">Tối thiểu 100 ký tự để AI tạo câu hỏi phù hợp.</p>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={12}
            placeholder="Dán nội dung JD vào đây..."
            className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm focus:border-black focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${jdValid ? 'text-green-600' : 'text-gray-400'}`}>
              {jd.trim().length} / 100 ký tự
            </span>
            <button
              onClick={() => setStep(2)}
              disabled={!jdValid}
              className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Tiếp theo
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-semibold text-gray-900">Chọn loại phỏng vấn</h1>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Loại phỏng vấn</p>
            <div className="flex flex-col gap-2">
              {SESSION_TYPES.map((t) => (
                <label key={t.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="sessionType"
                    value={t.value}
                    checked={sessionType === t.value}
                    onChange={() => setSessionType(t.value)}
                    className="accent-black"
                  />
                  <span className="text-sm text-gray-800">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Context Pack</p>
            <div className="flex flex-col gap-2">
              {CONTEXT_PACKS.map((cp) => (
                <label key={cp.value} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="contextPack"
                    value={cp.value}
                    checked={contextPack === cp.value}
                    onChange={() => setContextPack(cp.value)}
                    className="mt-0.5 accent-black"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{cp.label}</p>
                    <p className="text-xs text-gray-500">{cp.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-800">
              Quay lại
            </button>
            <button
              onClick={() => setStep(3)}
              className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Tiếp theo
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-semibold text-gray-900">Xác nhận</h1>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Loại phỏng vấn</span>
              <span className="font-medium capitalize text-gray-900">{sessionType}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Context Pack</span>
              <span className="font-medium text-gray-900">{contextPack}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Số câu hỏi</span>
              <span className="font-medium text-gray-900">{numQuestions}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">JD</span>
              <span className="max-w-xs truncate font-medium text-gray-900">{jd.slice(0, 60)}...</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-800">
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Bắt đầu phỏng vấn'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
