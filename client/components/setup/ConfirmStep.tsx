import type { SessionType, ContextPack } from '@/lib/types'
import {
  type JdFormData,
  type InterviewDuration,
  DURATION_OPTIONS,
  mapJdLevelToSfia,
} from '@/lib/setup-types'
import { getJdLevelLabel } from '@/lib/interview-options'
import { Badge } from '@/components/ui/Badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import { Sparkles, Briefcase, Award } from 'lucide-react'

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  hr: 'HR / Behavioral',
  technical: 'Technical',
}

const CONTEXT_PACK_LABELS: Record<ContextPack, string> = {
  VN: 'Việt Nam',
  Western: 'Western',
}

const SFIA_LEVEL_DESCRIPTIONS: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'SFIA Level 1', subtitle: 'Thực thi cơ bản (Intern / Fresher)' },
  2: { title: 'SFIA Level 2', subtitle: 'Thực thi có hướng dẫn (Junior)' },
  3: { title: 'SFIA Level 3', subtitle: 'Chủ động áp dụng (Middle)' },
  4: { title: 'SFIA Level 4', subtitle: 'Chuyên sâu độc lập (Senior)' },
  5: { title: 'SFIA Level 5', subtitle: 'Dẫn dắt & Định hướng (Lead / Manager)' },
  6: { title: 'SFIA Level 6', subtitle: 'Khởi xướng chiến lược (Director)' },
  7: { title: 'SFIA Level 7', subtitle: 'Định hình chiến lược tổ chức (Executive)' },
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="border-brand-subtle-border flex flex-col justify-between gap-1 border-b py-2.5 sm:flex-row sm:items-center sm:gap-4 last:border-0">
      <span className="text-ink-muted shrink-0 text-sm">{label}</span>
      {children ? (
        <div className="flex items-center justify-start sm:justify-end">{children}</div>
      ) : (
        <span className="text-ink text-left font-medium sm:text-right text-sm">{value}</span>
      )}
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        {icon}
        <p className="text-ink-faint text-xs font-semibold uppercase tracking-wide">
          {title}
        </p>
      </div>
      <div className="border-brand-subtle-border bg-brand-subtle/60 rounded-2xl border overflow-hidden px-5 py-4 text-sm">
        {children}
      </div>
    </div>
  )
}

interface ConfirmStepProps {
  jd: JdFormData
  sessionType: SessionType
  contextPack: ContextPack
  duration: InterviewDuration
  error: string | null
  onChange?: (jd: JdFormData) => void
}

export default function ConfirmStep({
  jd,
  sessionType,
  contextPack,
  duration,
  error,
  onChange,
}: ConfirmStepProps) {
  const durationOpt = DURATION_OPTIONS.find((d) => d.value === duration)!
  const currentSfiaLevel = jd.targetSfiaLevel ?? mapJdLevelToSfia(jd.level)

  const handleSfiaChange = (val: string) => {
    const levelNum = Number(val)
    if (!isNaN(levelNum) && onChange) {
      onChange({
        ...jd,
        targetSfiaLevel: levelNum,
      })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Hồ sơ Vị trí Tuyển dụng (AI Job Profile) */}
      <Section
        title="Hồ sơ Vị trí Tuyển dụng (AI Job Profile)"
        icon={<Sparkles className="text-brand size-3.5" aria-hidden="true" />}
      >
        <Row label="Chức danh chuẩn O*NET">
          {jd.onetOccupationTitle ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-ink font-semibold">{jd.onetOccupationTitle}</span>
              {jd.onetSocCode && (
                <Badge variant="brand" className="font-mono text-xs">
                  {jd.onetSocCode}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-ink-muted italic">
              Tự do (chưa chuẩn hóa O*NET)
            </span>
          )}
        </Row>

        <Row label="Cấp bậc SFIA mục tiêu">
          {onChange ? (
            <div className="flex flex-col items-start gap-1 sm:items-end w-full sm:w-auto">
              <div className="w-full sm:w-64">
                <Select
                  value={String(currentSfiaLevel)}
                  onValueChange={handleSfiaChange}
                >
                  <SelectTrigger
                    id="sfia-level-select"
                    aria-label="Cấp bậc SFIA mục tiêu"
                    className="h-9 text-xs"
                  >
                    <SelectValue placeholder="Chọn Cấp bậc SFIA..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const desc = SFIA_LEVEL_DESCRIPTIONS[lvl]
                      return (
                        <SelectItem key={lvl} value={String(lvl)}>
                          <span className="font-semibold">{desc.title}</span>
                          <span className="text-ink-muted ml-1.5 text-xs">
                            — {desc.subtitle}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-ink-muted text-[11px]">
                Quyết định độ sâu câu hỏi và tiêu chí đánh giá
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="brand" className="text-xs">
                SFIA Level {currentSfiaLevel}
              </Badge>
              <span className="text-ink-muted text-xs">
                {SFIA_LEVEL_DESCRIPTIONS[currentSfiaLevel]?.subtitle ?? ''}
              </span>
            </div>
          )}
        </Row>

        <Row label="Tech Stack trọng điểm">
          {jd.techStack.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              {jd.techStack.map((tech) => (
                <Badge key={tech} variant="default" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-ink-muted italic">Chưa xác định</span>
          )}
        </Row>
      </Section>

      {/* Thông tin JD */}
      <Section
        title="Thông tin JD"
        icon={<Briefcase className="text-ink-muted size-3.5" aria-hidden="true" />}
      >
        <Row label="Tên công ty" value={jd.company} />
        {jd.website && <Row label="Website" value={jd.website} />}
        <Row label="Vị trí tuyển dụng" value={jd.position} />
        <Row label="Level yêu cầu" value={getJdLevelLabel(jd.level)} />
        {jd.headcount && <Row label="Số lượng tuyển" value={jd.headcount} />}
        {jd.location && <Row label="Địa điểm" value={jd.location} />}
        {jd.salary && <Row label="Lương" value={jd.salary} />}
        {jd.bonus && <Row label="Thưởng" value={jd.bonus} />}
        <div className="border-brand-subtle-border border-b py-2.5">
          <p className="text-ink-muted text-sm">Yêu cầu</p>
          <p className="text-ink mt-1 line-clamp-3 text-sm">
            {jd.requirements}
          </p>
        </div>
        <div className="py-2.5">
          <p className="text-ink-muted text-sm">Nội dung công việc</p>
          <p className="text-ink mt-1 line-clamp-3 text-sm">{jd.jobContent}</p>
        </div>
      </Section>

      {/* Cấu hình phiên phỏng vấn */}
      <Section
        title="Cấu hình phiên phỏng vấn"
        icon={<Award className="text-ink-muted size-3.5" aria-hidden="true" />}
      >
        <Row label="Loại phỏng vấn" value={SESSION_TYPE_LABELS[sessionType]} />
        <Row label="Context Pack" value={CONTEXT_PACK_LABELS[contextPack]} />
        <Row label="Thời gian phỏng vấn" value={durationOpt.label} />
        <Row
          label="Số câu hỏi dự kiến"
          value={`${durationOpt.numQuestions} câu`}
        />
      </Section>

      {error && <p className="text-danger text-sm font-medium">{error}</p>}
    </div>
  )
}
