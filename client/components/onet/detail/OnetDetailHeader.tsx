'use client'

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  CopyButton,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconCheck,
  IconCopy,
  IconShare,
  IconSparkles,
} from '@tabler/icons-react'
import type { OnetDetailSubTab, OnetOccupationDetail } from '@/types'
import classes from './OnetDetailShell.module.css'

export interface OnetDetailHeaderProps {
  detail: OnetOccupationDetail
  activeDetailTab: OnetDetailSubTab
  onSelectDetailTab: (tab: OnetDetailSubTab) => void
}

export function OnetDetailHeader({
  detail,
  activeDetailTab,
  onSelectDetailTab,
}: Readonly<OnetDetailHeaderProps>) {
  return (
    <Box className={classes.header}>
      <Stack gap="xs">
        {/* Row 1: Badges */}
        <Group gap="xs" wrap="wrap">
          <Badge color="neutral" variant="outline" size="sm">
            Nhóm SOC {detail.majorGroupCode}
          </Badge>

          {detail.isMapped ? (
            <Badge
              color="success"
              variant="light"
              size="sm"
              leftSection={<IconSparkles size={12} stroke={1.5} />}
            >
              Đã ánh xạ {detail.stats.mappingCount} kỹ năng SFIA
            </Badge>
          ) : (
            <Badge color="neutral" variant="light" size="sm">
              Chưa có ánh xạ SFIA
            </Badge>
          )}

          <Badge color="neutral" variant="outline" size="sm">
            Job Zone {detail.jobZone.zone} / 5
          </Badge>
        </Group>

        {/* Row 2: SOC Code & Actions */}
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="xs" align="center">
            <Text fz="xl" fw={900} ff="monospace">
              {detail.socCode}
            </Text>
            <CopyButton value={detail.socCode} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? 'Đã sao chép' : 'Sao chép mã SOC'}
                  withArrow
                >
                  <ActionIcon
                    color={copied ? 'success' : 'neutral'}
                    variant="subtle"
                    size="sm"
                    onClick={copy}
                    aria-label="Sao chép mã SOC"
                  >
                    {copied ? (
                      <IconCheck size={16} stroke={1.5} />
                    ) : (
                      <IconCopy size={16} stroke={1.5} />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>

          <CopyButton
            value={typeof window !== 'undefined' ? window.location.href : ''}
            timeout={2000}
          >
            {({ copied, copy }) => (
              <Button
                variant="subtle"
                color={copied ? 'success' : 'neutral'}
                size="xs"
                leftSection={
                  copied ? (
                    <IconCheck size={14} stroke={1.5} />
                  ) : (
                    <IconShare size={14} stroke={1.5} />
                  )
                }
                onClick={copy}
                aria-label="Chia sẻ liên kết"
              >
                {copied ? 'Đã sao chép liên kết' : 'Chia sẻ liên kết'}
              </Button>
            )}
          </CopyButton>
        </Group>

        {/* Row 3: Title */}
        <Title order={2} size="h3">
          {detail.title}
        </Title>

        {/* Row 4: 5 Subtabs Switcher */}
        <SegmentedControl
          size="xs"
          fullWidth
          value={activeDetailTab}
          onChange={(val) => onSelectDetailTab(val as OnetDetailSubTab)}
          aria-label="Các tab chi tiết nghề O*NET"
          data={[
            { value: 'overview', label: 'Tổng quan' },
            {
              value: 'tech',
              label: `Kỹ năng PM (${detail.stats.toolCount})`,
            },
            {
              value: 'sfia',
              label: `Ánh xạ SFIA (${detail.stats.mappingCount})`,
            },
            {
              value: 'tasks',
              label: `Nhiệm vụ (${detail.stats.taskCount})`,
            },
            {
              value: 'titles',
              label: `Chức danh (${detail.stats.alternateTitleCount})`,
            },
          ]}
        />
      </Stack>
    </Box>
  )
}
