'use client'

import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Grid,
  Group,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { IconAlertCircle, IconCompass, IconRefresh } from '@tabler/icons-react'
import { onetAdminQueries } from '@/queries/onet.queries'
import type { OnetDetailSubTab } from '@/types'
import { OnetSummaryCards } from './OnetSummaryCards'
import { OnetTopOccupations } from './OnetTopOccupations'
import { SfiaSkillCoverageChart } from './SfiaSkillCoverageChart'
import { SocGroupDistributionChart } from './SocGroupDistributionChart'
import classes from './OnetAnalyticsView.module.css'

export interface OnetAnalyticsViewProps {
  onSwitchToExplorer: () => void
  onSelectOccupation?: (socCode: string, subTab?: OnetDetailSubTab) => void
}

export function OnetAnalyticsView({
  onSwitchToExplorer,
  onSelectOccupation,
}: Readonly<OnetAnalyticsViewProps>) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const summaryQuery = useQuery(onetAdminQueries.summary())
  const groupsQuery = useQuery(onetAdminQueries.majorGroupsDistribution())
  const sfiaCoverageQuery = useQuery(onetAdminQueries.sfiaCoverage(20))
  const topOccupationsQuery = useQuery({
    ...onetAdminQueries.topOccupations({
      limit: 50,
      groupCode: selectedGroup ?? undefined,
    }),
    placeholderData: keepPreviousData,
  })

  const isLoading =
    summaryQuery.isLoading ||
    groupsQuery.isLoading ||
    sfiaCoverageQuery.isLoading
  const isRefreshing =
    !isLoading &&
    (summaryQuery.isFetching ||
      groupsQuery.isFetching ||
      sfiaCoverageQuery.isFetching ||
      topOccupationsQuery.isFetching)

  const primaryError =
    summaryQuery.error || groupsQuery.error || sfiaCoverageQuery.error

  const lastRefreshedLabel = useMemo(() => {
    const latest = Math.max(
      summaryQuery.dataUpdatedAt,
      groupsQuery.dataUpdatedAt,
      sfiaCoverageQuery.dataUpdatedAt,
      topOccupationsQuery.dataUpdatedAt
    )
    if (!latest) return null
    return new Date(latest).toLocaleTimeString('vi-VN')
  }, [
    summaryQuery.dataUpdatedAt,
    groupsQuery.dataUpdatedAt,
    sfiaCoverageQuery.dataUpdatedAt,
    topOccupationsQuery.dataUpdatedAt,
  ])

  const activeGroupName = useMemo(
    () =>
      groupsQuery.data?.find((g) => g.code === selectedGroup)?.name ??
      undefined,
    [groupsQuery.data, selectedGroup]
  )

  const handleRefreshAll = () => {
    void Promise.all([
      summaryQuery.refetch(),
      groupsQuery.refetch(),
      sfiaCoverageQuery.refetch(),
      topOccupationsQuery.refetch(),
    ])
  }

  const handleNavigate = (
    socCode: string,
    subTab: OnetDetailSubTab = 'overview'
  ) => {
    if (onSelectOccupation) {
      onSelectOccupation(socCode, subTab)
    } else {
      onSwitchToExplorer()
    }
  }

  if (isLoading) {
    return (
      <Stack gap="sm" p="xs">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs">
          <Skeleton height={96} radius="md" />
          <Skeleton height={96} radius="md" />
          <Skeleton height={96} radius="md" />
          <Skeleton height={96} radius="md" />
        </SimpleGrid>
        <Grid gap="xs">
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Skeleton height={290} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Skeleton height={290} radius="md" />
          </Grid.Col>
        </Grid>
        <Skeleton height={280} radius="md" />
      </Stack>
    )
  }

  if (primaryError || !summaryQuery.data) {
    return (
      <Alert
        color="danger"
        variant="light"
        icon={<IconAlertCircle size={18} stroke={1.5} />}
        title="Không thể tải thống kê O*NET"
      >
        <Stack gap="xs">
          <Text size="sm">
            {primaryError instanceof Error
              ? primaryError.message
              : 'Đã xảy ra lỗi khi truy vấn dữ liệu thống kê O*NET.'}
          </Text>
          <Group>
            <Button
              size="xs"
              variant="light"
              color="danger"
              leftSection={<IconRefresh size={14} stroke={1.5} />}
              onClick={handleRefreshAll}
            >
              Thử lại
            </Button>
          </Group>
        </Stack>
      </Alert>
    )
  }

  return (
    <ScrollArea className={classes.scrollRoot} type="auto" offsetScrollbars>
      <Stack gap="sm" pb="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Text size="xs" c="dimmed">
            {lastRefreshedLabel
              ? `Cập nhật gần nhất lúc ${lastRefreshedLabel}`
              : 'Dữ liệu thống kê thực từ PostgreSQL O*NET 29.1'}
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              color="neutral"
              loading={isRefreshing}
              leftSection={<IconRefresh size={14} stroke={1.5} />}
              onClick={handleRefreshAll}
            >
              Làm mới
            </Button>
            <Button
              size="xs"
              variant="light"
              color="brand"
              leftSection={<IconCompass size={14} stroke={1.5} />}
              onClick={onSwitchToExplorer}
            >
              Quay lại Khám phá
            </Button>
          </Group>
        </Group>

        <OnetSummaryCards summary={summaryQuery.data} />

        <Grid gap="xs" align="stretch">
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <SocGroupDistributionChart
              data={groupsQuery.data ?? []}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <SfiaSkillCoverageChart data={sfiaCoverageQuery.data ?? []} />
          </Grid.Col>
        </Grid>

        <OnetTopOccupations
          data={topOccupationsQuery.data ?? []}
          isFetching={topOccupationsQuery.isFetching}
          activeGroupFilter={selectedGroup}
          activeGroupName={activeGroupName}
          onClearGroupFilter={() => setSelectedGroup(null)}
          onNavigateToExplorer={handleNavigate}
        />
      </Stack>
    </ScrollArea>
  )
}
