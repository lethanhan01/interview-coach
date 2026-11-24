'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Group,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconBook, IconChartBar, IconCompass } from '@tabler/icons-react'
import { OnetAnalyticsView } from '@/components/onet/analytics/OnetAnalyticsView'
import { OnetDetailShell } from '@/components/onet/detail/OnetDetailShell'
import { OnetMobileDrawer } from '@/components/onet/navigation/OnetMobileDrawer'
import { OnetSidebar } from '@/components/onet/navigation/OnetSidebar'
import { useOnetParams } from '@/components/onet/useOnetParams'
import type { OnetDetailSubTab, OnetMainTab } from '@/types'
import classes from './OnetWorkspaceClient.module.css'

function OnetWorkspaceContent() {
  const {
    activeTab,
    selectedSoc,
    activeDetailTab,
    setTab,
    setSoc,
    setDetailTab,
    navigateToOccupation,
  } = useOnetParams()

  const [currentTitle, setCurrentTitle] = useState('Software Developers')
  const [isSfiaDirty, setIsSfiaDirty] = useState(false)
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0)

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isSfiaDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isSfiaDirty])

  const runWithDirtyGuard = useCallback(
    (action: () => void) => {
      if (!isSfiaDirty) {
        action()
        return
      }
      modals.openConfirmModal({
        title: 'Thay đổi chưa được lưu',
        centered: true,
        children: (
          <Text size="sm">
            Bạn đang có các thay đổi chưa được lưu trên bảng ánh xạ SFIA. Nếu
            rời đi bây giờ, toàn bộ chỉnh sửa này sẽ bị mất.
          </Text>
        ),
        labels: { confirm: 'Rời đi không lưu', cancel: 'Ở lại trang' },
        confirmProps: { color: 'danger' },
        onConfirm: () => {
          setIsSfiaDirty(false)
          action()
        },
      })
    },
    [isSfiaDirty]
  )

  const guardedSetSoc = useCallback(
    (newSoc: string) => {
      if (newSoc === selectedSoc) return
      runWithDirtyGuard(() => setSoc(newSoc))
    },
    [runWithDirtyGuard, selectedSoc, setSoc]
  )

  const guardedSetTab = useCallback(
    (newTab: OnetMainTab) => {
      if (newTab === activeTab) return
      runWithDirtyGuard(() => setTab(newTab))
    },
    [activeTab, runWithDirtyGuard, setTab]
  )

  const guardedSetDetailTab = useCallback(
    (newDetailTab: OnetDetailSubTab) => {
      if (newDetailTab === activeDetailTab) return
      runWithDirtyGuard(() => setDetailTab(newDetailTab))
    },
    [activeDetailTab, runWithDirtyGuard, setDetailTab]
  )

  const guardedNavigateToOccupation = useCallback(
    (socCode: string, subTab: OnetDetailSubTab = 'overview') => {
      runWithDirtyGuard(() => navigateToOccupation(socCode, subTab))
    },
    [navigateToOccupation, runWithDirtyGuard]
  )

  return (
    <Box className={classes.workspace}>
      {/* Top Workspace Header */}
      <Group
        justify="space-between"
        align="center"
        gap="xs"
        wrap="wrap"
        className={classes.topBar}
      >
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon color="brand" variant="light" size="md" radius="md">
            <IconBook size={16} stroke={1.5} aria-hidden="true" />
          </ThemeIcon>
          <Stack gap={0}>
            <Group gap="xs" align="center">
              <Title order={1} size="h5">
                Trình duyệt Nghề nghiệp O*NET 29.1
              </Title>
              <Badge color="brand" variant="light" size="xs">
                Admin
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Chuẩn phân loại nghề nghiệp Hoa Kỳ & Ánh xạ khung kỹ năng SFIA 9
            </Text>
          </Stack>
        </Group>

        <SegmentedControl
          size="xs"
          value={activeTab}
          onChange={(val) => guardedSetTab(val as OnetMainTab)}
          aria-label="Chế độ làm việc O*NET"
          data={[
            {
              value: 'explorer',
              label: (
                <Group gap={6} wrap="nowrap">
                  <IconCompass size={14} stroke={1.5} aria-hidden="true" />
                  <Text span size="xs" fw={600}>
                    Khám phá & Quản lý
                  </Text>
                </Group>
              ),
            },
            {
              value: 'analytics',
              label: (
                <Group gap={6} wrap="nowrap">
                  <IconChartBar size={14} stroke={1.5} aria-hidden="true" />
                  <Text span size="xs" fw={600}>
                    Thống kê & Phân tích
                  </Text>
                </Group>
              ),
            },
          ]}
        />
      </Group>

      {/* Mode 1: Explorer Master-Detail */}
      {activeTab === 'explorer' ? (
        <Box className={classes.explorerBody}>
          <OnetMobileDrawer
            selectedSoc={selectedSoc}
            selectedTitle={currentTitle}
            onSelectSoc={guardedSetSoc}
            refreshTrigger={sidebarRefreshKey}
          />

          <Box className={classes.masterDetail}>
            <Paper
              component="aside"
              withBorder
              radius="md"
              visibleFrom="lg"
              className={classes.sidebarPanel}
              aria-label="Danh mục nghề nghiệp O*NET"
            >
              <OnetSidebar
                selectedSoc={selectedSoc}
                onSelectSoc={guardedSetSoc}
                refreshTrigger={sidebarRefreshKey}
              />
            </Paper>

            <Paper
              component="section"
              withBorder
              radius="md"
              className={classes.detailPanel}
              aria-label="Chi tiết nghề nghiệp O*NET"
            >
              <OnetDetailShell
                socCode={selectedSoc}
                activeDetailTab={activeDetailTab}
                onSelectDetailTab={guardedSetDetailTab}
                onLoadedDetail={(detail) => setCurrentTitle(detail.title)}
                onUpdateMappings={() =>
                  setSidebarRefreshKey((prev) => prev + 1)
                }
                onDirtyChange={setIsSfiaDirty}
              />
            </Paper>
          </Box>
        </Box>
      ) : null}

      {/* Mode 2: Analytics */}
      {activeTab === 'analytics' ? (
        <Box className={classes.analyticsPane}>
          <OnetAnalyticsView
            onSwitchToExplorer={() => guardedSetTab('explorer')}
            onSelectOccupation={guardedNavigateToOccupation}
          />
        </Box>
      ) : null}
    </Box>
  )
}

export function OnetWorkspaceClient() {
  return (
    <Suspense
      fallback={
        <Stack gap="sm" p="md">
          <Skeleton height={44} radius="md" />
          <Skeleton height={420} radius="md" />
        </Stack>
      }
    >
      <OnetWorkspaceContent />
    </Suspense>
  )
}
