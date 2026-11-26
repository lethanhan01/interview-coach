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
import type { SfiaCoverageStats } from '@/types'

interface SfiaHealthPanelProps {
  data?: SfiaCoverageStats
  isLoading: boolean
  error: unknown
  onRetry: () => void
}

export function SfiaHealthPanel({
  data,
  isLoading,
  error,
  onRetry,
}: Readonly<SfiaHealthPanelProps>) {
  const pct =
    data && data.totalSkills > 0
      ? Math.round((data.skillsWithQuestions / data.totalSkills) * 100)
      : 0
  const errMsg =
    error instanceof Error
      ? error.message
      : 'Dữ liệu độ phủ SFIA 9 tạm thời gián đoạn.'

  if (isLoading) {
    return (
      <Paper p="md" radius="md" className={surfaces.subtleSurface}>
        <Group align="flex-start" wrap="nowrap" gap="md">
          <Skeleton circle h={96} w={96} />
          <Stack gap="xs" flex={1}>
            <Skeleton height={18} width="60%" />
            <Skeleton height={14} width="85%" />
            <Group gap="xs">
              <Skeleton height={20} width={130} radius="xl" />
              <Skeleton height={20} width={110} radius="xl" />
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
          title="Không thể tải thống kê SFIA 9"
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

  return (
    <Paper p="md" radius="md" className={surfaces.subtleSurface}>
      <Group align="flex-start" wrap="nowrap" gap="md">
        <RingProgress
          size={96}
          thickness={9}
          roundCaps
          role="img"
          aria-label={`Độ phủ câu hỏi SFIA 9: ${pct}%`}
          sections={[
            {
              value: pct,
              color: 'success',
              tooltip: `${data.skillsWithQuestions}/${data.totalSkills} kỹ năng có câu hỏi (${pct}%)`,
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
            Độ phủ câu hỏi SFIA 9
          </Text>
          <Text size="xs" c="dimmed" className={typography.tabularNums}>
            {data.skillsWithQuestions}/{data.totalSkills} kỹ năng có câu hỏi (
            <NumberFormatter
              value={data.totalQuestions}
              thousandSeparator="."
              decimalSeparator=","
            />{' '}
            câu)
          </Text>
          <Group gap="xs" wrap="wrap">
            <Badge color="danger" variant="light" size="xs">
              {data.blindSpotsCount} điểm mù (0 câu hỏi)
            </Badge>
            <Badge color="success" variant="light" size="xs">
              {data.skillsWithOnet}/{data.totalSkills} gắn O*NET
            </Badge>
          </Group>
          <Group mt={4}>
            <Button
              component={Link}
              href="/admin/sfia?tab=analytics"
              variant="light"
              color="danger"
              size="xs"
              rightSection={<IconArrowRight size={14} stroke={1.5} />}
            >
              Xử lý Điểm mù SFIA
            </Button>
          </Group>
        </Stack>
      </Group>
    </Paper>
  )
}
