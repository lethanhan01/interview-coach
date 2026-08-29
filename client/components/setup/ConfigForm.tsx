'use client'

import type { SessionType, ContextPack } from '@/lib/types'
import {
  type InterviewDuration,
  DURATION_OPTIONS,
} from '@/lib/setup-types'

const SESSION_TYPES: {
  value: SessionType
  label: string
  description: string
}[] = [
  {
    value: 'hr',
    label: 'HR / Behavioral',
    description: 'Câu hỏi về kinh nghiệm, soft skills, và tình huống',
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Câu hỏi kỹ thuật chuyên sâu theo JD',
  },
]

const CONTEXT_PACKS: { value: ContextPack; label: string; desc: string }[] = [
  {
    value: 'VN',
    label: 'Việt Nam',
    desc: 'Phong cách phỏng vấn Việt Nam, rubric phù hợp văn hóa địa phương',
  },
  {
    value: 'Western',
    label: 'Western',
    desc: 'STAR method, behavioral focus, phong cách công ty nước ngoài',
  },
]

function SelectCard<T extends string | number>({
  value,
  current,
  onSelect,
  label,
  sublabel,
}: {
  value: T
  current: T
  onSelect: (v: T) => void
  label: string
  sublabel: string
}) {
  const selected = value === current
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={[
        'rounded-xl border-2 p-4 text-left transition-all duration-150',
        selected
          ? 'border-brand bg-brand-subtle shadow-card'
          : 'border-border bg-surface hover:border-brand-muted',
      ].join(' ')}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-ink text-sm font-medium">{label}</span>
        {selected && (
          <span className="bg-brand flex size-4 shrink-0 items-center justify-center rounded-full">
            <span className="size-1.5 rounded-full bg-white" />
          </span>
        )}
      </div>
      <p className="text-ink-muted text-xs leading-relaxed">{sublabel}</p>
    </button>
  )
}

interface ConfigFormProps {
  sessionType: SessionType
  setSessionType: (v: SessionType) => void
  contextPack: ContextPack
  setContextPack: (v: ContextPack) => void
  duration: InterviewDuration
  setDuration: (v: InterviewDuration) => void
}

export default function ConfigForm({
  sessionType,
  setSessionType,
  contextPack,
  setContextPack,
  duration,
  setDuration,
}: ConfigFormProps) {
  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-ink mb-3 text-sm font-medium">Loại phỏng vấn</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SESSION_TYPES.map((t) => (
            <SelectCard
              key={t.value}
              value={t.value}
              current={sessionType}
              onSelect={setSessionType}
              label={t.label}
              sublabel={t.description}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-ink mb-3 text-sm font-medium">Context Pack</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CONTEXT_PACKS.map((cp) => (
            <SelectCard
              key={cp.value}
              value={cp.value}
              current={contextPack}
              onSelect={setContextPack}
              label={cp.label}
              sublabel={cp.desc}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-ink mb-3 text-sm font-medium">Thời gian phỏng vấn</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DURATION_OPTIONS.map((d) => (
            <SelectCard
              key={d.value}
              value={d.value as InterviewDuration}
              current={duration}
              onSelect={setDuration}
              label={d.label}
              sublabel={`~${d.numQuestions} câu hỏi`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
