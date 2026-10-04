'use client'

import type { SessionType, ContextPack } from '@/lib/types'
import {
  type InterviewDuration,
  DURATION_OPTIONS,
} from '@/lib/setup-types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { cn } from '@/lib/utils'

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

function SelectCard({
  value,
  id,
  label,
  sublabel,
  selected,
}: {
  value: string
  id: string
  label: string
  sublabel: string
  selected: boolean
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'cursor-pointer rounded-xl border-2 p-4 text-left transition-all duration-150 flex flex-col justify-between select-none',
        selected
          ? 'border-brand bg-brand-subtle shadow-card'
          : 'border-border bg-surface hover:border-brand-muted'
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-ink text-sm font-medium">{label}</span>
        <RadioGroupItem value={value} id={id} />
      </div>
      <p className="text-ink-muted text-xs leading-relaxed">{sublabel}</p>
    </label>
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
        <RadioGroup
          value={sessionType}
          onValueChange={(val) => setSessionType(val as SessionType)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {SESSION_TYPES.map((t) => (
            <SelectCard
              key={t.value}
              id={`session-type-${t.value}`}
              value={t.value}
              selected={sessionType === t.value}
              label={t.label}
              sublabel={t.description}
            />
          ))}
        </RadioGroup>
      </div>

      <div>
        <p className="text-ink mb-3 text-sm font-medium">Context Pack</p>
        <RadioGroup
          value={contextPack}
          onValueChange={(val) => setContextPack(val as ContextPack)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {CONTEXT_PACKS.map((cp) => (
            <SelectCard
              key={cp.value}
              id={`context-pack-${cp.value}`}
              value={cp.value}
              selected={contextPack === cp.value}
              label={cp.label}
              sublabel={cp.desc}
            />
          ))}
        </RadioGroup>
      </div>

      <div>
        <p className="text-ink mb-3 text-sm font-medium">Thời gian phỏng vấn</p>
        <RadioGroup
          value={String(duration)}
          onValueChange={(val) => setDuration(Number(val) as InterviewDuration)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {DURATION_OPTIONS.map((d) => (
            <SelectCard
              key={d.value}
              id={`duration-${d.value}`}
              value={String(d.value)}
              selected={duration === d.value}
              label={d.label}
              sublabel={`~${d.numQuestions} câu hỏi`}
            />
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}

