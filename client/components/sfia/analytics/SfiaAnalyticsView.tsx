'use client'

import {
  Alert,
  Button,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react'
import type { SfiaCoverageStats, SfiaLevelResponsibility } from '@/types'
import { SfiaAnalyticsKpis } from './SfiaAnalyticsKpis'
import { SfiaCategoryCoverageChart } from './SfiaCategoryCoverageChart'
import { SfiaLevelDistributionChart } from './SfiaLevelDistributionChart'
import { SfiaTopOnetSkillsCard } from './SfiaTopOnetSkillsCard'

export interface SfiaAnalyticsViewProps {
  stats: SfiaCoverageStats | null
  levels?: SfiaLevelResponsibility[]
  selectedCategoryFilter?: string | null
  selectedLevelFilter?: number | null
  onSelectCategory?: (categoryCode: string | null) => void
  onSelectLevel?: (level: number | null) => void
  onSelectSkill?: (skillCode: string) => void
  onScrollToBlindSpots?: () => void
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
}

export function SfiaAnalyticsView({
  stats,
  levels,
  selectedCategoryFilter,
  selectedLevelFilter,
  onSelectCategory,
  onSelectLevel,
  onSelectSkill,
  onScrollToBlindSpots,
  loading = false,
  error = null,
  onRetry,
  className,
}: Readonly<SfiaAnalyticsViewProps>) {
  if (loading) {
    return (
      <Stack
        gap="md"
        className={className}
        data-testid="sfia-analytics-loading"
      >
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
          <Skeleton height={116} radius="md" />
          <Skeleton height={116} radius="md" />
          <Skeleton height={116} radius="md" />
          <Skeleton height={116} radius="md" />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          <Skeleton height={360} radius="md" />
          <Skeleton height={360} radius="md" />
        </SimpleGrid>
        <Skeleton height={280} radius="md" />
      </Stack>
    )
  }

  if (error || !stats) {
    return (
      <Alert
        color="danger"
        variant="light"
        radius="md"
        className={className}
        icon={<IconAlertTriangle size={18} stroke={1.5} />}
        title="Không thể tải dữ liệu Thống kê Phân tích SFIA"
      >
        <Stack gap="xs">
          <Text size="sm">
            {error ||
              'Dữ liệu thống kê độ phủ chưa sẵn sàng hoặc không thể kết nối tới nguồn dữ liệu.'}
          </Text>
          {onRetry ? (
            <Group>
              <Button
                size="xs"
                variant="light"
                color="danger"
                leftSection={<IconRefresh size={14} stroke={1.5} />}
                onClick={onRetry}
              >
                Thử tải lại dữ liệu
              </Button>
            </Group>
          ) : null}
        </Stack>
      </Alert>
    )
  }

  return (
    <Stack gap="md" className={className}>
      <SfiaAnalyticsKpis
        stats={stats}
        onScrollToBlindSpots={onScrollToBlindSpots}
      />

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <SfiaCategoryCoverageChart
          categoryDistribution={stats.categoryDistribution}
          selectedCategory={selectedCategoryFilter}
          onSelectCategory={onSelectCategory}
        />

        <SfiaLevelDistributionChart
          levelDistribution={stats.levelDistribution}
          levels={levels}
          selectedLevel={selectedLevelFilter}
          onSelectLevel={onSelectLevel}
        />
      </SimpleGrid>

      <SfiaTopOnetSkillsCard
        topSkills={stats.topOnetMappedSkills}
        onSelectSkill={onSelectSkill}
      />
    </Stack>
  )
}
