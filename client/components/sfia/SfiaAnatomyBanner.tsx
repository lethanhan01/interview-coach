'use client'

import React, { useState, useEffect } from 'react'
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
import type { SfiaCoverageStats } from './types'

const LOCAL_STORAGE_KEY = 'sfia_anatomy_banner_collapsed'

export interface SfiaAnatomyBannerProps {
  stats?: SfiaCoverageStats | null
  className?: string
}

export function SfiaAnatomyBanner({ stats, className }: SfiaAnatomyBannerProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved !== null) {
        setCollapsed(saved === 'true')
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, String(next))
      } catch {
        // Ignore localStorage errors
      }
      return next
    })
  }

  // Prevent layout shift during hydration
  if (!hasMounted) {
    return (
      <div className={cn('bg-card border border-border/80 rounded-xl p-4 shadow-sm animate-pulse', className)}>
        <div className="h-6 bg-surface-raised rounded w-1/3 mb-2" />
        <div className="h-4 bg-surface-raised rounded w-1/2" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-card border border-border/80 rounded-xl shadow-sm transition-all duration-200 overflow-hidden',
        className
      )}
    >
      {/* Banner Top Header */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 bg-surface-raised/30 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-lg border border-brand/20">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-ink">
                Khung Cấu Trúc Phân Tầng SFIA 9 (Framework Anatomy)
              </h2>
              <Badge variant="secondary" className="text-[10px] uppercase font-semibold px-2 py-0.5">
                4 Trụ cột Chuẩn Quốc Tế
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-ink-muted mt-0.5">
              Mô hình chuẩn hóa từ Danh mục nghiệp vụ ➔ Phân nhóm chuyên môn ➔ Kỹ năng thực hành ➔ 7 Cấp độ trách nhiệm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="text-xs text-ink-muted hover:text-ink gap-1.5 h-8 px-2.5"
            aria-label={collapsed ? 'Mở rộng giải phẫu cấu trúc SFIA 9' : 'Thu gọn giải phẫu cấu trúc SFIA 9'}
          >
            {collapsed ? (
              <>
                <span className="hidden sm:inline">Mở rộng sơ đồ</span>
                <ChevronDown className="size-3.5" />
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Thu gọn</span>
                <ChevronUp className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!collapsed && (
        <div className="p-3.5 sm:p-4 flex flex-col gap-4">
          {/* 4 Pillars Flow Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 sm:gap-3 relative">
            {/* Pillar 1: Categories */}
            <div className="bg-surface border border-blue-500/30 rounded-lg p-3 flex flex-col justify-between relative group hover:border-blue-500/50 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="size-3" /> Trụ cột 1
                  </span>
                  <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                    6 Danh mục
                  </span>
                </div>
                <h3 className="text-xs font-bold text-ink">Danh mục Nghiệp vụ</h3>
                <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                  Phân loại 6 lĩnh vực chính: Chiến lược, Chuyển đổi, Phát triển, Vận hành, Con người, Đối tác.
                </p>
              </div>
              <div className="text-[10px] text-ink-muted/80 pt-2 mt-2 border-t border-border/40 font-mono">
                STRAT_ARCH • DEV_IMPL...
              </div>
            </div>

            {/* Pillar 2: Subcategories */}
            <div className="bg-surface border border-emerald-500/30 rounded-lg p-3 flex flex-col justify-between relative group hover:border-emerald-500/50 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <FolderTree className="size-3" /> Trụ cột 2
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                    22 Phân nhóm
                  </span>
                </div>
                <h3 className="text-xs font-bold text-ink">Phân nhóm Chuyên môn</h3>
                <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                  Gom cụm các phân nhánh kỹ thuật: Systems development, Data & analytics, Security, UX...
                </p>
              </div>
              <div className="text-[10px] text-ink-muted/80 pt-2 mt-2 border-t border-border/40 font-mono">
                SYS_DEV • DATA_ANA...
              </div>
            </div>

            {/* Pillar 3: Skills */}
            <div className="bg-surface border border-violet-500/30 rounded-lg p-3 flex flex-col justify-between relative group hover:border-violet-500/50 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1">
                    <FileCode2 className="size-3" /> Trụ cột 3
                  </span>
                  <span className="bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                    147 Kỹ năng
                  </span>
                </div>
                <h3 className="text-xs font-bold text-ink">Kỹ năng Thực hành</h3>
                <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                  Mã 4 chữ cái (PROG, SWDN, DBDS). Mỗi kỹ năng sở hữu dải cấp độ độc lập (min_level..max_level).
                </p>
              </div>
              <div className="text-[10px] text-ink-muted/80 pt-2 mt-2 border-t border-border/40 font-mono">
                PROG (L2-6) • ARCH (L5-7)
              </div>
            </div>

            {/* Pillar 4: Responsibility Levels */}
            <div className="bg-surface border border-amber-500/30 rounded-lg p-3 flex flex-col justify-between relative group hover:border-amber-500/50 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Award className="size-3" /> Trụ cột 4
                  </span>
                  <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                    7 Cấp độ
                  </span>
                </div>
                <h3 className="text-xs font-bold text-ink">Cấp độ Trách nhiệm</h3>
                <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                  Từ Level 1 (Follow) đến Level 7 (Set strategy), gắn kết với 5 thuộc tính nền tảng (Autonomy, Influence...).
                </p>
              </div>
              <div className="text-[10px] text-ink-muted/80 pt-2 mt-2 border-t border-border/40 font-mono">
                Level 1 ➔ Level 7
              </div>
            </div>
          </div>

          {/* 4 Mini-Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-surface-inset/60 border border-border/50 rounded-lg p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-ink-muted font-medium block">Kỹ năng SFIA 9</span>
                <span className="text-sm sm:text-base font-bold text-ink">147 Kỹ năng</span>
              </div>
              <div className="size-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                147
              </div>
            </div>

            <div className="bg-surface-inset/60 border border-border/50 rounded-lg p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-ink-muted font-medium block">Phân nhóm chuyên môn</span>
                <span className="text-sm sm:text-base font-bold text-ink">22 Phân nhóm</span>
              </div>
              <div className="size-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                22
              </div>
            </div>

            <div className="bg-surface-inset/60 border border-border/50 rounded-lg p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-ink-muted font-medium block">Danh mục lớn</span>
                <span className="text-sm sm:text-base font-bold text-ink">6 Danh mục</span>
              </div>
              <div className="size-7 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">
                6
              </div>
            </div>

            <div className="bg-surface-inset/60 border border-border/50 rounded-lg p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-ink-muted font-medium block">Câu hỏi phỏng vấn</span>
                <span className="text-sm sm:text-base font-bold text-ink">
                  {stats?.totalQuestions ?? 0} Câu hỏi
                </span>
              </div>
              <div className="size-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                {stats?.totalQuestions ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
