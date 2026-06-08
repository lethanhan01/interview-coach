import type { Session, SessionType, ContextPack } from '@/lib/types'

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  hr: 'Nhân sự',
  technical: 'Kỹ thuật',
  mixed: 'Tổng hợp',
}

const CONTEXT_PACK_LABELS: Record<ContextPack, string> = {
  VN: 'Việt Nam',
  Western: 'Quốc tế (Western)',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(createdAt: string, completedAt?: string, durationMin?: number): string {
  if (completedAt) {
    const ms = new Date(completedAt).getTime() - new Date(createdAt).getTime()
    const minutes = Math.round(ms / 60000)
    return `${minutes} phút`
  }
  if (durationMin !== undefined) return `${durationMin} phút`
  return '—'
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

interface SessionMetadataCardProps {
  session: Session
}

export default function SessionMetadataCard({ session }: SessionMetadataCardProps) {
  const jdPreview =
    session.jobDescription.length > 200
      ? session.jobDescription.slice(0, 200) + '…'
      : session.jobDescription

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Thông tin phiên phỏng vấn</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <MetaRow label="Thời điểm" value={formatDateTime(session.createdAt)} />
        <MetaRow label="Loại phỏng vấn" value={SESSION_TYPE_LABELS[session.sessionType]} />
        <MetaRow label="Context Pack" value={CONTEXT_PACK_LABELS[session.contextPackId]} />
        <MetaRow label="Số câu hỏi" value={`${session.numQuestions} câu`} />
        <MetaRow
          label="Thời gian thực hiện"
          value={formatDuration(session.createdAt, session.completedAt, session.durationMin)}
        />
        <MetaRow label="Vị trí mục tiêu" value="—" />
        <MetaRow label="Kinh nghiệm" value="—" />
      </div>
      <div className="mt-4 border-t border-gray-100 pt-4">
        <MetaRow label="Mô tả công việc (JD)" value={jdPreview} />
      </div>
    </div>
  )
}
