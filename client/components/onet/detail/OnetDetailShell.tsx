'use client'

import { useEffect, useRef } from 'react'
import {
  Alert,
  Box,
  Button,
  Group,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { onetAdminQueries } from '@/queries/onet.queries'
import { queryKeys } from '@/queries/keys'
import type {
  OnetDetailSubTab,
  OnetOccupationDetail,
  OnetSfiaMapping,
} from '@/types'
import { OnetAlternateTitlesTab } from './OnetAlternateTitlesTab'
import { OnetDetailHeader } from './OnetDetailHeader'
import { OnetOverviewTab } from './OnetOverviewTab'
import { OnetSfiaTab } from './OnetSfiaTab'
import { OnetTasksTab } from './OnetTasksTab'
import { OnetTechSkillsTab } from './OnetTechSkillsTab'
import classes from './OnetDetailShell.module.css'

export interface OnetDetailShellProps {
  socCode: string
  activeDetailTab: OnetDetailSubTab
  onSelectDetailTab: (tab: OnetDetailSubTab) => void
  onLoadedDetail?: (detail: OnetOccupationDetail) => void
  onUpdateMappings?: (newMappings: OnetSfiaMapping[]) => void
  onDirtyChange?: (isDirty: boolean) => void
}

export function OnetDetailShell({
  socCode,
  activeDetailTab,
  onSelectDetailTab,
  onLoadedDetail,
  onUpdateMappings,
  onDirtyChange,
}: Readonly<OnetDetailShellProps>) {
  const queryClient = useQueryClient()
  const viewportRef = useRef<HTMLDivElement>(null)

  const {
    data: detail = null,
    isLoading,
    error: queryError,
    isFetched,
    refetch,
  } = useQuery({
    ...onetAdminQueries.detail(socCode),
    enabled: Boolean(socCode),
  })

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [socCode, activeDetailTab])

  useEffect(() => {
    if (detail) {
      onLoadedDetail?.(detail)
    }
  }, [detail, onLoadedDetail])

  const errorMessage =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? 'Không thể tải chi tiết nghề O*NET'
        : isFetched && !detail
          ? `Không tìm thấy dữ liệu cho mã SOC ${socCode}`
          : null

  const handleUpdateMappings = (newMappings: OnetSfiaMapping[]) => {
    if (!detail) return
    const updated: OnetOccupationDetail = {
      ...detail,
      sfiaMappings: newMappings,
      mappingCount: newMappings.length,
      isMapped: newMappings.length > 0,
      stats: {
        ...detail.stats,
        mappingCount: newMappings.length,
      },
    }
    queryClient.setQueryData(queryKeys.onetAdmin.detail(socCode), updated)
    onLoadedDetail?.(updated)
    onUpdateMappings?.(newMappings)
  }

  if (isLoading) {
    return (
      <Stack gap="md" p="md">
        <Group gap="xs">
          <Skeleton height={24} width={100} radius="sm" />
          <Skeleton height={24} width={140} radius="sm" />
        </Group>
        <Skeleton height={36} width={180} radius="sm" />
        <Skeleton height={28} width={320} radius="sm" />
        <Skeleton height={36} radius="sm" />
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={80} radius="md" />
          ))}
        </SimpleGrid>
        <Skeleton height={140} radius="md" />
      </Stack>
    )
  }

  if (errorMessage || !detail) {
    return (
      <Box p="xl">
        <Alert
          color="danger"
          variant="light"
          title="Không thể tải thông tin nghề O*NET"
          icon={<IconAlertCircle size={20} />}
        >
          <Stack gap="xs">
            <Text size="sm">{errorMessage ?? 'Nghề không tồn tại'}</Text>
            <Group>
              <Button
                size="xs"
                variant="light"
                color="danger"
                leftSection={<IconRefresh size={14} stroke={1.5} />}
                onClick={() => void refetch()}
              >
                Thử lại
              </Button>
            </Group>
          </Stack>
        </Alert>
      </Box>
    )
  }

  return (
    <Box className={classes.root}>
      <OnetDetailHeader
        detail={detail}
        activeDetailTab={activeDetailTab}
        onSelectDetailTab={onSelectDetailTab}
      />

      <ScrollArea
        viewportRef={viewportRef}
        className={classes.scrollArea}
        type="auto"
        offsetScrollbars
      >
        <Box className={classes.body}>
          {activeDetailTab === 'overview' ? (
            <OnetOverviewTab
              detail={detail}
              onSelectDetailTab={onSelectDetailTab}
            />
          ) : null}

          {activeDetailTab === 'tech' ? (
            <OnetTechSkillsTab skills={detail.softwareSkills} />
          ) : null}

          {activeDetailTab === 'sfia' ? (
            <OnetSfiaTab
              socCode={detail.socCode}
              occupationTitle={detail.title}
              mappings={detail.sfiaMappings}
              onUpdateMappings={handleUpdateMappings}
              onDirtyChange={onDirtyChange}
            />
          ) : null}

          {activeDetailTab === 'tasks' ? (
            <OnetTasksTab tasks={detail.tasks} />
          ) : null}

          {activeDetailTab === 'titles' ? (
            <OnetAlternateTitlesTab
              socCode={detail.socCode}
              initialTitles={detail.alternateTitles}
              totalCount={detail.stats.alternateTitleCount}
            />
          ) : null}
        </Box>
      </ScrollArea>
    </Box>
  )
}
