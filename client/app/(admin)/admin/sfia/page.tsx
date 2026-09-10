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
  type SfiaCoverageStats,
  SFIA_CATEGORY_THEMES,
  SFIA_LEVEL_DEFINITIONS,
  getCategoryTheme,
  SfiaAnatomyBanner,
  SfiaSidebarTree,
  SfiaMobileDrawer,
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Đã sao chép mã kỹ năng: ${code}`)
    setTimeout(() => {
      setCopiedCode(null)
    }, 2000)
  }

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

              {/* Right Column: Hero Preview Card (Phase 2 Preview / Phase 3 Placeholder) */}
              <div className="col-span-1 lg:col-span-8 xl:col-span-8 flex flex-col gap-3 overflow-y-auto">
                {(() => {
                  const currentSkill = skills.find((s) => s.code === selectedSkill) || skills[0]
                  const currentCat = categories.find((c) => c.code === currentSkill?.categoryCode)
                  const currentSub = subcategories.find((s) => s.code === currentSkill?.subcategoryCode)
                  const theme = getCategoryTheme(currentSkill?.categoryCode || 'DEV_IMPL')

                  if (!currentSkill) return null

                  return (
                    <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'size-12 rounded-xl flex items-center justify-center font-mono font-bold text-base border shadow-xs',
                              theme.badge
                            )}
                          >
                            {currentSkill.code}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-base sm:text-lg font-bold text-ink">
                                {currentSkill.name}
                              </h2>
                              <span
                                className={cn(
                                  'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border',
                                  theme.badge
                                )}
                              >
                                Level {currentSkill.minLevel} ➔ Level {currentSkill.maxLevel}
                              </span>
                            </div>

                            {/* Breadcrumb Navigation */}
                            <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <span className={cn('size-2 rounded-full', theme.dot)} />
                                <strong className="text-ink font-medium">{currentCat?.nameVi || currentSkill.categoryCode}</strong>
                              </span>
                              <span>›</span>
                              <span>{currentSub?.nameVi || currentSub?.name || currentSkill.subcategoryCode}</span>
                              <span>›</span>
                              <span className="font-mono text-ink font-semibold">{currentSkill.code}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons & Current Level Indicator */}
                        <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyCode(currentSkill.code)}
                              className="h-8 px-2.5 text-xs gap-1.5"
                            >
                              {copiedCode === currentSkill.code ? (
                                <>
                                  <Check className="size-3.5 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3.5 text-ink-muted" />
                                  <span>Sao chép mã</span>
                                </>
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTab('matrix')}
                              className="h-8 px-2.5 text-xs gap-1.5 text-brand hover:text-brand"
                              title="Xem vị trí kỹ năng trong Ma trận 2D"
                            >
                              <Grid3X3 className="size-3.5" />
                              <span>Ma trận 2D</span>
                            </Button>
                          </div>

                          <div className="bg-surface-raised/80 border border-border/70 rounded-lg px-2.5 py-1.5 text-right w-full">
                            <span className="text-[10px] text-ink-muted uppercase font-semibold block">
                              Cấp độ đang chọn
                            </span>
                            <span className="text-xs font-bold text-brand mt-0.5 inline-block">
                              {SFIA_LEVEL_DEFINITIONS[selectedLevel]?.name || `Level ${selectedLevel}`} (L{selectedLevel})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-surface-inset p-3 rounded-lg border border-border/50">
                          <span className="text-[11px] text-ink-muted">Dải cấp độ khả dụng</span>
                          <p className="text-sm font-bold text-ink mt-0.5 font-mono">
                            L{currentSkill.minLevel} đến L{currentSkill.maxLevel} ({currentSkill.maxLevel - currentSkill.minLevel + 1} levels)
                          </p>
                        </div>
                        <div className="bg-surface-inset p-3 rounded-lg border border-border/50">
                          <span className="text-[11px] text-ink-muted">Câu hỏi phỏng vấn</span>
                          <p className="text-sm font-bold text-ink mt-0.5">
                            {currentSkill.questionCount} câu hỏi
                          </p>
                        </div>
                        <div className="bg-surface-inset p-3 rounded-lg border border-border/50">
                          <span className="text-[11px] text-ink-muted">Nghề O*NET liên kết</span>
                          <p className="text-sm font-bold text-ink mt-0.5">
                            {currentSkill.onetCount} vị trí nghề
                          </p>
                        </div>
                        <div className="bg-surface-inset p-3 rounded-lg border border-border/50">
                          <span className="text-[11px] text-ink-muted">Trạng thái dữ liệu</span>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Chuẩn SFIA 9.0
                          </p>
                        </div>
                      </div>

                      {/* Overview Summary Box */}
                      <div className="bg-surface-raised/30 border border-border/60 rounded-lg p-3.5 space-y-1">
                        <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                          Tổng quan Kỹ năng Chuyên môn
                        </h3>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          Kỹ năng <strong className="text-ink">{currentSkill.name}</strong> ({currentSkill.code}) thuộc phân nhóm <strong className="text-ink">{currentSub?.nameVi || currentSub?.name}</strong> trong danh mục <strong className="text-ink">{currentCat?.nameVi}</strong>. Kỹ năng này bao quát các chuẩn năng lực chuyên môn từ Cấp độ {currentSkill.minLevel} đến Cấp độ {currentSkill.maxLevel} theo khung tham chiếu quốc tế SFIA 9.
                        </p>
                      </div>

                      {/* Phase 3 Notice Banner */}
                      <div className="bg-brand/5 border border-brand/20 rounded-lg p-3.5 flex items-start gap-2.5">
                        <Sparkles className="size-4 text-brand shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-bold text-ink">
                            Khung chi tiết đa tầng (Interactive 7-Level Steppers & Behavior Statements)
                          </p>
                          <p className="text-ink-muted mt-0.5 leading-relaxed">
                            Thước đo dải cấp độ 7 đốt trực quan, bản phát biểu năng lực chi tiết (`sfia.skill_levels`) và ghi chú ngữ cảnh (`guidance_notes`) sẽ được xây dựng hoàn chỉnh trong Phase 3.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
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
