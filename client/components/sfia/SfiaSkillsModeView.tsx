'use client'

import { Alert, Box, Button, ScrollArea, Skeleton, Stack } from '@mantine/core'
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import type {
  SfiaCategory,
  SfiaCoverageStats,
  SfiaLevelResponsibility,
  SfiaSkillDetail,
  SfiaSkillSummary,
  SfiaSubcategory,
} from '@/types'
import { SfiaDetailPanel } from './detail/SfiaDetailPanel'
import { SfiaAnatomyBanner } from './navigation/SfiaAnatomyBanner'
import { SfiaMobileDrawer } from './navigation/SfiaMobileDrawer'
import { SfiaSidebarTree } from './navigation/SfiaSidebarTree'
import classes from './SfiaWorkspaceClient.module.css'

export interface SfiaSkillsModeViewProps {
  categories: SfiaCategory[]
  subcategories: SfiaSubcategory[]
  subcategoriesLoading: boolean
  subcategoriesError: string | null
  onRetrySubcategories: () => void
  skills: SfiaSkillSummary[]
  levels: SfiaLevelResponsibility[]
  coverageStats: SfiaCoverageStats | null
  selectedSkill: string
  selectedLevel: number
  skillDetail: SfiaSkillDetail | null
  skillDetailLoading: boolean
  skillDetailError: string | null
  onRetrySkillDetail: () => void
  onSelectSkill: (skillCode: string, levelId?: number) => void
  onSelectLevel: (level: number) => void
  onNavigateToMatrix: () => void
}

export function SfiaSkillsModeView({
  categories,
  subcategories,
  subcategoriesLoading,
  subcategoriesError,
  onRetrySubcategories,
  skills,
  levels,
  coverageStats,
  selectedSkill,
  selectedLevel,
  skillDetail,
  skillDetailLoading,
  skillDetailError,
  onRetrySkillDetail,
  onSelectSkill,
  onSelectLevel,
  onNavigateToMatrix,
}: Readonly<SfiaSkillsModeViewProps>) {
  return (
    <Box className={classes.tabPane}>
      <SfiaAnatomyBanner coverageStats={coverageStats} />

      <SfiaMobileDrawer
        categories={categories}
        subcategories={subcategories}
        skills={skills}
        selectedSkill={selectedSkill}
        selectedLevel={selectedLevel}
        onSelectSkill={onSelectSkill}
        levels={levels}
      />

      <Box className={classes.masterDetail}>
        <Box className={classes.sidebarPanel} visibleFrom="lg">
          {subcategoriesError ? (
            <Alert
              color="danger"
              variant="light"
              icon={<IconAlertCircle size={16} stroke={1.5} />}
              title="Không thể tải danh sách phân nhóm"
            >
              <Stack gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="danger"
                  leftSection={<IconRefresh size={14} stroke={1.5} />}
                  onClick={onRetrySubcategories}
                >
                  Thử lại
                </Button>
              </Stack>
            </Alert>
          ) : subcategoriesLoading ? (
            <Stack gap="xs">
              <Skeleton height={36} radius="sm" />
              <Skeleton height={32} radius="sm" />
              <Skeleton height={280} radius="sm" />
            </Stack>
          ) : (
            <SfiaSidebarTree
              categories={categories}
              subcategories={subcategories}
              skills={skills}
              selectedSkill={selectedSkill}
              selectedLevel={selectedLevel}
              onSelectSkill={onSelectSkill}
              levels={levels}
            />
          )}
        </Box>

        <Box className={classes.detailPanel}>
          <ScrollArea flex={1} type="auto">
            <SfiaDetailPanel
              skillDetail={skillDetail}
              loading={skillDetailLoading}
              error={skillDetailError}
              categories={categories}
              subcategories={subcategories}
              selectedLevel={selectedLevel}
              onSelectLevel={onSelectLevel}
              onNavigateToMatrix={onNavigateToMatrix}
              onRetry={onRetrySkillDetail}
              levels={levels}
            />
          </ScrollArea>
        </Box>
      </Box>
    </Box>
  )
}
