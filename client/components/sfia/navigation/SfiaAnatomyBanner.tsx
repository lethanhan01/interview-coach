'use client'

import React from 'react'
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  FolderTree,
  FileCode2,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { SfiaCoverageStats } from '@/types'

const LOCAL_STORAGE_KEY = 'sfia_anatomy_banner_collapsed'

export interface SfiaAnatomyBannerProps {
  stats?: SfiaCoverageStats | null
  className?: string
}

const emptySubscribe = () => () => {}

const subscribeCollapsed = (callback: () => void) => {
  window.addEventListener('storage', callback)
  window.addEventListener('sfia_banner_toggle', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('sfia_banner_toggle', callback)
  }
}

const getCollapsedSnapshot = () => {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function SfiaAnatomyBanner({
  stats,
  className,
}: SfiaAnatomyBannerProps) {
  const hasMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  const collapsed = React.useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    () => false
  )

  const toggleCollapsed = () => {
    try {
      const current = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true'
      localStorage.setItem(LOCAL_STORAGE_KEY, String(!current))
      window.dispatchEvent(new Event('sfia_banner_toggle'))
    } catch {
      // Ignore localStorage errors
    }
  }

  // Prevent layout shift during hydration
  if (!hasMounted) {
    return (
      <div
        className={cn(
          'bg-card border-border/80 animate-pulse rounded-xl border p-4 shadow-sm',
          className
        )}
      >
        <div className="bg-surface-raised mb-2 h-6 w-1/3 rounded" />
        <div className="bg-surface-raised h-4 w-1/2 rounded" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-card border-border/80 overflow-hidden rounded-xl border shadow-sm transition-all duration-200',
        className
      )}
    >
      {/* Banner Top Header */}
      <div className="bg-surface-raised/30 border-border/50 flex items-center justify-between border-b p-3.5 sm:p-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand/10 text-brand border-brand/20 flex size-8 shrink-0 items-center justify-center rounded-lg border">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-ink text-sm font-bold">
                SFIA 9 Framework Anatomy
              </h2>
              <Badge
                variant="secondary"
                className="px-2 py-0.5 text-[10px] font-semibold uppercase"
              >
                4 Core Pillars
              </Badge>
            </div>
            <p className="text-ink-muted mt-0.5 text-[11px] sm:text-xs">
              Standardized architecture: Categories ➔ Subcategories ➔ Skills ➔ 7
              Levels of Responsibility
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="text-ink-muted hover:text-ink h-8 gap-1.5 px-2.5 text-xs"
            aria-label={
              collapsed
                ? 'Expand SFIA 9 Framework Anatomy'
                : 'Collapse SFIA 9 Framework Anatomy'
            }
          >
            {collapsed ? (
              <>
                <span className="hidden sm:inline">Expand Anatomy</span>
                <ChevronDown className="size-3.5" />
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Collapse</span>
                <ChevronUp className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!collapsed && (
        <div className="flex flex-col gap-4 p-3.5 sm:p-4">
          {/* 4 Pillars Flow Diagram */}
          <div className="relative grid grid-cols-1 gap-2.5 sm:gap-3 md:grid-cols-4">
            {/* Pillar 1: Categories */}
            <div className="bg-surface group relative flex flex-col justify-between rounded-lg border border-blue-500/30 p-3 transition-colors hover:border-blue-500/50">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    <Layers className="size-3" /> Pillar 1
                  </span>
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    6 Categories
                  </span>
                </div>
                <h3 className="text-ink text-xs font-bold">
                  Business Categories
                </h3>
                <p className="text-ink-muted mt-1 text-[11px] leading-relaxed">
                  High-level domains: Strategy & Architecture, Change &
                  Transformation, Development, Delivery, People, Relationships.
                </p>
              </div>
              <div className="text-ink-muted/80 border-border/40 mt-2 border-t pt-2 font-mono text-[10px]">
                STRAT_ARCH • DEV_IMPL...
              </div>
            </div>

            {/* Pillar 2: Subcategories */}
            <div className="bg-surface group relative flex flex-col justify-between rounded-lg border border-emerald-500/30 p-3 transition-colors hover:border-emerald-500/50">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <FolderTree className="size-3" /> Pillar 2
                  </span>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    22 Subcategories
                  </span>
                </div>
                <h3 className="text-ink text-xs font-bold">
                  Professional Domains
                </h3>
                <p className="text-ink-muted mt-1 text-[11px] leading-relaxed">
                  Targeted capability clusters: Systems development, Data &
                  analytics, Security, UX, Management.
                </p>
              </div>
              <div className="text-ink-muted/80 border-border/40 mt-2 border-t pt-2 font-mono text-[10px]">
                SYS_DEV • DATA_ANA...
              </div>
            </div>

            {/* Pillar 3: Skills */}
            <div className="bg-surface group relative flex flex-col justify-between rounded-lg border border-violet-500/30 p-3 transition-colors hover:border-violet-500/50">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    <FileCode2 className="size-3" /> Pillar 3
                  </span>
                  <span className="rounded bg-violet-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-violet-600 dark:text-violet-400">
                    147 Skills
                  </span>
                </div>
                <h3 className="text-ink text-xs font-bold">
                  Practicing Skills
                </h3>
                <p className="text-ink-muted mt-1 text-[11px] leading-relaxed">
                  4-letter code standards (PROG, SWDN, DBDS). Each skill defines
                  an explicit level span (min_level..max_level).
                </p>
              </div>
              <div className="text-ink-muted/80 border-border/40 mt-2 border-t pt-2 font-mono text-[10px]">
                PROG (L2-6) • ARCH (L5-7)
              </div>
            </div>

            {/* Pillar 4: Responsibility Levels */}
            <div className="bg-surface group relative flex flex-col justify-between rounded-lg border border-amber-500/30 p-3 transition-colors hover:border-amber-500/50">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <Award className="size-3" /> Pillar 4
                  </span>
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    7 Levels
                  </span>
                </div>
                <h3 className="text-ink text-xs font-bold">
                  Responsibility Levels
                </h3>
                <p className="text-ink-muted mt-1 text-[11px] leading-relaxed">
                  From Level 1 (Follow) to Level 7 (Set strategy, inspire),
                  anchored by 5 generic attributes.
                </p>
              </div>
              <div className="text-ink-muted/80 border-border/40 mt-2 border-t pt-2 font-mono text-[10px]">
                Level 1 ➔ Level 7
              </div>
            </div>
          </div>

          {/* 4 Mini-Stat Cards */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 sm:grid-cols-4">
            <div className="bg-surface-inset/60 border-border/50 flex items-center justify-between rounded-lg border p-2.5">
              <div>
                <span className="text-ink-muted block text-[11px] font-medium">
                  SFIA 9 Skills
                </span>
                <span className="text-ink text-sm font-bold sm:text-base">
                  147 Skills
                </span>
              </div>
              <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400">
                147
              </div>
            </div>

            <div className="bg-surface-inset/60 border-border/50 flex items-center justify-between rounded-lg border p-2.5">
              <div>
                <span className="text-ink-muted block text-[11px] font-medium">
                  Subcategories
                </span>
                <span className="text-ink text-sm font-bold sm:text-base">
                  22 Groups
                </span>
              </div>
              <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                22
              </div>
            </div>

            <div className="bg-surface-inset/60 border-border/50 flex items-center justify-between rounded-lg border p-2.5">
              <div>
                <span className="text-ink-muted block text-[11px] font-medium">
                  Categories
                </span>
                <span className="text-ink text-sm font-bold sm:text-base">
                  6 Categories
                </span>
              </div>
              <div className="flex size-7 items-center justify-center rounded-md bg-violet-500/10 text-xs font-bold text-violet-600 dark:text-violet-400">
                6
              </div>
            </div>

            <div className="bg-surface-inset/60 border-border/50 flex items-center justify-between rounded-lg border p-2.5">
              <div>
                <span className="text-ink-muted block text-[11px] font-medium">
                  Question Bank
                </span>
                <span className="text-ink text-sm font-bold sm:text-base">
                  {stats?.totalQuestions ?? 0} Questions
                </span>
              </div>
              <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400">
                {stats?.totalQuestions ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
