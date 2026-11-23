'use client'

import React, { Suspense, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Network,
  FolderTree,
  Grid3X3,
  SlidersHorizontal,
  BarChart3,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { toast } from 'sonner'
import {
  LoadingState,
  ErrorState,
} from '@/components/patterns/FeedbackPatterns'
import { cn } from '@/lib/utils'
import {
  queryKeys,
  sfiaAdminQueries,
  useOptionalQueryClient,
} from '@/lib/query-client'
import {
  useSfiaParams,
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
import type {
  SfiaMainTab,
  SfiaSkillSummary,
  SfiaSkillDetail,
  SfiaCoverageStats,
  SfiaMatrixDataResponse,
  SfiaMatrixDisplayMode,
  SfiaQuestionBankItem,
} from '@/types'

function SfiaBrowserWorkspace() {
  const queryClient = useOptionalQueryClient()
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

  const categoriesQuery = useQuery(sfiaAdminQueries.categories())
  const subcategoriesQuery = useQuery(sfiaAdminQueries.subcategories())
  const skillsQuery = useQuery(sfiaAdminQueries.skills())
  const coverageQuery = useQuery(sfiaAdminQueries.coverage())
  const matrixQuery = useQuery(sfiaAdminQueries.matrix())
  const levelsQuery = useQuery(sfiaAdminQueries.levels())
  const attributesQuery = useQuery(sfiaAdminQueries.attributes())

  const skillDetailQuery = useQuery({
    ...sfiaAdminQueries.skillDetail(selectedSkill ?? ''),
    enabled: Boolean(selectedSkill),
  })

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data]
  )
  const subcategories = useMemo(
    () => subcategoriesQuery.data ?? [],
    [subcategoriesQuery.data]
  )
  const skills = useMemo(() => skillsQuery.data ?? [], [skillsQuery.data])
  const stats = coverageQuery.data ?? null
  const matrixCells = useMemo(
    () => matrixQuery.data?.cells ?? {},
    [matrixQuery.data]
  )
  const responsibilityLevels = useMemo(
    () => levelsQuery.data ?? [],
    [levelsQuery.data]
  )
  const genericAttributes = useMemo(
    () => attributesQuery.data ?? [],
    [attributesQuery.data]
  )
  const skillDetail = skillDetailQuery.data ?? null
  const loadingDetail = skillDetailQuery.isLoading

  const detailError =
    skillDetailQuery.error instanceof Error
      ? skillDetailQuery.error.message
      : skillDetailQuery.error
        ? 'Failed to load SFIA skill details'
        : Boolean(selectedSkill) && skillDetailQuery.isFetched && !skillDetail
          ? `No details found for skill ${selectedSkill}`
          : null

  const loading =
    categoriesQuery.isLoading ||
    subcategoriesQuery.isLoading ||
    skillsQuery.isLoading ||
    coverageQuery.isLoading ||
    matrixQuery.isLoading ||
    levelsQuery.isLoading ||
    attributesQuery.isLoading

  const initialError =
    categoriesQuery.error ||
    subcategoriesQuery.error ||
    skillsQuery.error ||
    coverageQuery.error ||
    matrixQuery.error ||
    levelsQuery.error ||
    attributesQuery.error

  const pageError =
    initialError instanceof Error
      ? initialError.message
      : initialError
        ? 'Failed to load SFIA 9 knowledge repository'
        : null

  const attributesQueryError = levelsQuery.error || attributesQuery.error
  const attributesError =
    attributesQueryError instanceof Error
      ? attributesQueryError.message
      : attributesQueryError
        ? 'Failed to reload Levels & Attributes'
        : null

  // Phase 5 Matrix Grid States
  const [matrixSearch, setMatrixSearch] = useState('')
  const [matrixDisplayMode, setMatrixDisplayMode] =
    useState<SfiaMatrixDisplayMode>('level')
  const [matrixBlindSpotsOnly, setMatrixBlindSpotsOnly] = useState(false)
  const [inspectedCell, setInspectedCell] = useState<{
    skillCode: string
    levelId: number
  } | null>(null)
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  // Phase 7 Coverage Analytics & Blind Spots States
  const [analyticsCategoryFilter, setAnalyticsCategoryFilter] = useState<
    string | null
  >(null)
  const [analyticsLevelFilter, setAnalyticsLevelFilter] = useState<
    number | null
  >(null)
  const [targetBlindSpotSkill, setTargetBlindSpotSkill] =
    useState<SfiaSkillSummary | null>(null)
  const [isExportingBlindSpotsCsv, setIsExportingBlindSpotsCsv] =
    useState(false)

  const loadData = React.useCallback(async () => {
    await Promise.all([
      categoriesQuery.refetch(),
      subcategoriesQuery.refetch(),
      skillsQuery.refetch(),
      coverageQuery.refetch(),
      matrixQuery.refetch(),
      levelsQuery.refetch(),
      attributesQuery.refetch(),
    ])
  }, [
    categoriesQuery,
    subcategoriesQuery,
    skillsQuery,
    coverageQuery,
    matrixQuery,
    levelsQuery,
    attributesQuery,
  ])

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
      inspectedCell?.levelId ||
      targetBlindSpotSkill?.minLevel ||
      newQuestion.targetSfiaLevel ||
      1

    if (targetCode) {
      const key = `${targetCode}_L${targetLvl}`
      queryClient.setQueryData<SfiaMatrixDataResponse>(
        queryKeys.sfiaAdmin.matrix(),
        (prev) => {
          if (!prev) return prev
          return {
            ...prev,
            cells: {
              ...prev.cells,
              [key]: {
                ...prev.cells[key],
                questionCount: (prev.cells[key]?.questionCount || 0) + 1,
              },
            },
          }
        }
      )

      // Check if skill was previously a blind spot (questionCount === 0)
      const targetSkill = skills.find((s) => s.code === targetCode)
      const wasBlindSpot = targetSkill ? targetSkill.questionCount === 0 : false

      // Update skill summary list cache
      queryClient.setQueryData<SfiaSkillSummary[]>(
        queryKeys.sfiaAdmin.skills(),
        (prev) =>
          prev
            ? prev.map((s) =>
                s.code === targetCode
                  ? { ...s, questionCount: s.questionCount + 1 }
                  : s
              )
            : prev
      )

      // Update skill detail cache if present
      queryClient.setQueryData<SfiaSkillDetail | null>(
        queryKeys.sfiaAdmin.skillDetail(targetCode),
        (prev) => {
          if (!prev || prev.code !== targetCode) return prev
          return {
            ...prev,
            questionCount: prev.questionCount + 1,
            questionBankItems: [newQuestion, ...(prev.questionBankItems || [])],
          }
        }
      )

      // Update overall coverage statistics cache (KPIs & Distributions)
      queryClient.setQueryData<SfiaCoverageStats>(
        queryKeys.sfiaAdmin.coverage(),
        (prev) => {
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
        }
      )

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
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2">
      {/* Top Header Bar (Flat Workspace Header) */}
      <div className="border-border/60 flex shrink-0 flex-col gap-2 border-b pb-1.5 pt-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Network className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-ink text-base font-bold tracking-tight sm:text-lg">
                SFIA 9 Knowledge Browser
              </h1>
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                SFIA 9.0
              </span>
              <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-ink-muted mt-0.5 text-xs leading-none">
              Digital skills capability framework (Skills Framework for the
              Information Age) & Interview question mappings
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
            <TabsTrigger
              value="taxonomy"
              className="gap-1.5 px-2.5 py-1 text-xs font-semibold"
            >
              <FolderTree className="size-3.5" />
              <span>Taxonomy Explorer</span>
            </TabsTrigger>
            <TabsTrigger
              value="matrix"
              className="gap-1.5 px-2.5 py-1 text-xs font-semibold"
            >
              <Grid3X3 className="size-3.5" />
              <span>SFIA Matrix (2D Grid)</span>
            </TabsTrigger>
            <TabsTrigger
              value="attributes"
              className="gap-1.5 px-2.5 py-1 text-xs font-semibold"
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Levels & Attributes</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="gap-1.5 px-2.5 py-1 text-xs font-semibold"
            >
              <BarChart3 className="size-3.5" />
              <span>Coverage Analytics</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Tab Content Panels */}
      <div
        className={cn(
          'min-h-0 flex-1',
          activeTab === 'matrix' ||
            (activeTab === 'attributes' && attrView === 'matrix')
            ? 'flex flex-col overflow-hidden'
            : 'overflow-y-auto'
        )}
      >
        {/* Tab 1: Taxonomy Explorer (Phases 1-4 Foundation) */}
        {activeTab === 'taxonomy' && (
          <div className="flex h-full min-h-0 flex-col gap-3">
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
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
              {/* Left Column: 3-Tier Collapsible Tree (Desktop >= lg) */}
              <div className="hidden h-full min-h-0 lg:col-span-4 lg:block xl:col-span-4">
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
              <div className="col-span-1 flex flex-col gap-3 overflow-y-auto lg:col-span-8 xl:col-span-8">
                <SfiaDetailPanel
                  skillDetail={skillDetail}
                  loading={loadingDetail}
                  error={detailError}
                  categories={categories}
                  subcategories={subcategories}
                  selectedLevel={selectedLevel}
                  onSelectLevel={(level) => setLevel(level)}
                  onSkillUpdated={(updated) => {
                    queryClient.setQueryData(
                      queryKeys.sfiaAdmin.skillDetail(updated.code),
                      updated
                    )
                    queryClient.setQueryData<SfiaSkillSummary[]>(
                      queryKeys.sfiaAdmin.skills(),
                      (prev) =>
                        prev
                          ? prev.map((s) =>
                              s.code === updated.code
                                ? { ...s, questionCount: updated.questionCount }
                                : s
                            )
                          : prev
                    )
                  }}
                  onNavigateToMatrix={() => setTab('matrix')}
                  onRetry={() => {
                    if (selectedSkill) {
                      void skillDetailQuery.refetch()
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: SFIA Matrix Grid 2D (Phase 5 Workspace) */}
        {activeTab === 'matrix' && (
          <div className="flex h-full min-h-0 flex-1 flex-col gap-2.5 overflow-hidden">
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
              onOpenInTaxonomy={handleOpenInTaxonomy}
              onCreateQuestion={() => {
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
              await Promise.all([
                levelsQuery.refetch(),
                attributesQuery.refetch(),
              ])
            }}
          />
        )}

        {/* Tab 4: Coverage Analytics Dashboard & Blind Spot Alerts (Phase 7) */}
        {activeTab === 'analytics' && (
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-16">
            <SfiaAnalyticsView
              stats={stats}
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
                const res = await coverageQuery.refetch()
                if (res.error) {
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
          skillCode={
            inspectedCell?.skillCode || targetBlindSpotSkill?.code || ''
          }
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
          defaultLevel={
            inspectedCell?.levelId || targetBlindSpotSkill?.minLevel || 1
          }
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
