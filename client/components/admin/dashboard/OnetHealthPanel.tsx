'use client'

import Link from 'next/link'
import {
  Alert,
  Badge,
  Button,
  Group,
  NumberFormatter,
  Paper,
  RingProgress,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconRefresh,
} from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import typography from '@/styles/typography.module.css'
import type { OnetAnalyticsSummary } from '@/types'

interface OnetHealthPanelProps {
  data?: OnetAnalyticsSummary
  isLoading: boolean
  error: unknown
  onRetry: () => void
}

const fmtProps = { thousandSeparator: '.', decimalSeparator: ',' } as const

export function OnetHealthPanel({
  data,
  isLoading,
  error,
  onRetry,
}: Readonly<OnetHealthPanelProps>) {
  const errMsg =
    error instanceof Error
      ? error.message
      : 'Dữ liệu tổng quan O*NET tạm thời gián đoạn.'

  if (isLoading) {
    return (
      <Paper p="md" radius="md" className={surfaces.subtleSurface}>
        <Group align="flex-start" wrap="nowrap" gap="md">
          <Skeleton circle h={96} w={96} />
          <Stack gap="xs" flex={1}>
            <Skeleton height={18} width="65%" />
            <Skeleton height={14} width="90%" />
            <Group gap="xs">
              <Skeleton height={20} width={116} radius="xl" />
              <Skeleton height={20} width={116} radius="xl" />
            </Group>
            <Skeleton height={28} width={160} radius="sm" />
          </Stack>
        </Group>
      </Paper>
    )
  }

  if (error || !data) {
    return (
      <Paper p="md" radius="md" className={surfaces.subtleSurface}>
        <Alert
          color="warning"
          variant="light"
          icon={<IconAlertTriangle size={16} stroke={1.5} />}
          title="Không thể tải thống kê O*NET"
        >
          <Stack gap="xs">
            <Text size="xs">{errMsg}</Text>
            <Group>
              <Button
                size="xs"
                variant="light"
                color="warning"
                leftSection={<IconRefresh size={14} stroke={1.5} />}
                onClick={onRetry}
              >
                Thử lại
              </Button>
            </Group>
          </Stack>
        </Alert>
      </Paper>
    )
  }

  const pct = data.overallMappingCoveragePercent
  return (
    <Paper p="md" radius="md" className={surfaces.subtleSurface}>
      <Group align="flex-start" wrap="nowrap" gap="md">
        <RingProgress
          size={96}
          thickness={9}
          roundCaps
          role="img"
          aria-label={`Độ phủ ánh xạ O*NET sang SFIA: ${pct}%`}
          sections={[
            {
              value: pct,
              color: 'brand',
              tooltip: `Đã ánh xạ ${data.totalMappedOccupations}/${data.totalOccupations} nghề (${pct}%)`,
            },
          ]}
          label={
            <Text
              ta="center"
              fw={700}
              size="sm"
              className={typography.tabularNums}
            >
              {pct}%
            </Text>
          }
        />
        <Stack gap={6} flex={1}>
          <Text size="sm" fw={600}>
            Độ phủ ánh xạ O*NET → SFIA
          </Text>
          <Text size="xs" c="dimmed" className={typography.tabularNums}>
            <NumberFormatter value={data.totalOccupations} {...fmtProps} /> nghề
            / {data.totalMajorGroups} nhóm SOC ({data.totalMappedOccupations} đã
            ánh xạ) ·{' '}
            <NumberFormatter value={data.totalSoftwareSkills} {...fmtProps} />{' '}
            công nghệ
          </Text>
          <Group gap="xs" wrap="wrap">
            <Badge color="brand" variant="light" size="xs">
              Nhóm CNTT (15): {data.itGroupCoveragePercent}%
            </Badge>
            <Badge color="warning" variant="light" size="xs">
              Công nghệ nóng:{' '}
              <NumberFormatter value={data.hotTechCount} {...fmtProps} />
            </Badge>
          </Group>
          <Group mt={4}>
            <Button
              component={Link}
              href="/admin/onet"
              variant="light"
              color="brand"
              size="xs"
              rightSection={<IconArrowRight size={14} stroke={1.5} />}
            >
              Mở Trình duyệt O*NET
            </Button>
          </Group>
        </Stack>
      </Group>
    </Paper>
  )
}
