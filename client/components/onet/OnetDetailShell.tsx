'use client'

import * as React from 'react'
import { useEffect, useState, useRef } from 'react'
import {
  Copy,
  Check,
  Sparkles,
  Share2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { onetMockService } from '@/services/onet.mock'
import { OnetOverviewTab } from './OnetOverviewTab'
import { OnetTechSkillsTab } from './OnetTechSkillsTab'
import { OnetTasksTab } from './OnetTasksTab'
import { OnetAlternateTitlesTab } from './OnetAlternateTitlesTab'
import { OnetSfiaTab } from './OnetSfiaTab'
import type {
  OnetOccupationDetail,
  OnetDetailSubTab,
  OnetSfiaMapping,
} from './types'

export interface OnetDetailShellProps {
  socCode: string
  activeDetailTab: OnetDetailSubTab
  onSelectDetailTab: (tab: OnetDetailSubTab) => void
  onLoadedDetail?: (detail: OnetOccupationDetail) => void
  onDirtyChange?: (isDirty: boolean) => void
  className?: string
}

export function OnetDetailShell({
  socCode,
  activeDetailTab,
  onSelectDetailTab,
  onLoadedDetail,
  onDirtyChange,
  className,
}: OnetDetailShellProps) {
  const [detail, setDetail] = useState<OnetOccupationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [prevSoc, setPrevSoc] = useState(socCode)
  const contentRef = useRef<HTMLDivElement>(null)

  if (prevSoc !== socCode) {
    setPrevSoc(socCode)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [socCode, activeDetailTab])

  useEffect(() => {
    let isCancelled = false

    onetMockService
      .getOccupationDetail(socCode)
      .then((data) => {
        if (isCancelled) return
        if (data) {
          setDetail(data)
          onLoadedDetail?.(data)
        } else {
          setError(`Không tìm thấy dữ liệu cho mã SOC ${socCode}`)
        }
      })
      .catch((err) => {
        if (isCancelled) return
        setError(
          err instanceof Error ? err.message : 'Không thể tải chi tiết nghề O*NET'
        )
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [socCode, onLoadedDetail])

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    onetMockService
      .getOccupationDetail(socCode)
      .then((data) => {
        if (data) {
          setDetail(data)
          onLoadedDetail?.(data)
        } else {
          setError(`Không tìm thấy dữ liệu cho mã SOC ${socCode}`)
        }
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : 'Không thể tải chi tiết nghề O*NET'
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleCopy = async () => {
    if (!detail) return
    try {
      await navigator.clipboard.writeText(detail.socCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleUpdateMappings = (newMappings: OnetSfiaMapping[]) => {
    if (!detail) return
    const updated: OnetOccupationDetail = {
      ...detail,
      sfiaMappings: newMappings,
      mappingCount: newMappings.length,
      isMapped: newMappings.length > 0,
      stats: {
        ...detail.stats,
        mappingCount: newMappings.length,
      },
    }
    setDetail(updated)
    onLoadedDetail?.(updated)
  }

  // Loading Skeleton State
  if (loading) {
    return (
      <div className={cn('flex h-full flex-col p-6 space-y-6 overflow-y-auto', className)}>
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="bg-surface-inset h-5 w-28 animate-pulse rounded" />
            <div className="bg-surface-inset h-5 w-36 animate-pulse rounded" />
          </div>
          <div className="bg-surface-inset h-9 w-56 animate-pulse rounded-lg" />
          <div className="bg-surface-inset h-6 w-96 animate-pulse rounded" />
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-surface-inset h-10 w-full animate-pulse rounded-lg" />

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-inset h-24 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="bg-surface-inset h-40 w-full animate-pulse rounded-xl" />
      </div>
    )
  }

  // Error State
  if (error || !detail) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="text-destructive mb-3 size-10" />
        <h3 className="text-ink text-base font-semibold">Không thể tải thông tin nghề</h3>
        <p className="text-ink-muted mt-1 text-sm max-w-md">{error || 'Nghề không tồn tại'}</p>
        <Button variant="outline" size="sm" onClick={handleRetry} className="mt-4 gap-2">
          <RefreshCw className="size-4" />
          <span>Thử lại</span>
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden bg-card text-card-foreground',
        className
      )}
    >
      {/* Top Header Panel */}
      <div className="border-border/60 bg-surface-raised shrink-0 border-b p-3.5 sm:p-4">
        <div className="flex flex-col gap-2.5">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs font-semibold">
              Nhóm SOC {detail.majorGroupCode}
            </Badge>

            {detail.isMapped ? (
              <span className="bg-success/15 text-success inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
                <Sparkles className="size-3" />
                Đã ánh xạ {detail.stats.mappingCount} kỹ năng SFIA
              </span>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Chưa có ánh xạ SFIA
              </Badge>
            )}

            <Badge variant="outline" className="text-xs text-ink-muted">
              Job Zone {detail.jobZone.zone} / 5
            </Badge>
          </div>

          {/* Large SOC Code & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-ink font-mono text-xl font-black tracking-tight lg:text-2xl">
                {detail.socCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="hover:bg-surface-inset text-ink-muted hover:text-ink focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-lg border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1"
                title="Sao chép mã SOC"
                aria-label="Sao chép mã SOC"
              >
                {copied ? (
                  <Check className="text-success size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard?.writeText(window.location.href)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }
              }}
              className="gap-1.5 text-xs text-ink-muted hover:text-ink h-8 px-2.5"
            >
              <Share2 className="size-3.5" />
              <span>Chia sẻ liên kết</span>
            </Button>
          </div>

          {/* Job Title */}
          <div>
            <h1 className="text-ink text-lg font-bold lg:text-xl">
              {detail.title}
            </h1>
          </div>
        </div>

        {/* 5 Tabs Switcher */}
        <div className="mt-3">
          <Tabs
            value={activeDetailTab}
            onValueChange={(val) => onSelectDetailTab(val as OnetDetailSubTab)}
          >
            <TabsList className="bg-surface-inset flex h-9 w-full justify-start overflow-x-auto p-1">
              <TabsTrigger value="overview" className="gap-1.5 text-xs px-3 py-1">
                <span>Tổng quan</span>
              </TabsTrigger>
              <TabsTrigger value="tech" className="gap-1.5 text-xs px-3 py-1">
                <span>Kỹ năng Phần mềm</span>
                <span className="text-[10px] opacity-75">({detail.stats.toolCount})</span>
              </TabsTrigger>
              <TabsTrigger value="sfia" className="gap-1.5 text-xs px-3 py-1">
                <span>Ánh xạ SFIA</span>
                <span className="text-[10px] opacity-75">({detail.stats.mappingCount})</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-1.5 text-xs px-3 py-1">
                <span>Nhiệm vụ</span>
                <span className="text-[10px] opacity-75">({detail.stats.taskCount})</span>
              </TabsTrigger>
              <TabsTrigger value="titles" className="gap-1.5 text-xs px-3 py-1">
                <span>Chức danh</span>
                <span className="text-[10px] opacity-75">({detail.stats.alternateTitleCount})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Body (Independently Scrollable with scrollbar-thin) */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 scrollbar-thin"
      >
        {/* Tab 1: Overview */}
        {activeDetailTab === 'overview' && (
          <OnetOverviewTab
            detail={detail}
            onSelectDetailTab={onSelectDetailTab}
          />
        )}

        {/* Tab 2: Tech Skills */}
        {activeDetailTab === 'tech' && (
          <OnetTechSkillsTab skills={detail.softwareSkills} />
        )}

        {/* Tab 3: SFIA Mapping CRUD Inline */}
        {activeDetailTab === 'sfia' && (
          <OnetSfiaTab
            socCode={detail.socCode}
            occupationTitle={detail.title}
            mappings={detail.sfiaMappings}
            onUpdateMappings={handleUpdateMappings}
            onDirtyChange={onDirtyChange}
          />
        )}

        {/* Tab 4: Tasks */}
        {activeDetailTab === 'tasks' && (
          <OnetTasksTab tasks={detail.tasks} />
        )}

        {/* Tab 5: Alternate Job Titles */}
        {activeDetailTab === 'titles' && (
          <OnetAlternateTitlesTab titles={detail.alternateTitles} />
        )}
      </div>
    </div>
  )
}
