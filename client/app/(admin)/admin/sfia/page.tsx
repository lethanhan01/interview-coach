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
import { LoadingState, ErrorState } from '@/components/patterns/FeedbackPatterns'
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
  SfiaAnalyticsView,
  SfiaBlindSpotsTable,
  downloadSfiaMatrixCsv,
  downloadSfiaBlindSpotsCsv,
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
  const [pageError, setPageError] = useState<string | null>(null)

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

  // Phase 7 Coverage Analytics & Blind Spots States
  const [analyticsCategoryFilter, setAnalyticsCategoryFilter] = useState<string | null>(null)
  const [analyticsLevelFilter, setAnalyticsLevelFilter] = useState<number | null>(null)
  const [targetBlindSpotSkill, setTargetBlindSpotSkill] = useState<SfiaSkillSummary | null>(null)
  const [isExportingBlindSpotsCsv, setIsExportingBlindSpotsCsv] = useState(false)

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      setPageError(null)
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
      setPageError(
        err instanceof Error ? err.message : 'Failed to load SFIA 9 knowledge repository'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
            setDetailError(`No details found for skill ${selectedSkill}`)
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setDetailError(
            err instanceof Error ? err.message : 'Failed to load SFIA skill details'
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

  // Filter skills displayed in 2D Matrix
  const displayedMatrixSkills = React.useMemo(() => {
    return skills.filter((skill) => {
      // 1. Filter by category
      if (selectedCategory && skill.categoryCode !== selectedCategory) {
        return false
      }
      // 2. Search by code or name
      if (matrixSearch.trim()) {
        const q = matrixSearch.toLowerCase().trim()
        const matchCode = skill.code.toLowerCase().includes(q)
        const matchName = skill.name.toLowerCase().includes(q)
        if (!matchCode && !matchName) return false
      }
      return true
    })
  }, [skills, selectedCategory, matrixSearch])

  // Count skills with blind spots in displayed set
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

  // Export Matrix CSV handler
  const handleExportCsv = () => {
    try {
      setIsExportingCsv(true)
      const success = downloadSfiaMatrixCsv(
        displayedMatrixSkills,
        categories,
        matrixCells
      )
      if (success) {
        toast.success('SFIA 2D Matrix exported successfully!', {
          description: 'UTF-8 CSV file has been downloaded.',
        })
      } else {
        toast.error('Failed to export matrix CSV')
      }
    } catch {
      toast.error('An error occurred while creating CSV file')
    } finally {
      setIsExportingCsv(false)
    }
  }

  // Handle navigation from Sheet to Tab 1 (Taxonomy)
  const handleOpenInTaxonomy = (skillCode: string, levelId: number) => {
    setSkill(skillCode, levelId)
    setTab('taxonomy')
  }

  // Reactive data synchronization when creating question from Sheet or Blind Spots Table
  const handleQuestionCreated = (newQuestion: SfiaQuestionBankItem) => {
    const targetCode =
      inspectedCell?.skillCode || targetBlindSpotSkill?.code || ''
    const targetLvl =
      inspectedCell?.levelId || targetBlindSpotSkill?.minLevel || newQuestion.targetSfiaLevel || 1

    if (targetCode) {
      const key = `${targetCode}_L${targetLvl}`
      setMatrixCells((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          questionCount: (prev[key]?.questionCount || 0) + 1,
        },
      }))

      // Check if skill was previously a blind spot (questionCount === 0)
      const targetSkill = skills.find((s) => s.code === targetCode)
      const wasBlindSpot = targetSkill ? targetSkill.questionCount === 0 : false

      // Update skill summary list
      setSkills((prev) =>
        prev.map((s) =>
          s.code === targetCode
            ? { ...s, questionCount: s.questionCount + 1 }
            : s
        )
      )

      // Update skill detail if cached
      setSkillDetail((prev) => {
        if (!prev || prev.code !== targetCode) return prev
        return {
          ...prev,
          questionCount: prev.questionCount + 1,
          questionBankItems: [newQuestion, ...(prev.questionBankItems || [])],
        }
      })

      // Update overall coverage statistics (KPIs & Distributions)
      setStats((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          totalQuestions: prev.totalQuestions + 1,
          skillsWithQuestions: wasBlindSpot
            ? prev.skillsWithQuestions + 1
            : prev.skillsWithQuestions,
          blindSpotsCount: wasBlindSpot
            ? Math.max(0, prev.blindSpotsCount - 1)
            : prev.blindSpotsCount,
          categoryDistribution: prev.categoryDistribution.map((cat) =>
            cat.code === targetSkill?.categoryCode
              ? { ...cat, questionCount: cat.questionCount + 1 }
              : cat
          ),
          levelDistribution: prev.levelDistribution.map((lvl) =>
            lvl.level === targetLvl
              ? { ...lvl, questionCount: lvl.questionCount + 1 }
              : lvl
          ),
        }
      })

      toast.success('New interview question created successfully!', {
        description: `Updated question for ${targetCode} Level ${targetLvl}.${
          wasBlindSpot ? ' Skill removed from blind spots.' : ''
        }`,
      })
    }
    setIsCreateQuestionOpen(false)
    setTargetBlindSpotSkill(null)
  }

  // Phase 7 Handlers: Export Blind Spots CSV
  const handleExportBlindSpotsCsv = () => {
    try {
      setIsExportingBlindSpotsCsv(true)
      const success = downloadSfiaBlindSpotsCsv(skills, categories)
      if (success) {
        toast.success('SFIA 9 blind spots exported successfully!', {
          description: 'UTF-8 BOM CSV file has been downloaded.',
        })
      } else {
        toast.error('Failed to export blind spots CSV')
      }
    } catch {
      toast.error('An error occurred while creating blind spots CSV')
    } finally {
      setIsExportingBlindSpotsCsv(false)
    }
  }

  const handleScrollToBlindSpots = () => {
    const el = document.getElementById('sfia-blind-spots-table-container')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleSelectAnalyticsCategory = (catCode: string | null) => {
    setAnalyticsCategoryFilter(catCode)
    if (catCode) {
      handleScrollToBlindSpots()
    }
  }

  const handleSelectAnalyticsLevel = (level: number | null) => {
    setAnalyticsLevelFilter(level)
    if (level !== null) {
      handleScrollToBlindSpots()
    }
  }

  if (loading) {
    return (
      <LoadingState
        text="Loading SFIA 9 Knowledge Browser..."
        minHeight="min-h-[70vh]"
      />
    )
  }

  if (pageError) {
    return (
      <ErrorState
        title="Failed to Load SFIA 9 Knowledge Browser"
        description={pageError}
        onRetry={loadData}
        retryLabel="Try Again"
        minHeight="min-h-[70vh]"
      />
    )
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
              Digital skills capability framework (Skills Framework for the Information Age) & Interview question mappings
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
              <span>Taxonomy Explorer</span>
            </TabsTrigger>
            <TabsTrigger value="matrix" className="gap-1.5 text-xs font-semibold px-2.5 py-1">
              <Grid3X3 className="size-3.5" />
              <span>SFIA Matrix (2D Grid)</span>
            </TabsTrigger>
            <TabsTrigger value="attributes" className="gap-1.5 text-xs font-semibold px-2.5 py-1">
              <SlidersHorizontal className="size-3.5" />
              <span>Levels & Attributes</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs font-semibold px-2.5 py-1">
              <BarChart3 className="size-3.5" />
              <span>Coverage Analytics</span>
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
                          setDetailError(e instanceof Error ? e.message : 'Failed to load skill details')
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
                    : 'Failed to reload Levels & Attributes'
                )
              }
            }}
          />
        )}

        {/* Tab 4: Coverage Analytics Dashboard & Blind Spot Alerts (Phase 7) */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6 pb-16 max-w-7xl mx-auto w-full">
            <SfiaAnalyticsView
              stats={stats}
              categories={categories}
              skills={skills}
              selectedCategoryFilter={analyticsCategoryFilter}
              selectedLevelFilter={analyticsLevelFilter}
              onSelectCategory={handleSelectAnalyticsCategory}
              onSelectLevel={handleSelectAnalyticsLevel}
              onSelectSkill={(code) => {
                setSkill(code)
                setTab('taxonomy')
              }}
              onScrollToBlindSpots={handleScrollToBlindSpots}
              loading={loading}
              error={null}
              onRetry={async () => {
                try {
                  const statData = await sfiaAdminService.getCoverageStats()
                  setStats(statData)
                } catch {
                  toast.error('Failed to reload analytics coverage statistics')
                }
              }}
            />

            <SfiaBlindSpotsTable
              skills={skills}
              categories={categories}
              selectedCategoryFilter={analyticsCategoryFilter}
              selectedLevelFilter={analyticsLevelFilter}
              onSelectCategoryFilter={setAnalyticsCategoryFilter}
              onSelectLevelFilter={setAnalyticsLevelFilter}
              onCreateQuestion={(skill) => {
                setTargetBlindSpotSkill(skill)
                setIsCreateQuestionOpen(true)
              }}
              onSelectSkill={(code) => {
                setSkill(code)
                setTab('taxonomy')
              }}
              onExportCsv={handleExportBlindSpotsCsv}
              isExportingCsv={isExportingBlindSpotsCsv}
            />
          </div>
        )}
      </div>

      {/* Universal Question Creation Modal (from Matrix Sheet or Blind Spots Table) */}
      {isCreateQuestionOpen && (inspectedCell || targetBlindSpotSkill) && (
        <SfiaCreateQuestionModal
          open={isCreateQuestionOpen}
          onOpenChange={(open) => {
            setIsCreateQuestionOpen(open)
            if (!open) {
              setTargetBlindSpotSkill(null)
            }
          }}
          skillCode={inspectedCell?.skillCode || targetBlindSpotSkill?.code || ''}
          skillName={
            (inspectedCell
              ? skills.find((s) => s.code === inspectedCell.skillCode)?.name
              : targetBlindSpotSkill?.name) ||
            inspectedCell?.skillCode ||
            targetBlindSpotSkill?.code ||
            ''
          }
          minLevel={
            (inspectedCell
              ? skills.find((s) => s.code === inspectedCell.skillCode)?.minLevel
              : targetBlindSpotSkill?.minLevel) || 1
          }
          maxLevel={
            (inspectedCell
              ? skills.find((s) => s.code === inspectedCell.skillCode)?.maxLevel
              : targetBlindSpotSkill?.maxLevel) || 7
          }
          defaultLevel={inspectedCell?.levelId || targetBlindSpotSkill?.minLevel || 1}
          onQuestionCreated={handleQuestionCreated}
        />
      )}
    </div>
  )
}

export default function SfiaAdminPage() {
  return (
    <Suspense
      fallback={
        <LoadingState
          text="Initializing SFIA 9 Knowledge Browser..."
          minHeight="min-h-[60vh]"
        />
      }
    >
      <SfiaBrowserWorkspace />
    </Suspense>
  )
}
