'use client'

import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { Alert, Box, Button, Skeleton, Stack } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import type {
  SfiaCategory,
  SfiaLevelResponsibility,
  SfiaMatrixDataResponse,
  SfiaMatrixDisplayMode,
  SfiaSkillSummary,
} from '@/types'
import { downloadSfiaMatrixCsv } from './matrix/sfia-matrix-export'
import { SfiaMatrixInspectionSheet } from './matrix/SfiaMatrixInspectionSheet'
import { SfiaMatrixToolbar } from './matrix/SfiaMatrixToolbar'
import { SfiaMatrixView } from './matrix/SfiaMatrixView'
import sfia from './sfia.module.css'

export interface SfiaMatrixModeViewProps {
  categories: SfiaCategory[]
  skills: SfiaSkillSummary[]
  levels: SfiaLevelResponsibility[]
  selectedCategory: string | null
  onCategoryChange: (categoryCode: string | null) => void
  matrixData: SfiaMatrixDataResponse | null
  loading: boolean
  error: string | null
  onRetry: () => void
  onOpenInTaxonomy: (skillCode: string, levelId: number) => void
  onCreateQuestion: (skillCode: string, levelId: number) => void
}

export function SfiaMatrixModeView({
  categories,
  skills,
  levels,
  selectedCategory,
  onCategoryChange,
  matrixData,
  loading,
  error,
  onRetry,
  onOpenInTaxonomy,
  onCreateQuestion,
}: Readonly<SfiaMatrixModeViewProps>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [displayMode, setDisplayMode] = useState<SfiaMatrixDisplayMode>('level')
  const [blindSpotsOnly, setBlindSpotsOnly] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [inspectedCell, setInspectedCell] = useState<{
    skillCode: string
    levelId: number
  } | null>(null)

  const matrixSkills = useMemo(
    () => matrixData?.skills ?? skills,
    [matrixData?.skills, skills]
  )
  const matrixCategories = useMemo(
    () => matrixData?.categories ?? categories,
    [matrixData?.categories, categories]
  )
  const matrixCells = useMemo(
    () => matrixData?.cells ?? {},
    [matrixData?.cells]
  )

  const deferredSearchQuery = useDeferredValue(searchQuery)

  const filteredSkills = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase()
    return matrixSkills.filter((skill) => {
      if (selectedCategory && skill.categoryCode !== selectedCategory) {
        return false
      }
      if (!query) return true
      return (
        skill.code.toLowerCase().includes(query) ||
        skill.name.toLowerCase().includes(query)
      )
    })
  }, [matrixSkills, selectedCategory, deferredSearchQuery])

  const blindSpotsCount = useMemo(() => {
    let count = 0
    filteredSkills.forEach((skill) => {
      for (let lvl = skill.minLevel; lvl <= skill.maxLevel; lvl += 1) {
        const cell = matrixCells[`${skill.code}_L${lvl}`]
        if (!cell || cell.questionCount === 0) {
          count += 1
        }
      }
    })
    return count
  }, [filteredSkills, matrixCells])

  const displayedSkillsCount = useMemo(() => {
    if (!blindSpotsOnly) return filteredSkills.length
    return filteredSkills.filter((skill) => {
      for (let lvl = skill.minLevel; lvl <= skill.maxLevel; lvl += 1) {
        const cell = matrixCells[`${skill.code}_L${lvl}`]
        if (!cell || cell.questionCount === 0) return true
      }
      return false
    }).length
  }, [blindSpotsOnly, filteredSkills, matrixCells])

  const handleExportCsv = () => {
    setIsExportingCsv(true)
    try {
      const ok = downloadSfiaMatrixCsv(
        filteredSkills,
        matrixCategories,
        matrixCells
      )
      notifications.show({
        color: ok ? 'success' : 'danger',
        message: ok
          ? 'Đã xuất tệp CSV Ma trận SFIA 9 thành công.'
          : 'Không thể xuất tệp CSV Ma trận SFIA 9.',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
    } finally {
      setIsExportingCsv(false)
    }
  }

  const handleSelectCell = useCallback((skillCode: string, levelId: number) => {
    setInspectedCell({ skillCode, levelId })
  }, [])

  const handleClearFilters = () => {
    setSearchQuery('')
    onCategoryChange(null)
    setBlindSpotsOnly(false)
  }

  if (error) {
    return (
      <Alert
        color="danger"
        variant="light"
        icon={<IconAlertCircle size={18} stroke={1.5} />}
        title="Không thể tải dữ liệu Ma trận 2D SFIA 9"
      >
        <Stack gap="xs" align="flex-start">
          <Box>{error}</Box>
          <Button
            size="xs"
            color="danger"
            variant="light"
            leftSection={<IconRefresh size={14} stroke={1.5} />}
            onClick={onRetry}
          >
            Thử lại
          </Button>
        </Stack>
      </Alert>
    )
  }

  if (loading && !matrixData) {
    return (
      <Stack gap="xs" flex={1}>
        <Skeleton height={84} radius="md" />
        <Skeleton height={360} radius="md" />
      </Stack>
    )
  }

  return (
    <Box className={sfia.matrixPagePane} mod={{ 'workspace-scroll': 'page' }}>
      <SfiaMatrixToolbar
        categories={matrixCategories}
        selectedCategory={selectedCategory ?? ''}
        onCategoryChange={(code) => onCategoryChange(code || null)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        blindSpotsOnly={blindSpotsOnly}
        onBlindSpotsOnlyChange={setBlindSpotsOnly}
        onExportCsv={handleExportCsv}
        totalSkillsCount={matrixSkills.length}
        displayedSkillsCount={displayedSkillsCount}
        blindSpotsCount={blindSpotsCount}
        isExporting={isExportingCsv}
      />

      <SfiaMatrixView
        skills={filteredSkills}
        categories={matrixCategories}
        cells={matrixCells}
        levels={levels}
        displayMode={displayMode}
        blindSpotsOnly={blindSpotsOnly}
        onBlindSpotsOnlyChange={setBlindSpotsOnly}
        inspectedCell={inspectedCell}
        onSelectCell={handleSelectCell}
        onClearFilters={handleClearFilters}
        filterKey={`${deferredSearchQuery.trim()}::${selectedCategory ?? ''}`}
      />

      <SfiaMatrixInspectionSheet
        isOpen={Boolean(inspectedCell)}
        onClose={() => setInspectedCell(null)}
        skillCode={inspectedCell?.skillCode ?? null}
        levelId={inspectedCell?.levelId ?? null}
        levels={levels}
        categories={matrixCategories}
        onOpenInTaxonomy={onOpenInTaxonomy}
        onCreateQuestion={onCreateQuestion}
      />
    </Box>
  )
}
