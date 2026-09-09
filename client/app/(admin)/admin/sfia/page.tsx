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
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { LoadingState } from '@/components/patterns/FeedbackPatterns'
import {
  useSfiaParams,
  type SfiaMainTab,
  type SfiaCategory,
  type SfiaSubcategory,
  type SfiaSkillSummary,
  type SfiaCoverageStats,
  SFIA_CATEGORY_THEMES,
  SFIA_LEVEL_DEFINITIONS,
  getCategoryTheme,
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
          <div className="flex flex-col gap-4 p-1">
            {/* Phase 1 Data Sanity Banner */}
            <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                  <h2 className="text-sm font-bold text-ink">
                    Phase 1 Foundation & Data Contract Verification
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span>Trạng thái URL:</span>
                  <code className="bg-surface-inset px-2 py-0.5 rounded font-mono text-[11px] text-brand">
                    ?tab={activeTab}&skill={selectedSkill}&level={selectedLevel}
                  </code>
                </div>
              </div>

              {/* Live Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="bg-surface-raised/60 p-3 rounded-lg border border-border/50">
                  <span className="text-[11px] text-ink-muted font-medium">Danh mục lớn</span>
                  <p className="text-lg font-bold text-ink mt-0.5">{categories.length} Nhóm</p>
                </div>
                <div className="bg-surface-raised/60 p-3 rounded-lg border border-border/50">
                  <span className="text-[11px] text-ink-muted font-medium">Phân nhóm chuyên môn</span>
                  <p className="text-lg font-bold text-ink mt-0.5">{subcategories.length} Nhóm</p>
                </div>
                <div className="bg-surface-raised/60 p-3 rounded-lg border border-border/50">
                  <span className="text-[11px] text-ink-muted font-medium">Kỹ năng mẫu nạp</span>
                  <p className="text-lg font-bold text-ink mt-0.5">{skills.length} Kỹ năng</p>
                </div>
                <div className="bg-surface-raised/60 p-3 rounded-lg border border-border/50">
                  <span className="text-[11px] text-ink-muted font-medium">Cấp độ trách nhiệm</span>
                  <p className="text-lg font-bold text-ink mt-0.5">7 Cấp độ</p>
                </div>
                <div className="bg-surface-raised/60 p-3 rounded-lg border border-border/50">
                  <span className="text-[11px] text-ink-muted font-medium">Thuộc tính nền tảng</span>
                  <p className="text-lg font-bold text-ink mt-0.5">5 Trụ cột</p>
                </div>
                <div className="bg-surface-raised/60 p-3 rounded-lg border border-border/50">
                  <span className="text-[11px] text-ink-muted font-medium">Độ phủ câu hỏi</span>
                  <p className="text-lg font-bold text-ink mt-0.5">{stats?.totalQuestions ?? 0} Câu</p>
                </div>
              </div>
            </div>

            {/* 6 Category Themes Preview */}
            <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
                Hệ thống 6 Danh mục chuyên môn & Mã màu chuẩn SFIA 9
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const theme = getCategoryTheme(cat.code)
                  return (
                    <div
                      key={cat.code}
                      className="border border-border/70 rounded-lg p-3 bg-surface hover:bg-surface-raised/80 transition-colors flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${theme.dot}`} />
                          <span className="text-xs font-bold text-ink">{cat.nameVi}</span>
                        </div>
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${theme.badge}`}>
                          {cat.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted leading-relaxed line-clamp-2">
                        {cat.description}
                      </p>
                      <div className="text-[10px] text-ink-muted flex items-center justify-between pt-1 border-t border-border/40">
                        <span>{cat.name}</span>
                        <span className="font-semibold text-ink">{cat.skillCount} kỹ năng</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Interactive State Demo for Selected Skill */}
            <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Trạng thái chọn mẫu (URL State Synchronizer)
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSkill('PROG', 3)}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border border-violet-500/30 transition-colors"
                  >
                    Chọn PROG (L3)
                  </button>
                  <button
                    onClick={() => setSkill('ARCH', 6)}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/30 transition-colors"
                  >
                    Chọn ARCH (L6)
                  </button>
                  <button
                    onClick={() => setSkill('TEST', 2)}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border border-violet-500/30 transition-colors"
                  >
                    Chọn TEST (L2)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-inset rounded-lg">
                <span className="text-xs text-ink-muted">Kỹ năng hiện tại:</span>
                <span className="font-mono text-xs font-bold text-ink bg-card px-2 py-0.5 rounded border border-border">
                  {selectedSkill}
                </span>
                <span className="text-xs text-ink-muted ml-2">Cấp độ:</span>
                <span className="text-xs font-semibold text-brand bg-card px-2 py-0.5 rounded border border-border">
                  {SFIA_LEVEL_DEFINITIONS[selectedLevel]?.shortName || `Level ${selectedLevel}`}
                </span>
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
