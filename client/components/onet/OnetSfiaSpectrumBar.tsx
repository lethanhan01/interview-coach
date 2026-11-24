'use client'

import * as React from 'react'
import { useMemo } from 'react'
import { Target, Star, TrendingUp, Scale, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { OnetSfiaMapping } from '@/types'

export interface OnetSfiaSpectrumBarProps {
  mappings: OnetSfiaMapping[]
  onSelectSkill?: (skillCode: string) => void
  className?: string
}

interface SeniorityMeta {
  code: string
  name: string
  subtext: string
  colorClass: string
}

const SFIA_LEVELS_META: Record<number, SeniorityMeta> = {
  1: {
    code: 'L1',
    name: 'Follow',
    subtext: 'Thực thi cơ bản',
    colorClass: 'border-slate-300 dark:border-slate-700',
  },
  2: {
    code: 'L2',
    name: 'Assist',
    subtext: 'Hỗ trợ',
    colorClass: 'border-blue-300 dark:border-blue-800',
  },
  3: {
    code: 'L3',
    name: 'Apply',
    subtext: 'Áp dụng / Mid',
    colorClass: 'border-teal-300 dark:border-teal-800',
  },
  4: {
    code: 'L4',
    name: 'Enable',
    subtext: 'Tự chủ / Senior',
    colorClass: 'border-emerald-300 dark:border-emerald-800',
  },
  5: {
    code: 'L5',
    name: 'Ensure',
    subtext: 'Đảm bảo / Lead',
    colorClass: 'border-amber-300 dark:border-amber-800',
  },
  6: {
    code: 'L6',
    name: 'Influence',
    subtext: 'Định hướng / Principal',
    colorClass: 'border-orange-300 dark:border-orange-800',
  },
  7: {
    code: 'L7',
    name: 'Strategy',
    subtext: 'Chiến lược / C-Level',
    colorClass: 'border-purple-300 dark:border-purple-800',
  },
}

export function OnetSfiaSpectrumBar({
  mappings,
  onSelectSkill,
  className,
}: OnetSfiaSpectrumBarProps) {
  // Compute High-Level Metrics
  const totalCount = mappings.length
  const coreCount = useMemo(
    () => mappings.filter((m) => m.isCore).length,
    [mappings]
  )
  const corePercentage =
    totalCount > 0 ? Math.round((coreCount / totalCount) * 100) : 0

  const avgLevel = useMemo(() => {
    if (totalCount === 0) return 0
    const sum = mappings.reduce((acc, m) => acc + m.targetLevel, 0)
    return Math.round((sum / totalCount) * 10) / 10
  }, [mappings, totalCount])

  const totalWeight = useMemo(() => {
    const sum = mappings.reduce((acc, m) => acc + m.weight, 0)
    return Math.round(sum * 10) / 10
  }, [mappings])

  // Group mappings by targetLevel (1 - 7)
  const skillsByLevel = useMemo(() => {
    const map: Record<number, OnetSfiaMapping[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
    }
    for (const m of mappings) {
      const lvl = Math.min(7, Math.max(1, m.targetLevel))
      map[lvl].push(m)
    }
    return map
  }, [mappings])

  const seniorityLabel = useMemo(() => {
    if (avgLevel <= 1.5) return 'Junior / Entry Level'
    if (avgLevel <= 2.5) return 'Junior-Mid / Associate'
    if (avgLevel <= 3.5) return 'Mid-level Professional'
    if (avgLevel <= 4.5) return 'Senior / Autonomous'
    if (avgLevel <= 5.5) return 'Technical Lead / Specialist'
    return 'Principal / Strategic Leader'
  }, [avgLevel])

  return (
    <Card className={cn('space-y-3.5 p-3.5 sm:p-4', className)}>
      {/* 4 KPI Metric Badges Bar */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* KPI 1: Total Mappings */}
        <div className="bg-surface-inset border-border/70 flex items-center justify-between rounded-xl border p-2.5">
          <div className="space-y-0.5">
            <span className="text-ink-muted text-[11px] font-medium uppercase tracking-wider">
              Tổng Ánh xạ
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-ink text-lg font-bold tabular-nums">
                {totalCount}
              </span>
              <span className="text-ink-faint text-[11px]">kỹ năng</span>
            </div>
          </div>
          <div className="bg-brand/10 text-brand rounded-lg p-1.5">
            <Target className="size-4" />
          </div>
        </div>

        {/* KPI 2: Core Skills Ratio */}
        <div className="bg-surface-inset border-border/70 flex items-center justify-between rounded-xl border p-2.5">
          <div className="space-y-0.5">
            <span className="text-ink-muted text-[11px] font-medium uppercase tracking-wider">
              Cốt lõi (Core)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-ink text-lg font-bold tabular-nums">
                {coreCount}
              </span>
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                ({corePercentage}%)
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
            <Star className="size-4" />
          </div>
        </div>

        {/* KPI 3: Average Target Level */}
        <div className="bg-surface-inset border-border/70 flex items-center justify-between rounded-xl border p-2.5">
          <div className="space-y-0.5">
            <span className="text-ink-muted text-[11px] font-medium uppercase tracking-wider">
              Cấp độ Mục tiêu
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-ink text-lg font-bold tabular-nums">
                Level {avgLevel}
              </span>
              <span className="text-ink-muted text-[10px]">/ 7</span>
            </div>
          </div>
          <div className="bg-brand/10 text-brand rounded-lg p-1.5">
            <TrendingUp className="size-4" />
          </div>
        </div>

        {/* KPI 4: Total Weight */}
        <div className="bg-surface-inset border-border/70 flex items-center justify-between rounded-xl border p-2.5">
          <div className="space-y-0.5">
            <span className="text-ink-muted text-[11px] font-medium uppercase tracking-wider">
              Tổng Trọng số
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-ink text-lg font-bold tabular-nums">
                {totalWeight}
              </span>
              <span className="text-ink-faint text-[11px]">hệ số</span>
            </div>
          </div>
          <div className="bg-brand/10 text-brand rounded-lg p-1.5">
            <Scale className="size-4" />
          </div>
        </div>
      </div>

      {/* Seniority Profile Highlight Header */}
      <div className="border-border/60 flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-xs">
        <div className="text-ink-muted flex items-center gap-1.5">
          <Sparkles className="text-brand size-3.5 shrink-0" />
          <span>Thước đo Phổ Năng lực Cấp bậc SFIA 9:</span>
          <span className="text-brand font-semibold">{seniorityLabel}</span>
        </div>
        <span className="text-ink-muted hidden text-[11px] sm:inline">
          Click vào thẻ kỹ năng trên thước đo để nhảy đến hàng trong bảng
        </span>
      </div>

      {/* 7-Column Seniority Spectrum Track */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
          const meta = SFIA_LEVELS_META[lvl]
          const skillsInLvl = skillsByLevel[lvl] || []
          const hasSkills = skillsInLvl.length > 0

          return (
            <div
              key={lvl}
              className={cn(
                'flex min-h-[96px] flex-col rounded-xl border p-1.5 transition-colors sm:p-2',
                hasSkills
                  ? 'bg-surface-1 border-border/90 shadow-sm'
                  : 'bg-surface-inset/40 border-border/60 border-dashed'
              )}
            >
              {/* Level Column Header */}
              <div className="border-border/50 mb-1.5 border-b pb-1 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-ink font-mono text-xs font-bold">
                    {meta.code}
                  </span>
                  {hasSkills && (
                    <span className="bg-brand/15 text-brand rounded-full px-1 text-[9px] font-bold tabular-nums">
                      {skillsInLvl.length}
                    </span>
                  )}
                </div>
                <p
                  className="text-ink-muted truncate text-[10px] font-medium"
                  title={meta.name}
                >
                  {meta.name}
                </p>
                <p
                  className="text-ink-faint hidden truncate text-[9px] md:block"
                  title={meta.subtext}
                >
                  {meta.subtext}
                </p>
              </div>

              {/* Skills Pins List inside this Level */}
              <div className="flex flex-1 flex-col justify-start gap-1 overflow-hidden">
                {skillsInLvl.map((skill) => (
                  <Badge
                    key={skill.id}
                    interactive
                    variant={skill.isCore ? 'warning' : 'secondary'}
                    onClick={() => onSelectSkill?.(skill.skillCode)}
                    className={cn(
                      'w-full justify-between rounded-lg px-2 py-1 text-left font-mono text-[11px] transition-all',
                      skill.isCore
                        ? 'hover:shadow-elevation-1 border-amber-500/40 bg-amber-500/10 font-bold text-amber-800 hover:border-amber-500 dark:text-amber-300'
                        : 'border-border/80 bg-surface-inset text-ink-muted hover:text-ink hover:border-brand/40'
                    )}
                    title={`${skill.skillCode} (${skill.skillName}) - Trọng số ${skill.weight}x ${skill.isCore ? '(Cốt lõi)' : ''}`}
                  >
                    <span className="truncate">{skill.skillCode}</span>
                    {skill.isCore && (
                      <Star className="size-2.5 shrink-0 fill-amber-500 text-amber-500" />
                    )}
                  </Badge>
                ))}

                {!hasSkills && (
                  <div className="text-ink-faint flex flex-1 items-center justify-center text-[10px]">
                    —
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
