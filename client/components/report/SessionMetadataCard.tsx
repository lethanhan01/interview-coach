import type { Session, SessionType, ContextPack } from '@/lib/types'
import { formatVietnamDateTime } from '@/lib/date-time'
import { Badge } from '@/components/ui/Badge'

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  hr: 'Nhân sự',
  technical: 'Kỹ thuật',
}

const CONTEXT_PACK_LABELS: Record<ContextPack, string> = {
  VN: 'Việt Nam',
  Western: 'Quốc tế (Western)',
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-foreground text-sm">{value}</span>
    </div>
  )
}

function TextBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </span>
      <p className="bg-surface-raised text-foreground whitespace-pre-line rounded-md px-3 py-2 text-sm leading-6">
        {value || '—'}
      </p>
    </div>
  )
}

interface ParsedJobDescription {
  companyName?: string
  jobTitle?: string
  level?: string
  headcount?: string
  requirements?: string
  jobContent?: string
  techStack: string[]
}

const SECTION_LABELS = [
  'Yêu cầu:',
  'Nội dung công việc:',
  'Tech Stack:',
  'Quyền lợi:',
  'Lương:',
  'Thưởng:',
  'Phong cách phỏng vấn:',
]

function trimBlock(lines: string[]): string | undefined {
  const copy = [...lines]
  while (copy.length > 0 && copy[0].trim() === '') copy.shift()
  while (copy.length > 0 && copy[copy.length - 1].trim() === '') copy.pop()
  const value = copy.join('\n').trim()
  return value || undefined
}

function parseJobDescription(jobDescription: string): ParsedJobDescription {
  const lines = jobDescription.split(/\r?\n/)

  const getInlineValue = (label: string) => {
    const line = lines.find((item) => item.trim().startsWith(`${label}:`))
    return line?.slice(line.indexOf(':') + 1).trim() || undefined
  }

  const getSectionValue = (label: string) => {
    const startIndex = lines.findIndex((item) => item.trim() === `${label}:`)
    if (startIndex === -1) return undefined

    const content: string[] = []
    for (let i = startIndex + 1; i < lines.length; i += 1) {
      const current = lines[i].trim()
      if (SECTION_LABELS.includes(current)) break
      content.push(lines[i])
    }

    return trimBlock(content)
  }

  const techStackValue = getInlineValue('Tech Stack')

  return {
    companyName: getInlineValue('Tên công ty'),
    jobTitle: getInlineValue('Vị trí tuyển dụng'),
    level: getInlineValue('Level yêu cầu'),
    headcount: getInlineValue('Số lượng tuyển'),
    requirements: getSectionValue('Yêu cầu'),
    jobContent: getSectionValue('Nội dung công việc'),
    techStack: techStackValue
      ? techStackValue
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  }
}

interface SessionMetadataCardProps {
  session: Session
}

export default function SessionMetadataCard({
  session,
}: SessionMetadataCardProps) {
  const jobDescription = parseJobDescription(session.jobDescription)
  const techStackValue =
    jobDescription.techStack.length > 0 ? (
      <span className="flex flex-wrap gap-1.5">
        {jobDescription.techStack.map((item) => (
          <Badge key={item} variant="secondary" className="text-xs">
            {item}
          </Badge>
        ))}
      </span>
    ) : (
      '—'
    )

  return (
    <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
      <h2 className="text-foreground mb-4 text-base font-semibold">
        Thông tin phiên phỏng vấn
      </h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <MetaRow
          label="Thời điểm"
          value={formatVietnamDateTime(session.createdAt)}
        />
        <MetaRow
          label="Loại phỏng vấn"
          value={SESSION_TYPE_LABELS[session.sessionType]}
        />
        <MetaRow
          label="Context Pack"
          value={CONTEXT_PACK_LABELS[session.contextPackId]}
        />
        <MetaRow
          label="Thời lượng"
          value={
            session.durationMin == null ? '—' : `${session.durationMin} phút`
          }
        />
        <MetaRow label="Số câu hỏi" value={`${session.numQuestions} câu`} />
        <MetaRow label="Vị trí mục tiêu" value={session.jobTitle ?? '—'} />
      </div>
      <div className="border-border mt-5 border-t pt-5">
        <h3 className="text-foreground mb-4 text-sm font-semibold">
          Mô tả công việc (JD)
        </h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <MetaRow
            label="Tên công ty"
            value={jobDescription.companyName ?? '—'}
          />
          <MetaRow
            label="Vị trí tuyển dụng"
            value={jobDescription.jobTitle ?? session.jobTitle ?? '—'}
          />
          <MetaRow label="Level yêu cầu" value={jobDescription.level ?? '—'} />
          <MetaRow
            label="Số lượng tuyển"
            value={jobDescription.headcount ?? '—'}
          />
          <MetaRow label="Tech stack" value={techStackValue} />
        </div>
        <div className="mt-4 grid gap-4">
          <TextBlock label="Yêu cầu" value={jobDescription.requirements} />
          <TextBlock
            label="Nội dung công việc"
            value={jobDescription.jobContent}
          />
        </div>
      </div>
    </div>
  )
}
