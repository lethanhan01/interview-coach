'use client'

import React, { Suspense, useEffect, useState } from 'react'
import {
  Network,
  FolderTree,
  Grid3X3,
  SlidersHorizontal,
  BarChart3,
  Layers,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { LoadingState } from '@/components/patterns/FeedbackPatterns'
import { cn } from '@/lib/utils'
import {
  useSfiaParams,
  type SfiaMainTab,
  type SfiaCategory,
  type SfiaSubcategory,
  type SfiaSkillSummary,
  type SfiaSkillDetail,
  type SfiaCoverageStats,
  SFIA_CATEGORY_THEMES,
  SFIA_LEVEL_DEFINITIONS,
  getCategoryTheme,
  SfiaAnatomyBanner,
  SfiaSidebarTree,
  SfiaMobileDrawer,
  SfiaDetailPanel,
} from '@/components/sfia'
import { sfiaAdminService } from '@/services/sfia-admin.service'

function SfiaBrowserWorkspace() {
  const {
    activeTab,
    selectedSkill,
    selectedLevel,
    selectedCategory,
    setTab,
    setSkill,
    setLevel,
  } = useSfiaParams()

  const [categories, setCategories] = useState<SfiaCategory[]>([])
  const [subcategories, setSubcategories] = useState<SfiaSubcategory[]>([])
  const [skills, setSkills] = useState<SfiaSkillSummary[]>([])
  const [skillDetail, setSkillDetail] = useState<SfiaSkillDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [stats, setStats] = useState<SfiaCoverageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [catList, subList, skillList, statData] = await Promise.all([
          sfiaAdminService.getCategories(),
          sfiaAdminService.getSubcategories(),
          sfiaAdminService.getSkills(),
          sfiaAdminService.getCoverageStats(),
        ])
        setCategories(catList)
        setSubcategories(subList)
        setSkills(skillList)
        setStats(statData)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Fetch detailed skill data whenever selectedSkill changes
  useEffect(() => {
    let isCancelled = false
    async function loadSkillDetail() {
      if (!selectedSkill) return
      try {
        setLoadingDetail(true)
        setDetailError(null)
        const detail = await sfiaAdminService.getSkillDetail(selectedSkill)
        if (!isCancelled) {
          if (detail) {
            setSkillDetail(detail)
          } else {
            setDetailError(`Không tìm thấy chi tiết cho kỹ năng ${selectedSkill}`)
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setDetailError(
            err instanceof Error ? err.message : 'Không thể tải chi tiết kỹ năng SFIA'
          )
        }
      } finally {
        if (!isCancelled) {
          setLoadingDetail(false)
        }
      }
    }

    loadSkillDetail()
    return () => {
      isCancelled = true
    }
  }, [selectedSkill])

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 flex-1">
      {/* Top Header Bar (Flat Workspace Header) */}
      <div className="border-border/60 flex shrink-0 flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-1.5 pt-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Network className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-ink text-base sm:text-lg font-bold tracking-tight">
                SFIA 9 Knowledge Browser
              </h1>
              <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                SFIA 9.0
              </span>
              <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-ink-muted text-xs leading-none mt-0.5">
              Khung năng lực kỹ năng số chuẩn quốc tế (Skills Framework for the Information Age) & Ánh xạ câu hỏi phỏng vấn
            </p>
          </div>
        </div>

        {/* Top-Level 4 Main Tabs Switcher */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setTab(val as SfiaMainTab)}
          className="shrink-0"
        >
          <TabsList className="bg-surface-inset h-9 p-1">
            <TabsTrigger value="taxonomy" className="gap-1.5 text-xs font-semibold px-2.5 py-1">
              <FolderTree className="size-3.5" />
              <span>Khám phá Cây kỹ năng</span>
            </TabsTrigger>
            <TabsTrigger value="matrix" className="gap-1.5 text-xs font-semibold px-2.5 py-1">
              <Grid3X3 className="size-3.5" />
              <span>Ma trận 2D</span>
            </TabsTrigger>
            <TabsTrigger value="attributes" className="gap-1.5 text-xs font-semibold px-2.5 py-1">
              <SlidersHorizontal className="size-3.5" />
              <span>Cấp độ & Thuộc tính</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs font-semibold px-2.5 py-1">
              <BarChart3 className="size-3.5" />
              <span>Thống kê độ phủ</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Tab Content Panels */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Tab 1: Taxonomy Explorer (Phases 1-4 Foundation) */}
        {activeTab === 'taxonomy' && (
          <div className="flex flex-col gap-3 h-full min-h-0">
            {/* Phase 2.1 SFIA 9 Anatomy Banner */}
            <SfiaAnatomyBanner stats={stats} />

            {/* Phase 2.3 Mobile Drawer Trigger (Visible on < lg) */}
            <SfiaMobileDrawer
              categories={categories}
              subcategories={subcategories}
              skills={skills}
              selectedSkill={selectedSkill}
              selectedLevel={selectedLevel}
              onSelectSkill={(code, level) => setSkill(code, level)}
            />

            {/* Split-Pane Workspace: Left = Sidebar Tree, Right = Detail Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
              {/* Left Column: 3-Tier Collapsible Tree (Desktop >= lg) */}
              <div className="hidden lg:block lg:col-span-4 xl:col-span-4 h-full min-h-0">
                <SfiaSidebarTree
                  categories={categories}
                  subcategories={subcategories}
                  skills={skills}
                  selectedSkill={selectedSkill}
                  selectedLevel={selectedLevel}
                  onSelectSkill={(code, level) => setSkill(code, level)}
                  className="h-full"
                />
              </div>

              {/* Right Column: Complete SfiaDetailPanel (Phase 3) */}
              <div className="col-span-1 lg:col-span-8 xl:col-span-8 flex flex-col gap-3 overflow-y-auto">
                <SfiaDetailPanel
                  skillDetail={skillDetail}
                  loading={loadingDetail}
                  error={detailError}
                  categories={categories}
                  subcategories={subcategories}
                  selectedLevel={selectedLevel}
                  onSelectLevel={(level) => setLevel(level)}
                  onNavigateToMatrix={() => setTab('matrix')}
                  onRetry={() => {
                    if (selectedSkill) {
                      setLoadingDetail(true)
                      setDetailError(null)
                      sfiaAdminService
                        .getSkillDetail(selectedSkill)
                        .then((d) => setSkillDetail(d))
                        .catch((e) =>
                          setDetailError(e instanceof Error ? e.message : 'Không thể tải chi tiết')
                        )
                        .finally(() => setLoadingDetail(false))
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: SFIA Matrix Grid 2D (Phase 5 Placeholder Shell) */}
        {activeTab === 'matrix' && (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-card border border-border/80 rounded-xl">
            <div className="bg-brand/10 text-brand p-3 rounded-full mb-3">
              <Grid3X3 className="size-8" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1">
              SFIA 9 Matrix Grid 2D (Ma Trận 147 Kỹ Năng x 7 Cấp Độ)
            </h3>
            <p className="text-xs text-ink-muted max-w-md mb-4 leading-relaxed">
              Bảng ma trận 2 chiều với Sticky Headers, xem nhanh qua Slide-over Sheet và bộ lọc điểm mù sẽ được xây dựng trong Phase 5.
            </p>
            <div className="flex items-center gap-2 text-xs text-ink-muted bg-surface-inset px-3 py-1.5 rounded-lg border border-border">
              <span>Đã nạp sẵn:</span>
              <strong className="text-ink">{skills.length} kỹ năng</strong>
              <span>x</span>
              <strong className="text-ink">7 cấp độ trách nhiệm</strong>
            </div>
          </div>
        )}

        {/* Tab 3: Generic Attributes (Phase 6 Placeholder Shell) */}
        {activeTab === 'attributes' && (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-card border border-border/80 rounded-xl">
            <div className="bg-amber-500/10 text-amber-600 p-3 rounded-full mb-3">
              <SlidersHorizontal className="size-8" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1">
              7 Cấp Độ Trách Nhiệm & 5 Thuộc Tính Năng Lực Nền Tảng
            </h3>
            <p className="text-xs text-ink-muted max-w-md mb-4 leading-relaxed">
              Chế độ xem kép (Theo từng cấp độ & Ma trận so sánh tiến trình thuộc tính) sẽ được xây dựng trong Phase 6.
            </p>
            <div className="flex items-center gap-2 text-xs text-ink-muted bg-surface-inset px-3 py-1.5 rounded-lg border border-border">
              <span>5 Trụ cột:</span>
              <span className="font-semibold text-ink">Autonomy, Influence, Complexity, Business skills, Knowledge</span>
            </div>
          </div>
        )}

        {/* Tab 4: Analytics (Phase 7 Placeholder Shell) */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-card border border-border/80 rounded-xl">
            <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-full mb-3">
              <BarChart3 className="size-8" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1">
              Coverage Analytics Dashboard & Bảng Cảnh Báo Điểm Mù
            </h3>
            <p className="text-xs text-ink-muted max-w-md mb-4 leading-relaxed">
              Biểu đồ phân bổ 6 danh mục, tỷ lệ phủ theo 7 level và bảng danh sách kỹ năng chưa có câu hỏi (Blind Spots) sẽ được xây dựng trong Phase 7.
            </p>
            <div className="flex items-center gap-4 text-xs text-ink-muted bg-surface-inset px-4 py-2 rounded-lg border border-border">
              <span>Tổng kỹ năng: <strong className="text-ink">147</strong></span>
              <span>Đã có câu hỏi: <strong className="text-emerald-600 font-semibold">{stats?.skillsWithQuestions}</strong></span>
              <span>Điểm mù: <strong className="text-rose-600 font-semibold">{stats?.blindSpotsCount}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SfiaAdminPage() {
  return (
    <Suspense
      fallback={
        <LoadingState
          text="Đang khởi tạo SFIA 9 Knowledge Browser..."
          minHeight="min-h-[60vh]"
        />
      }
    >
      <SfiaBrowserWorkspace />
    </Suspense>
  )
}
