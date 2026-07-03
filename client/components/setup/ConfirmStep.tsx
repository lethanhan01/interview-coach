import type { SessionType, ContextPack } from '@/lib/types'
import type { JdFormData, InterviewDuration } from '@/app/(app)/setup/page'
import { DURATION_OPTIONS } from '@/app/(app)/setup/page'
import { getJdLevelLabel } from '@/lib/interview-options'

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  hr: 'HR / Behavioral',
  technical: 'Technical',
  mixed: 'Mixed (HR + Technical)',
}

const CONTEXT_PACK_LABELS: Record<ContextPack, string> = {
  VN: 'Việt Nam',
  Western: 'Western',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-brand-200/50 py-2 last:border-0">
      <span className="shrink-0 text-ink-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{title}</p>
      <div className="rounded-2xl border border-brand-200 bg-brand-50 px-5 text-sm">{children}</div>
    </div>
  )
}

interface ConfirmStepProps {
  jd: JdFormData
  sessionType: SessionType
  contextPack: ContextPack
  duration: InterviewDuration
  error: string | null
}

export default function ConfirmStep({
  jd,
  sessionType,
  contextPack,
  duration,
  error,
}: ConfirmStepProps) {
  const durationOpt = DURATION_OPTIONS.find((d) => d.value === duration)!

  return (
    <div className="flex flex-col gap-5">
      <Section title="Thông tin JD">
        <Row label="Tên công ty" value={jd.company} />
        {jd.website && <Row label="Website" value={jd.website} />}
        <Row label="Vị trí tuyển dụng" value={jd.position} />
        <Row label="Level yêu cầu" value={getJdLevelLabel(jd.level)} />
        {jd.headcount && <Row label="Số lượng tuyển" value={jd.headcount} />}
        {jd.location && <Row label="Địa điểm" value={jd.location} />}
        {jd.techStack.length > 0 && <Row label="Tech Stack" value={jd.techStack.join(', ')} />}
        {jd.salary && <Row label="Lương" value={jd.salary} />}
        {jd.bonus && <Row label="Thưởng" value={jd.bonus} />}
        <div className="border-b border-brand-200/50 py-2">
          <p className="text-ink-muted">Yêu cầu</p>
          <p className="mt-1 line-clamp-3 text-sm text-ink">{jd.requirements}</p>
        </div>
        <div className="py-2">
          <p className="text-ink-muted">Nội dung công việc</p>
          <p className="mt-1 line-clamp-3 text-sm text-ink">{jd.jobContent}</p>
        </div>
      </Section>

      <Section title="Cấu hình phiên phỏng vấn">
        <Row label="Loại phỏng vấn" value={SESSION_TYPE_LABELS[sessionType]} />
        <Row label="Context Pack" value={CONTEXT_PACK_LABELS[contextPack]} />
        <Row label="Thời gian phỏng vấn" value={durationOpt.label} />
        <Row label="Số câu hỏi dự kiến" value={`${durationOpt.numQuestions} câu`} />
      </Section>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
