'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import {
  Copy,
  Check,
  Sparkles,
  GraduationCap,
  Briefcase,
  Wrench,
  FileCheck2,
  Share2,
  Clock,
  Layers,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { onetMockService } from '@/services/onet.mock'
import type {
  OnetOccupationDetail,
  OnetDetailSubTab,
} from './types'

export interface OnetDetailShellProps {
  socCode: string
  activeDetailTab: OnetDetailSubTab
  onSelectDetailTab: (tab: OnetDetailSubTab) => void
  onLoadedDetail?: (detail: OnetOccupationDetail) => void
  className?: string
}

export function OnetDetailShell({
  socCode,
  activeDetailTab,
  onSelectDetailTab,
  onLoadedDetail,
  className,
}: OnetDetailShellProps) {
  const [detail, setDetail] = useState<OnetOccupationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [prevSoc, setPrevSoc] = useState(socCode)

  if (prevSoc !== socCode) {
    setPrevSoc(socCode)
    setLoading(true)
    setError(null)
  }

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

      {/* Main Content Body (Independently Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
        {/* Tab 1: Overview Tab Content */}
        {activeDetailTab === 'overview' && (
          <div className="space-y-3.5">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
                    Công nghệ
                  </span>
                  <Wrench className="text-brand size-3.5" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-ink text-xl font-bold tabular-nums">
                    {detail.stats.toolCount}
                  </span>
                  <span className="text-ink-faint text-xs">tools</span>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
                    SFIA 9
                  </span>
                  <Sparkles className="text-success size-3.5" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-ink text-xl font-bold tabular-nums">
                    {detail.stats.mappingCount}
                  </span>
                  <span className="text-ink-faint text-xs">kỹ năng</span>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
                    Nhiệm vụ
                  </span>
                  <FileCheck2 className="text-brand size-3.5" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-ink text-xl font-bold tabular-nums">
                    {detail.stats.taskCount}
                  </span>
                  <span className="text-ink-faint text-xs">tasks</span>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted text-xs font-medium uppercase tracking-wider">
                    Chức danh
                  </span>
                  <Layers className="text-ink-muted size-3.5" />
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-ink text-xl font-bold tabular-nums">
                    {detail.stats.alternateTitleCount}
                  </span>
                  <span className="text-ink-faint text-xs">titles</span>
                </div>
              </Card>
            </div>

            {/* Description Card */}
            <Card className="p-3.5 sm:p-4">
              <h2 className="text-ink text-xs font-semibold uppercase tracking-wider">
                Mô tả Vai trò Nghề nghiệp (O*NET Content Model)
              </h2>
              <p className="text-ink/90 mt-2 text-xs sm:text-sm leading-relaxed">
                {detail.description}
              </p>
            </Card>

            {/* Job Zone Card */}
            <Card className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="text-brand size-4" />
                  <h2 className="text-ink text-xs sm:text-sm font-semibold">
                    Job Zone {detail.jobZone.zone}: {detail.jobZone.name}
                  </h2>
                </div>
                <Badge variant="outline" className="text-[11px]">
                  Cấp độ {detail.jobZone.zone} / 5
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-ink-muted text-[11px]">
                    <GraduationCap className="size-3" />
                    <span>Trình độ học vấn</span>
                  </div>
                  <p className="text-ink text-xs font-medium leading-normal">
                    {detail.jobZone.education}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-ink-muted text-[11px]">
                    <Briefcase className="size-3" />
                    <span>Kinh nghiệm yêu cầu</span>
                  </div>
                  <p className="text-ink text-xs font-medium leading-normal">
                    {detail.jobZone.experience}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-ink-muted text-[11px]">
                    <Clock className="size-3" />
                    <span>Đào tạo tại chỗ</span>
                  </div>
                  <p className="text-ink text-xs font-medium leading-normal">
                    {detail.jobZone.jobTraining}
                  </p>
                </div>
              </div>
            </Card>

            {/* Phase 1 Completion Note Banner */}
            <div className="border-brand/30 bg-brand/5 flex items-start gap-2.5 rounded-xl border p-3">
              <Info className="text-brand mt-0.5 size-4 shrink-0" />
              <div className="space-y-0.5 text-xs leading-relaxed">
                <p className="text-brand font-semibold text-[11px]">
                  Sẵn sàng chuyển tiếp sang Phase 2 & 3
                </p>
                <p className="text-ink-muted text-[11px]">
                  Bạn đang xem bộ khung điều hướng và Master Sidebar của <strong>Phase 1</strong>. Các tab chi tiết chuyên sâu gồm Interactive Tech Cloud, Bảng Ánh xạ SFIA CRUD Inline, Phân loại Nhiệm vụ Core/Supplemental, và Tra cứu Chức danh thị trường sẽ được kích hoạt trong <strong>Phase 2</strong> và <strong>Phase 3</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tabs Placeholder (Ready for Phase 2 & 3) */}
        {activeDetailTab !== 'overview' && (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-surface-inset text-brand flex size-14 items-center justify-center rounded-2xl">
              <Layers className="size-7" />
            </div>
            <h3 className="text-ink mt-4 text-base font-bold">
              Tab {activeDetailTab === 'tech' && 'Kỹ năng Phần mềm (Tech Skills)'}
              {activeDetailTab === 'sfia' && 'Ánh xạ Năng lực SFIA (SFIA Mappings)'}
              {activeDetailTab === 'tasks' && 'Nhiệm vụ Công việc (Tasks)'}
              {activeDetailTab === 'titles' && 'Chức danh Thị trường (Alternate Titles)'}
            </h3>
            <p className="text-ink-muted mt-2 max-w-md text-xs leading-relaxed">
              Nội dung chuyên sâu của tab này đã được chuẩn bị đầy đủ dữ liệu trong Mock Service và sẽ được kích hoạt giao diện chi tiết trong <strong>Phase 2</strong> (Tech Skills, Tasks, Titles) và <strong>Phase 3</strong> (SFIA CRUD Inline).
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectDetailTab('overview')}
              className="mt-5 text-xs"
            >
              Quay lại tab Tổng quan
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
