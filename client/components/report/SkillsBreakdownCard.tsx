import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Sparkles, AlertCircle, Award, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillBreakdownItem } from '@/lib/types'

export interface SkillsBreakdownCardProps {
  skills?: SkillBreakdownItem[]
  className?: string
}

export function SkillsBreakdownCard({
  skills = [],
  className,
}: SkillsBreakdownCardProps) {
  if (!skills || skills.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="flex items-center gap-2">
        <div className="bg-brand-subtle text-brand-subtle-fg flex size-8 items-center justify-center rounded-lg">
          <Award className="size-4" aria-hidden="true" />
        </div>
        <h3 className="text-ink text-lg font-bold">
          Chi Tiết Đánh Giá Từng Năng Lực (Skills Breakdown)
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {skills.map((skill) => {
          const isPassed = skill.status === 'passed'

          return (
            <Card
              key={skill.skillCode}
              className="border-border/70 flex flex-col gap-4 p-5 transition-shadow"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      {skill.skillCode}
                    </Badge>
                    <h4 className="text-ink text-base font-bold">
                      {skill.skillName}
                    </h4>
                  </div>

                  {/* Tech stack chips */}
                  {skill.techContext && skill.techContext.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-ink-muted flex items-center gap-1 text-xs">
                        <Cpu className="size-3 text-brand" aria-hidden="true" />
                        O*NET Tech:
                      </span>
                      {skill.techContext.map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="px-2 py-0 text-[11px] font-normal"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <Badge
                  variant={isPassed ? 'success' : 'warning'}
                  className="px-3 py-1 text-xs font-medium"
                >
                  {isPassed ? 'Đạt chuẩn' : 'Cần cải thiện (Gap)'}
                </Badge>
              </div>

              {/* Score & Progress */}
              <div className="bg-surface-raised/60 border-border/50 flex flex-col gap-2 rounded-xl border p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted font-medium">
                    Mức độ thành thạo chứng minh:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">
                      Cấp độ: <strong className="text-ink tabular-nums">Level {skill.demonstratedLevel}</strong> / Level {skill.targetLevel}
                    </span>
                    <span className="text-ink-muted">•</span>
                    <span className="text-ink font-bold tabular-nums">
                      {skill.score}/100 điểm
                    </span>
                  </div>
                </div>

                <Progress
                  value={skill.score}
                  variant={isPassed ? 'success' : 'warning'}
                  size="md"
                  aria-label={`Điểm kỹ năng ${skill.skillName}: ${skill.score} trên 100`}
                />
              </div>

              {/* Two Feedback Boxes: Strengths & Improvement */}
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                {/* Strengths */}
                <div className="bg-surface-raised border-success rounded-xl border-l-4 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    <span>Điểm Mạnh Ghi Nhận</span>
                  </div>
                  <p className="text-ink mt-1.5 text-xs leading-relaxed">
                    {skill.strengths || 'Ứng viên hoàn thành cơ bản câu hỏi.'}
                  </p>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-surface-raised border-warning rounded-xl border-l-4 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                    <AlertCircle className="size-3.5" aria-hidden="true" />
                    <span>Điểm Cần Hoàn Thiện</span>
                  </div>
                  <p className="text-ink mt-1.5 text-xs leading-relaxed">
                    {skill.areasForImprovement ||
                      'Tiếp tục củng cố kiến thức chuyên sâu để đạt chuẩn cao hơn.'}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
