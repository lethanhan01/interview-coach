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
  type SfiaMatrixCellData,
  type SfiaMatrixDisplayMode,
  type SfiaQuestionBankItem,
  type SfiaLevelResponsibility,
  type SfiaGenericAttribute,
  type SfiaAttributesViewMode,
  SFIA_CATEGORY_THEMES,
  SFIA_LEVEL_DEFINITIONS,
  getCategoryTheme,
  SfiaAnatomyBanner,
  SfiaSidebarTree,
  SfiaMobileDrawer,
  SfiaDetailPanel,
  SfiaMatrixToolbar,
  SfiaMatrixView,
  SfiaMatrixInspectionSheet,
  SfiaCreateQuestionModal,
  SfiaGenericAttributesView,
  downloadSfiaMatrixCsv,
} from '@/components/sfia'
import { sfiaAdminService } from '@/services/sfia-admin.service'

function SfiaBrowserWorkspace() {
  const {
    activeTab,
    selectedSkill,
    selectedLevel,
    selectedCategory,
    attrView,
    setTab,
    setSkill,
    setLevel,
    setCategory,
    setAttrView,
  } = useSfiaParams()

  const [categories, setCategories] = useState<SfiaCategory[]>([])
  const [subcategories, setSubcategories] = useState<SfiaSubcategory[]>([])
  const [skills, setSkills] = useState<SfiaSkillSummary[]>([])
  const [skillDetail, setSkillDetail] = useState<SfiaSkillDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [stats, setStats] = useState<SfiaCoverageStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Phase 5 Matrix Grid States
  const [matrixCells, setMatrixCells] = useState<Record<string, SfiaMatrixCellData>>({})
  const [matrixSearch, setMatrixSearch] = useState('')
  const [matrixDisplayMode, setMatrixDisplayMode] = useState<SfiaMatrixDisplayMode>('level')
  const [matrixBlindSpotsOnly, setMatrixBlindSpotsOnly] = useState(false)
  const [inspectedCell, setInspectedCell] = useState<{ skillCode: string; levelId: number } | null>(null)
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  // Phase 6 Responsibility Levels & Generic Attributes States
  const [responsibilityLevels, setResponsibilityLevels] = useState<SfiaLevelResponsibility[]>([])
  const [genericAttributes, setGenericAttributes] = useState<SfiaGenericAttribute[]>([])
  const [attributesError, setAttributesError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [catList, subList, skillList, statData, matrixData, levelList, attrList] =
          await Promise.all([
            sfiaAdminService.getCategories(),
            sfiaAdminService.getSubcategories(),
            sfiaAdminService.getSkills(),
            sfiaAdminService.getCoverageStats(),
            sfiaAdminService.getMatrixData(),
            sfiaAdminService.getResponsibilityLevels(),
            sfiaAdminService.getGenericAttributes(),
          ])
        setCategories(catList)
        setSubcategories(subList)
        setSkills(skillList)
        setStats(statData)
        setMatrixCells(matrixData.cells)
        setResponsibilityLevels(levelList)
        setGenericAttributes(attrList)
      } catch (err) {
        setAttributesError(
          err instanceof Error ? err.message : 'Không thể tải dữ liệu Cấp độ & Thuộc tính SFIA'
        )
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

  // Lọc kỹ năng hiển thị trong Ma trận 2D
  const displayedMatrixSkills = React.useMemo(() => {
    return skills.filter((skill) => {
      // 1. Lọc theo danh mục
      if (selectedCategory && skill.categoryCode !== selectedCategory) {
        return false
      }
      // 2. Tìm kiếm theo mã hoặc tên
      if (matrixSearch.trim()) {
        const q = matrixSearch.toLowerCase().trim()
        const matchCode = skill.code.toLowerCase().includes(q)
        const matchName = skill.name.toLowerCase().includes(q)
        if (!matchCode && !matchName) return false
      }
      return true
    })
  }, [skills, selectedCategory, matrixSearch])

  // Đếm số lượng kỹ năng có điểm mù trong tập hiển thị
  const blindSpotsCount = React.useMemo(() => {
    let count = 0
    for (const skill of displayedMatrixSkills) {
      for (let lvl = skill.minLevel; lvl <= skill.maxLevel; lvl++) {
        const cell = matrixCells[`${skill.code}_L${lvl}`]
        if (cell && cell.questionCount === 0) {
          count++
          break
        }
      }
    }
    return count
  }, [displayedMatrixSkills, matrixCells])

  // Xử lý xuất file CSV ma trận
  const handleExportCsv = () => {
    try {
      setIsExportingCsv(true)
      const success = downloadSfiaMatrixCsv(
        displayedMatrixSkills,
        categories,
        matrixCells
      )
      if (success) {
        toast.success('Đã xuất ma trận SFIA 2D thành công!', {
          description: 'File CSV UTF-8 đã được tải xuống trình duyệt.',
        })
      } else {
        toast.error('Không thể xuất file CSV ma trận')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo file CSV')
    } finally {
      setIsExportingCsv(false)
    }
  }

  // Xử lý điều hướng từ Sheet sang Tab 1 (Taxonomy)
  const handleOpenInTaxonomy = (skillCode: string, levelId: number) => {
    setSkill(skillCode, levelId)
    setTab('taxonomy')
  }

  // Xử lý đồng bộ dữ liệu Reactive khi tạo câu hỏi mới từ Sheet
  const handleQuestionCreated = (newQuestion: SfiaQuestionBankItem) => {
    if (inspectedCell) {
      const key = `${inspectedCell.skillCode}_L${inspectedCell.levelId}`
      setMatrixCells((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          questionCount: (prev[key]?.questionCount || 0) + 1,
        },
      }))

      // Cập nhật danh sách tóm tắt kỹ năng
      setSkills((prev) =>
        prev.map((s) =>
          s.code === inspectedCell.skillCode
            ? { ...s, questionCount: s.questionCount + 1 }
            : s
        )
      )

      // Cập nhật chi tiết kỹ năng nếu đang cache
      setSkillDetail((prev) => {
        if (!prev || prev.code !== inspectedCell.skillCode) return prev
        return {
          ...prev,
          questionCount: prev.questionCount + 1,
          questionBankItems: [newQuestion, ...(prev.questionBankItems || [])],
        }
      })

      // Cập nhật tổng thể thống kê
      setStats((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          totalQuestions: prev.totalQuestions + 1,
        }
      })

      toast.success('Đã tạo câu hỏi phỏng vấn mới thành công!', {
        description: `Đã cập nhật câu hỏi cho kỹ năng ${inspectedCell.skillCode} Level ${inspectedCell.levelId}.`,
      })
    }
    setIsCreateQuestionOpen(false)
  }

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
      <div
        className={cn(
          'flex-1 min-h-0',
          activeTab === 'matrix' || (activeTab === 'attributes' && attrView === 'matrix')
            ? 'overflow-hidden flex flex-col'
            : 'overflow-y-auto'
        )}
      >
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
                  onSkillUpdated={(updated) => {
                    setSkillDetail(updated)
                    setSkills((prev) =>
                      prev.map((s) =>
                        s.code === updated.code
                          ? { ...s, questionCount: updated.questionCount }
                          : s
                      )
                    )
                  }}
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

        {/* Tab 2: SFIA Matrix Grid 2D (Phase 5 Workspace) */}
        {activeTab === 'matrix' && (
          <div className="flex flex-col gap-2.5 h-full min-h-0 flex-1 overflow-hidden">
            {/* Matrix Toolbar Controls */}
            <SfiaMatrixToolbar
              categories={categories}
              selectedCategory={selectedCategory || ''}
              onCategoryChange={(catCode) => setCategory(catCode || null)}
              searchQuery={matrixSearch}
              onSearchChange={setMatrixSearch}
              displayMode={matrixDisplayMode}
              onDisplayModeChange={setMatrixDisplayMode}
              blindSpotsOnly={matrixBlindSpotsOnly}
              onBlindSpotsOnlyChange={setMatrixBlindSpotsOnly}
              onExportCsv={handleExportCsv}
              totalSkillsCount={skills.length}
              displayedSkillsCount={displayedMatrixSkills.length}
              blindSpotsCount={blindSpotsCount}
              isExporting={isExportingCsv}
            />

            {/* 2D Matrix Table Grid View */}
            <SfiaMatrixView
              skills={displayedMatrixSkills}
              categories={categories}
              cells={matrixCells}
              displayMode={matrixDisplayMode}
              blindSpotsOnly={matrixBlindSpotsOnly}
              inspectedCell={inspectedCell}
              onSelectCell={(skillCode, levelId) =>
                setInspectedCell({ skillCode, levelId })
              }
              onClearFilters={() => {
                setMatrixSearch('')
                setCategory(null)
                setMatrixBlindSpotsOnly(false)
              }}
            />

            {/* Slide-Over Inspection Sheet */}
            <SfiaMatrixInspectionSheet
              isOpen={!!inspectedCell}
              onClose={() => setInspectedCell(null)}
              skillCode={inspectedCell?.skillCode || null}
              levelId={inspectedCell?.levelId || null}
              categories={categories}
              onOpenInTaxonomy={handleOpenInTaxonomy}
              onCreateQuestion={(skillCode, levelId) => {
                setIsCreateQuestionOpen(true)
              }}
            />

            {/* Modal Tạo Câu Hỏi Mới Trực Tiếp Từ Sheet */}
            {isCreateQuestionOpen && inspectedCell && (
              <SfiaCreateQuestionModal
                open={isCreateQuestionOpen}
                onOpenChange={setIsCreateQuestionOpen}
                skillCode={inspectedCell.skillCode}
                skillName={
                  skills.find((s) => s.code === inspectedCell.skillCode)?.name ||
                  inspectedCell.skillCode
                }
                minLevel={
                  skills.find((s) => s.code === inspectedCell.skillCode)?.minLevel || 1
                }
                maxLevel={
                  skills.find((s) => s.code === inspectedCell.skillCode)?.maxLevel || 7
                }
                defaultLevel={inspectedCell.levelId}
                onQuestionCreated={handleQuestionCreated}
              />
            )}
          </div>
        )}

        {/* Tab 3: Generic Attributes & 7 Responsibility Levels (Phase 6 Dual-View) */}
        {activeTab === 'attributes' && (
          <SfiaGenericAttributesView
            levels={responsibilityLevels}
            attributes={genericAttributes}
            selectedLevel={selectedLevel}
            onSelectLevel={(lvl) => setLevel(lvl)}
            viewMode={attrView}
            onViewModeChange={setAttrView}
            onNavigateToMatrixWithLevel={(lvl) => {
              setLevel(lvl)
              setTab('matrix')
            }}
            loading={loading}
            error={attributesError}
            onRetry={async () => {
              try {
                setAttributesError(null)
                const [lvlList, attrList] = await Promise.all([
                  sfiaAdminService.getResponsibilityLevels(),
                  sfiaAdminService.getGenericAttributes(),
                ])
                setResponsibilityLevels(lvlList)
                setGenericAttributes(attrList)
              } catch (err) {
                setAttributesError(
                  err instanceof Error
                    ? err.message
                    : 'Không thể tải lại dữ liệu Cấp độ & Thuộc tính'
                )
              }
            }}
          />
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
