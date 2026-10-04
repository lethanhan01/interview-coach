'use client'

import * as React from 'react'
import { useMemo } from 'react'
import {
  Target,
  Star,
  TrendingUp,
  Scale,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { OnetSfiaMapping } from './types'

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
  1: { code: 'L1', name: 'Follow', subtext: 'Thực thi cơ bản', colorClass: 'border-slate-300 dark:border-slate-700' },
  2: { code: 'L2', name: 'Assist', subtext: 'Hỗ trợ', colorClass: 'border-blue-300 dark:border-blue-800' },
  3: { code: 'L3', name: 'Apply', subtext: 'Áp dụng / Mid', colorClass: 'border-teal-300 dark:border-teal-800' },
  4: { code: 'L4', name: 'Enable', subtext: 'Tự chủ / Senior', colorClass: 'border-emerald-300 dark:border-emerald-800' },
  5: { code: 'L5', name: 'Ensure', subtext: 'Đảm bảo / Lead', colorClass: 'border-amber-300 dark:border-amber-800' },
  6: { code: 'L6', name: 'Influence', subtext: 'Định hướng / Principal', colorClass: 'border-orange-300 dark:border-orange-800' },
  7: { code: 'L7', name: 'Strategy', subtext: 'Chiến lược / C-Level', colorClass: 'border-purple-300 dark:border-purple-800' },
}

export function OnetSfiaSpectrumBar({
  mappings,
  onSelectSkill,
  className,
}: OnetSfiaSpectrumBarProps) {
  // Compute High-Level Metrics
  const totalCount = mappings.length
  const coreCount = useMemo(() => mappings.filter((m) => m.isCore).length, [mappings])
  const corePercentage = totalCount > 0 ? Math.round((coreCount / totalCount) * 100) : 0

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
    <Card className={cn('p-3.5 sm:p-4 space-y-3.5', className)}>
      {/* 4 KPI Metric Badges Bar */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* KPI 1: Total Mappings */}
        <div className="bg-surface-inset rounded-xl p-2.5 border border-border/70 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
              Tổng Ánh xạ
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-ink font-bold text-lg tabular-nums">
                {totalCount}
              </span>
              <span className="text-[11px] text-ink-faint">kỹ năng</span>
            </div>
          </div>
          <div className="bg-brand/10 text-brand rounded-lg p-1.5">
            <Target className="size-4" />
          </div>
        </div>

        {/* KPI 2: Core Skills Ratio */}
        <div className="bg-surface-inset rounded-xl p-2.5 border border-border/70 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
              Cốt lõi (Core)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-ink font-bold text-lg tabular-nums">
                {coreCount}
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                ({corePercentage}%)
              </span>
            </div>
          </div>
          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg p-1.5">
            <Star className="size-4" />
          </div>
        </div>

        {/* KPI 3: Average Target Level */}
        <div className="bg-surface-inset rounded-xl p-2.5 border border-border/70 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
              Cấp độ Mục tiêu
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-ink font-bold text-lg tabular-nums">
                Level {avgLevel}
              </span>
              <span className="text-[10px] text-ink-muted">/ 7</span>
            </div>
          </div>
          <div className="bg-brand/10 text-brand rounded-lg p-1.5">
            <TrendingUp className="size-4" />
          </div>
        </div>

        {/* KPI 4: Total Weight */}
        <div className="bg-surface-inset rounded-xl p-2.5 border border-border/70 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
              Tổng Trọng số
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-ink font-bold text-lg tabular-nums">
                {totalWeight}
              </span>
              <span className="text-[11px] text-ink-faint">hệ số</span>
            </div>
          </div>
          <div className="bg-brand/10 text-brand rounded-lg p-1.5">
            <Scale className="size-4" />
          </div>
        </div>
      </div>

      {/* Seniority Profile Highlight Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Sparkles className="text-brand size-3.5 shrink-0" />
          <span>Thước đo Phổ Năng lực Cấp bậc SFIA 9:</span>
          <span className="text-brand font-semibold">{seniorityLabel}</span>
        </div>
        <span className="text-[11px] text-ink-muted hidden sm:inline">
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
                'flex flex-col rounded-xl border p-1.5 sm:p-2 min-h-[96px] transition-colors',
                hasSkills
                  ? 'bg-surface-1 border-border/90 shadow-sm'
                  : 'bg-surface-inset/40 border-dashed border-border/60'
              )}
            >
              {/* Level Column Header */}
              <div className="text-center border-b border-border/50 pb-1 mb-1.5">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-mono font-bold text-xs text-ink">
                    {meta.code}
                  </span>
                  {hasSkills && (
                    <span className="bg-brand/15 text-brand rounded-full px-1 text-[9px] font-bold tabular-nums">
                      {skillsInLvl.length}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-ink-muted font-medium truncate" title={meta.name}>
                  {meta.name}
                </p>
                <p className="text-[9px] text-ink-faint truncate hidden md:block" title={meta.subtext}>
                  {meta.subtext}
                </p>
              </div>

              {/* Skills Pins List inside this Level */}
              <div className="flex flex-col gap-1 flex-1 justify-start overflow-hidden">
                {skillsInLvl.map((skill) => (
                  <Badge
                    key={skill.id}
                    interactive
                    variant={skill.isCore ? 'warning' : 'secondary'}
                    onClick={() => onSelectSkill?.(skill.skillCode)}
                    className={cn(
                      'w-full justify-between rounded-lg px-2 py-1 text-[11px] font-mono text-left transition-all',
                      skill.isCore
                        ? 'font-bold border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:border-amber-500 hover:shadow-elevation-1'
                        : 'border-border/80 bg-surface-inset text-ink-muted hover:text-ink hover:border-brand/40'
                    )}
                    title={`${skill.skillCode} (${skill.skillName}) - Trọng số ${skill.weight}x ${skill.isCore ? '(Cốt lõi)' : ''}`}
                  >
                    <span className="truncate">{skill.skillCode}</span>
                    {skill.isCore && (
                      <Star className="text-amber-500 size-2.5 shrink-0 fill-amber-500" />
                    )}
                  </Badge>
                ))}

                {!hasSkills && (
                  <div className="flex flex-1 items-center justify-center text-ink-faint text-[10px]">
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
