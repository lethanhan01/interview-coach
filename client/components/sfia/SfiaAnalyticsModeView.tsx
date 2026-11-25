'use client'

import { useState } from 'react'
import { Box, ScrollArea, Stack } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type {
  SfiaCategory,
  SfiaCoverageStats,
  SfiaLevelResponsibility,
  SfiaSkillSummary,
} from '@/types'
import layout from '@/styles/layout.module.css'
import { downloadSfiaBlindSpotsCsv } from './analytics/sfia-analytics-export'
import { SfiaAnalyticsView } from './analytics/SfiaAnalyticsView'
import { SfiaBlindSpotsTable } from './analytics/SfiaBlindSpotsTable'

export interface SfiaAnalyticsModeViewProps {
  stats: SfiaCoverageStats | null
  loading: boolean
  error: string | null
  onRetry: () => void
  skills: SfiaSkillSummary[]
  categories: SfiaCategory[]
  levels: SfiaLevelResponsibility[]
  onSelectSkill: (skillCode: string) => void
  onCreateQuestion: (skill: SfiaSkillSummary) => void
}

export function SfiaAnalyticsModeView({
  stats,
  loading,
  error,
  onRetry,
  skills,
  categories,
  levels,
  onSelectSkill,
  onCreateQuestion,
}: Readonly<SfiaAnalyticsModeViewProps>) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | null
  >(null)
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | null>(
    null
  )
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  const handleScrollToBlindSpots = () => {
    const el = document.getElementById('sfia-blind-spots-table-container')
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  const handleExportBlindSpotsCsv = () => {
    setIsExportingCsv(true)
    try {
      const ok = downloadSfiaBlindSpotsCsv(skills, categories)
      notifications.show({
        color: ok ? 'success' : 'danger',
        message: ok
          ? 'Đã xuất tệp CSV danh sách Điểm mù SFIA 9.'
          : 'Không thể xuất tệp CSV Điểm mù SFIA 9.',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
    } finally {
      setIsExportingCsv(false)
    }
  }

  return (
    <Box className={layout.scrollPane}>
      <ScrollArea flex={1} type="auto">
        <Stack gap="md" pb="md">
          <SfiaAnalyticsView
            stats={stats}
            levels={levels}
            selectedCategoryFilter={selectedCategoryFilter}
            selectedLevelFilter={selectedLevelFilter}
            onSelectCategory={setSelectedCategoryFilter}
            onSelectLevel={setSelectedLevelFilter}
            onSelectSkill={onSelectSkill}
            onScrollToBlindSpots={handleScrollToBlindSpots}
            loading={loading}
            error={error}
            onRetry={onRetry}
          />

          <SfiaBlindSpotsTable
            skills={skills}
            categories={categories}
            levels={levels}
            selectedCategoryFilter={selectedCategoryFilter}
            selectedLevelFilter={selectedLevelFilter}
            onSelectCategoryFilter={setSelectedCategoryFilter}
            onSelectLevelFilter={setSelectedLevelFilter}
            onCreateQuestion={onCreateQuestion}
            onSelectSkill={onSelectSkill}
            onExportCsv={handleExportBlindSpotsCsv}
            isExportingCsv={isExportingCsv}
          />
        </Stack>
      </ScrollArea>
    </Box>
  )
}
