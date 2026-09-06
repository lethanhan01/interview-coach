import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle2, AlertTriangle, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillBreakdownItem } from '@/lib/types'

export interface SfiaCompetencyOverviewProps {
  skills?: SkillBreakdownItem[]
  className?: string
}

const SFIA_LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: 'Follow',
  2: 'Assist',
  3: 'Apply',
  4: 'Enable',
  5: 'Ensure, Advise',
  6: 'Initiate, Influence',
  7: 'Set Strategy, Inspire',
}

interface SegmentMeterProps {
  demonstratedLevel: number
  targetLevel: number
  skillName: string
}

function SegmentMeter({
  demonstratedLevel,
  targetLevel,
  skillName,
}: SegmentMeterProps) {
  const isPassed = demonstratedLevel >= targetLevel
  const segments = [1, 2, 3, 4, 5, 6, 7]

  return (
    <div
      role="meter"
      aria-label={`Thang đo SFIA 7 cấp độ cho ${skillName}`}
      aria-valuenow={demonstratedLevel}
      aria-valuemin={1}
      aria-valuemax={7}
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-center gap-1">
        {segments.map((level) => {
          const isFilled = level <= demonstratedLevel
          const isTarget = level === targetLevel
          const isBetweenDemonstratedAndTarget =
            level > demonstratedLevel && level <= targetLevel

          let segmentColor = 'bg-surface-inset text-ink-muted/50 border-border/40'
          if (isFilled) {
            segmentColor = isPassed
              ? 'bg-success text-success-foreground border-success/40'
              : 'bg-warning text-warning-foreground border-warning/40'
          } else if (isBetweenDemonstratedAndTarget) {
            segmentColor = 'bg-surface-raised border-dashed border-warning/60 text-warning'
          }

          return (
            <div
              key={level}
              title={`Level ${level}: ${SFIA_LEVEL_DESCRIPTIONS[level] || ''}${
                isTarget ? ' (Mục tiêu)' : ''
              }${level === demonstratedLevel ? ' (Thể hiện)' : ''}`}
              className={cn(
                'relative flex h-6 flex-1 items-center justify-center rounded-sm border text-[10px] font-semibold tabular-nums transition-colors',
                segmentColor,
                isTarget && 'ring-1 ring-brand-border ring-offset-1 ring-offset-surface'
              )}
            >
              {level}
            </div>
          )
        })}
      </div>
      <div className="text-ink-muted flex items-center justify-between text-[11px]">
        <span>L1: Cơ bản</span>
        <span className="text-ink-faint">Thang SFIA Level 1-7</span>
        <span>L7: Chiến lược</span>
      </div>
    </div>
  )
}

export function SfiaCompetencyOverview({
  skills = [],
  className,
}: SfiaCompetencyOverviewProps) {
  if (!skills || skills.length === 0) {
    return null
  }

  const passedCount = skills.filter((s) => s.status === 'passed').length
  const gapCount = skills.filter((s) => s.status === 'gap').length

  return (
    <Card className={cn('flex flex-col gap-6', className)}>
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-subtle text-brand-subtle-fg flex size-9 items-center justify-center rounded-lg">
              <Layers className="size-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Tổng Quan Năng Lực SFIA (Level 1-7)
              </CardTitle>
              <p className="text-ink-muted text-xs">
                Đối chiếu Cấp độ Kỳ vọng (Target) và Cấp độ Thể hiện thực tế
                (Demonstrated)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1.5 py-1 text-xs">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              <span className="tabular-nums font-semibold">{passedCount}</span> Đạt chuẩn
            </Badge>
            {gapCount > 0 && (
              <Badge variant="warning" className="gap-1.5 py-1 text-xs">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                <span className="tabular-nums font-semibold">{gapCount}</span> Cần hoàn thiện
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-0">
        <div className="border-border/60 divide-border/60 divide-y rounded-xl border">
          {skills.map((skill) => {
            const isPassed = skill.status === 'passed'
            return (
              <div
                key={skill.skillCode}
                className="hover:bg-surface-raised/40 flex flex-col gap-3.5 p-4 transition-colors lg:flex-row lg:items-center lg:justify-between"
              >
                {/* Info & Code */}
                <div className="min-w-0 lg:w-1/3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {skill.skillCode}
                    </Badge>
                    <h4 className="text-ink truncate text-sm font-semibold">
                      {skill.skillName}
                    </h4>
                  </div>
                  {skill.techContext && skill.techContext.length > 0 && (
                    <p className="text-ink-muted mt-1 truncate text-xs">
                      Ngữ cảnh: {skill.techContext.join(' • ')}
                    </p>
                  )}
                </div>

                {/* Meter */}
                <div className="min-w-0 flex-1 lg:max-w-md">
                  <SegmentMeter
                    demonstratedLevel={skill.demonstratedLevel}
                    targetLevel={skill.targetLevel}
                    skillName={skill.skillName}
                  />
                </div>

                {/* Level Numbers & Status */}
                <div className="flex items-center justify-between gap-4 lg:w-48 lg:justify-end">
                  <div className="flex flex-col items-end text-xs">
                    <span className="text-ink-muted">
                      Kỳ vọng: <strong className="text-ink tabular-nums">Level {skill.targetLevel}</strong>
                    </span>
                    <span className="text-ink-muted">
                      Thể hiện: <strong className={cn('tabular-nums', isPassed ? 'text-success' : 'text-warning')}>Level {skill.demonstratedLevel}</strong>
                    </span>
                  </div>

                  <Badge
                    variant={isPassed ? 'success' : 'warning'}
                    className="shrink-0 text-xs"
                  >
                    {isPassed ? 'Đạt chuẩn' : 'Có khoảng cách'}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
