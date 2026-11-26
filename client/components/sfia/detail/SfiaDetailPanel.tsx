'use client'

import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconBriefcase,
  IconHelpCircle,
  IconLayersLinked,
  IconRefresh,
} from '@tabler/icons-react'
import type {
  SfiaCategory,
  SfiaLevelResponsibility,
  SfiaSkillDetail,
  SfiaSubcategory,
} from '@/types'
import { SfiaAiPromptModal } from './SfiaAiPromptModal'
import { SfiaDetailHeader } from './SfiaDetailHeader'
import { SfiaGuidanceNotes } from './SfiaGuidanceNotes'
import { SfiaLevelSpanStepper } from './SfiaLevelSpanStepper'
import { SfiaLevelStatementCards } from './SfiaLevelStatementCards'
import { SfiaOnetMappingsTab } from './SfiaOnetMappingsTab'
import { SfiaQuestionBankTab } from './SfiaQuestionBankTab'

export interface SfiaDetailPanelProps {
  skillDetail: SfiaSkillDetail | null
  loading?: boolean
  error?: string | null
  categories: SfiaCategory[]
  subcategories: SfiaSubcategory[]
  selectedLevel: number
  onSelectLevel: (level: number) => void
  onSkillUpdated?: (detail: SfiaSkillDetail) => void
  onNavigateToMatrix?: () => void
  onRetry?: () => void
  levels?: SfiaLevelResponsibility[]
  className?: string
}

export function SfiaDetailPanel({
  skillDetail,
  loading = false,
  error = null,
  categories,
  subcategories,
  selectedLevel,
  onSelectLevel,
  onSkillUpdated,
  onNavigateToMatrix,
  onRetry,
  levels,
  className,
}: Readonly<SfiaDetailPanelProps>) {
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<string | null>('statements')

  if (loading) {
    return (
      <Paper withBorder radius="md" p="sm" className={className}>
        <Stack gap="sm">
          <Skeleton height={48} radius="md" />
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={60} radius="sm" />
            ))}
          </SimpleGrid>
          <Skeleton height={110} radius="md" />
          <Skeleton height={190} radius="md" />
        </Stack>
      </Paper>
    )
  }

  if (error || !skillDetail) {
    return (
      <Paper withBorder radius="md" p="md" className={className}>
        <Stack align="center" gap="sm" py="lg">
          <Alert
            color="danger"
            title="Không tìm thấy kỹ năng SFIA"
            icon={<IconAlertCircle size={16} />}
            w="100%"
            maw={480}
          >
            {error ||
              'Không thể tải thông tin chi tiết kỹ năng hoặc kỹ năng không tồn tại.'}
          </Alert>

          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              leftSection={<IconRefresh size={15} stroke={1.5} />}
            >
              Thử lại
            </Button>
          )}
        </Stack>
      </Paper>
    )
  }

  const onetMappingCount =
    skillDetail.onetMappings?.length ?? skillDetail.onetCount ?? 0
  const questionCount =
    skillDetail.questionBankItems?.length ?? skillDetail.questionCount ?? 0

  return (
    <Paper withBorder radius="md" p="sm" className={className}>
      <Stack gap="sm">
        <SfiaDetailHeader
          skillDetail={skillDetail}
          categories={categories}
          subcategories={subcategories}
          selectedLevel={selectedLevel}
          onOpenAiModal={() => setAiModalOpen(true)}
          onNavigateToMatrix={onNavigateToMatrix}
        />

        <SfiaLevelSpanStepper
          minLevel={skillDetail.minLevel}
          maxLevel={skillDetail.maxLevel}
          selectedLevel={selectedLevel}
          categoryCode={skillDetail.categoryCode}
          onSelectLevel={onSelectLevel}
          levels={levels}
        />

        <Tabs
          value={activeSubTab}
          onChange={setActiveSubTab}
          variant="outline"
          radius="sm"
        >
          <Tabs.List>
            <Tabs.Tab
              value="statements"
              fz="sm"
              leftSection={<IconLayersLinked size={15} stroke={1.5} />}
            >
              Tiêu chí hành vi & Hướng dẫn
            </Tabs.Tab>
            <Tabs.Tab
              value="onet"
              fz="sm"
              leftSection={<IconBriefcase size={15} stroke={1.5} />}
              rightSection={
                <Badge size="sm" variant="light" color="neutral">
                  {onetMappingCount}
                </Badge>
              }
            >
              Nghề nghiệp O*NET
            </Tabs.Tab>
            <Tabs.Tab
              value="questions"
              fz="sm"
              leftSection={<IconHelpCircle size={15} stroke={1.5} />}
              rightSection={
                <Badge size="sm" variant="light" color="brand">
                  {questionCount}
                </Badge>
              }
            >
              Ngân hàng câu hỏi
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="statements" pt="xs">
            <Stack gap="sm">
              <SfiaLevelStatementCards
                skillDetail={skillDetail}
                selectedLevel={selectedLevel}
                onSelectLevel={onSelectLevel}
              />
              <SfiaGuidanceNotes
                guidanceNotes={skillDetail.guidanceNotes}
                skillName={skillDetail.name}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="onet" pt="xs">
            <SfiaOnetMappingsTab
              skillCode={skillDetail.code}
              skillName={skillDetail.name}
              onetMappings={skillDetail.onetMappings || []}
            />
          </Tabs.Panel>

          <Tabs.Panel value="questions" pt="xs">
            <SfiaQuestionBankTab
              skillDetail={skillDetail}
              selectedLevel={selectedLevel}
              levels={levels}
              onQuestionCreated={(newQ) => {
                const updated: SfiaSkillDetail = {
                  ...skillDetail,
                  questionCount: (skillDetail.questionCount || 0) + 1,
                  questionBankItems: [
                    newQ,
                    ...(skillDetail.questionBankItems || []),
                  ],
                }
                onSkillUpdated?.(updated)
              }}
            />
          </Tabs.Panel>
        </Tabs>

        <SfiaAiPromptModal
          open={aiModalOpen}
          onOpenChange={setAiModalOpen}
          skillDetail={skillDetail}
          selectedLevel={selectedLevel}
        />
      </Stack>
    </Paper>
  )
}
