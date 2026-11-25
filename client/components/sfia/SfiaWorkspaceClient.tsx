'use client'

import { useState } from 'react'
import { Alert, Box, Button, ScrollArea, Skeleton, Stack } from '@mantine/core'
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import type { SfiaSkillSummary } from '@/types'
import { SfiaGenericAttributesView } from './attributes/SfiaGenericAttributesView'
import { SfiaCreateQuestionModal } from './detail/SfiaCreateQuestionModal'
import { SfiaAnalyticsModeView } from './SfiaAnalyticsModeView'
import { SfiaMatrixModeView } from './SfiaMatrixModeView'
import { SfiaSkillsModeView } from './SfiaSkillsModeView'
import { SfiaTopBar } from './SfiaTopBar'
import { useSfiaParams } from './useSfiaParams'
import {
  toSfiaErrorMessage,
  useSfiaWorkspaceQueries,
} from './useSfiaWorkspaceQueries'
import classes from './SfiaWorkspaceClient.module.css'

interface CreateQuestionTarget {
  skillCode: string
  skillName: string
  minLevel: number
  maxLevel: number
  defaultLevel: number
}

export function SfiaWorkspaceClient() {
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
    navigateToMatrixWithLevel,
  } = useSfiaParams()

  const [createTarget, setCreateTarget] = useState<CreateQuestionTarget | null>(
    null
  )

  const {
    categories,
    skills,
    levels,
    isCoreLoading,
    coreError,
    refetchCore,
    subcategoriesQuery,
    coverageQuery,
    matrixQuery,
    attributesQuery,
    levelsQuery,
    skillDetailQuery,
  } = useSfiaWorkspaceQueries(activeTab, selectedSkill)

  const openCreateModalByCode = (skillCode: string, levelId: number) => {
    const matched = skills.find((s) => s.code === skillCode)
    setCreateTarget({
      skillCode,
      skillName: matched?.name ?? skillCode,
      minLevel: matched?.minLevel ?? 1,
      maxLevel: matched?.maxLevel ?? 7,
      defaultLevel: levelId,
    })
  }

  const openCreateModalFromSkill = (skill: SfiaSkillSummary) => {
    setCreateTarget({
      skillCode: skill.code,
      skillName: skill.name,
      minLevel: skill.minLevel,
      maxLevel: skill.maxLevel,
      defaultLevel: skill.minLevel,
    })
  }

  return (
    <Box component="section" className={classes.workspace}>
      <SfiaTopBar
        activeTab={activeTab}
        onTabChange={setTab}
        totalSkills={skills.length > 0 ? skills.length : undefined}
      />

      {coreError ? (
        <Alert
          color="danger"
          variant="light"
          icon={<IconAlertCircle size={18} stroke={1.5} />}
          title="Lỗi tải Khung Năng Lực SFIA 9"
        >
          <Stack gap="xs" align="flex-start">
            <Box>{coreError}</Box>
            <Button
              size="xs"
              color="danger"
              variant="light"
              leftSection={<IconRefresh size={14} stroke={1.5} />}
              onClick={refetchCore}
            >
              Thử lại
            </Button>
          </Stack>
        </Alert>
      ) : isCoreLoading ? (
        <Stack gap="sm" flex={1}>
          <Skeleton height={88} radius="md" />
          <Skeleton height={380} radius="md" />
        </Stack>
      ) : (
        <>
          {activeTab === 'taxonomy' ? (
            <SfiaSkillsModeView
              categories={categories}
              subcategories={subcategoriesQuery.data ?? []}
              subcategoriesLoading={subcategoriesQuery.isPending}
              subcategoriesError={toSfiaErrorMessage(
                subcategoriesQuery.error,
                'Không thể tải danh sách phân nhóm SFIA.'
              )}
              onRetrySubcategories={() => void subcategoriesQuery.refetch()}
              skills={skills}
              levels={levels}
              selectedSkill={selectedSkill}
              selectedLevel={selectedLevel}
              skillDetail={skillDetailQuery.data ?? null}
              skillDetailLoading={skillDetailQuery.isPending}
              skillDetailError={toSfiaErrorMessage(
                skillDetailQuery.error,
                'Không thể tải chi tiết kỹ năng SFIA.'
              )}
              onRetrySkillDetail={() => void skillDetailQuery.refetch()}
              onSelectSkill={setSkill}
              onSelectLevel={setLevel}
              onNavigateToMatrix={() => setTab('matrix')}
            />
          ) : null}

          {activeTab === 'matrix' ? (
            <SfiaMatrixModeView
              categories={categories}
              skills={skills}
              levels={levels}
              selectedCategory={selectedCategory}
              onCategoryChange={setCategory}
              matrixData={matrixQuery.data ?? null}
              loading={matrixQuery.isPending}
              error={toSfiaErrorMessage(
                matrixQuery.error,
                'Không thể tải Ma trận 2D SFIA 9.'
              )}
              onRetry={() => void matrixQuery.refetch()}
              onOpenInTaxonomy={setSkill}
              onCreateQuestion={openCreateModalByCode}
            />
          ) : null}

          {activeTab === 'attributes' ? (
            <Box className={classes.scrollPane}>
              <ScrollArea flex={1} type="auto">
                <SfiaGenericAttributesView
                  levels={levels}
                  attributes={attributesQuery.data ?? []}
                  coverageStats={coverageQuery.data ?? null}
                  selectedLevel={selectedLevel}
                  onSelectLevel={setLevel}
                  viewMode={attrView}
                  onViewModeChange={setAttrView}
                  onNavigateToMatrixWithLevel={navigateToMatrixWithLevel}
                  loading={attributesQuery.isPending || levelsQuery.isPending}
                  error={toSfiaErrorMessage(
                    attributesQuery.error ?? levelsQuery.error,
                    'Không thể tải dữ liệu Thuộc tính chung SFIA.'
                  )}
                  onRetry={() => {
                    void attributesQuery.refetch()
                    void levelsQuery.refetch()
                  }}
                />
              </ScrollArea>
            </Box>
          ) : null}

          {activeTab === 'analytics' ? (
            <SfiaAnalyticsModeView
              stats={coverageQuery.data ?? null}
              loading={coverageQuery.isPending}
              error={toSfiaErrorMessage(
                coverageQuery.error,
                'Không thể tải dữ liệu Thống kê Phân tích SFIA.'
              )}
              onRetry={() => void coverageQuery.refetch()}
              skills={skills}
              categories={categories}
              levels={levels}
              onSelectSkill={setSkill}
              onCreateQuestion={openCreateModalFromSkill}
            />
          ) : null}
        </>
      )}

      {createTarget ? (
        <SfiaCreateQuestionModal
          open
          onOpenChange={(open) => {
            if (!open) setCreateTarget(null)
          }}
          skillCode={createTarget.skillCode}
          skillName={createTarget.skillName}
          minLevel={createTarget.minLevel}
          maxLevel={createTarget.maxLevel}
          defaultLevel={createTarget.defaultLevel}
          levels={levels}
          onQuestionCreated={() => undefined}
        />
      ) : null}
    </Box>
  )
}
