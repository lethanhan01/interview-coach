'use client'

import type { ReactNode } from 'react'
import {
  Badge,
  Group,
  type MantineColor,
  NumberFormatter,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconBriefcase,
  IconCircleCheck,
  IconStack2,
} from '@tabler/icons-react'
import typography from '@/styles/typography.module.css'
import type { SfiaCoverageStats } from '@/types'
import sfia from '../sfia.module.css'

export interface SfiaAnalyticsKpisProps {
  stats: SfiaCoverageStats
  onScrollToBlindSpots?: () => void
}

interface CoverageRingCardProps {
  title: string
  color: MantineColor
  icon: ReactNode
  rate: number
  ratioText: string
  tooltip: string
  footer: ReactNode
}

function CoverageRingCard({
  title,
  color,
  icon,
  rate,
  ratioText,
  tooltip,
  footer,
}: Readonly<CoverageRingCardProps>) {
  return (
    <Paper withBorder p="sm" radius="md">
      <Stack justify="space-between" gap="xs" h="100%">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text size="sm" fw={600} c="dimmed">
            {title}
          </Text>
          <ThemeIcon size="md" radius="md" variant="light" color={color}>
            {icon}
          </ThemeIcon>
        </Group>

        <Group gap="sm" align="center" wrap="nowrap">
          <RingProgress
            size={64}
            thickness={6}
            roundCaps
            role="img"
            aria-label={`${title}: ${rate}%`}
            sections={[{ value: Math.min(100, rate), color, tooltip }]}
            label={
              <Text
                ta="center"
                size="xs"
                fw={700}
                className={typography.tabularNums}
              >
                {Math.round(rate)}%
              </Text>
            }
          />
          <Stack gap={2} miw={0}>
            <Group gap={4} align="baseline" wrap="nowrap">
              <Text
                size="xl"
                fw={800}
                c={color}
                className={typography.tabularNums}
              >
                {rate}%
              </Text>
              <Text size="sm" c="dimmed" className={typography.tabularNums}>
                {ratioText}
              </Text>
            </Group>
            {footer}
          </Stack>
        </Group>
      </Stack>
    </Paper>
  )
}

export function SfiaAnalyticsKpis({
  stats,
  onScrollToBlindSpots,
}: Readonly<SfiaAnalyticsKpisProps>) {
  const questionRate =
    stats.totalSkills > 0
      ? Math.round((stats.skillsWithQuestions / stats.totalSkills) * 1000) / 10
      : 0
  const onetRate =
    stats.totalSkills > 0
      ? Math.round((stats.skillsWithOnet / stats.totalSkills) * 1000) / 10
      : 0
  const hasBlindSpots = stats.blindSpotsCount > 0
  const blindColor = hasBlindSpots ? 'danger' : 'success'

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs">
      <Paper withBorder p="sm" radius="md">
        <Stack justify="space-between" gap="xs" h="100%">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="sm" fw={600} c="dimmed">
              Tổng kỹ năng SFIA 9
            </Text>
            <ThemeIcon size="md" radius="md" variant="light" color="brand">
              <IconStack2 size={16} stroke={1.5} />
            </ThemeIcon>
          </Group>
          <Stack gap={6}>
            <Group gap={6} align="baseline">
              <Text size="xl" fw={800} className={typography.tabularNums}>
                <NumberFormatter
                  value={stats.totalSkills}
                  thousandSeparator="."
                  decimalSeparator=","
                />
              </Text>
              <Text size="sm" c="dimmed">
                kỹ năng
              </Text>
            </Group>
            <Group gap={6} wrap="wrap">
              <Badge size="sm" variant="light" color="brand">
                {stats.totalCategories} Danh mục
              </Badge>
              <Badge size="sm" variant="outline" color="neutral">
                {stats.totalSubcategories} Phân nhóm
              </Badge>
            </Group>
          </Stack>
        </Stack>
      </Paper>

      <CoverageRingCard
        title="Độ phủ câu hỏi phỏng vấn"
        color="brand"
        icon={<IconCircleCheck size={16} stroke={1.5} />}
        rate={questionRate}
        ratioText={`(${stats.skillsWithQuestions}/${stats.totalSkills})`}
        tooltip={`${stats.skillsWithQuestions}/${stats.totalSkills} kỹ năng có câu hỏi (${questionRate}%)`}
        footer={
          <Text size="sm" c="dimmed" className={typography.tabularNums}>
            <NumberFormatter
              prefix="Tổng số câu hỏi: "
              value={stats.totalQuestions}
              thousandSeparator="."
              decimalSeparator=","
            />
          </Text>
        }
      />

      <CoverageRingCard
        title="Ánh xạ nghề nghiệp O*NET"
        color="success"
        icon={<IconBriefcase size={16} stroke={1.5} />}
        rate={onetRate}
        ratioText={`(${stats.skillsWithOnet}/${stats.totalSkills})`}
        tooltip={`${stats.skillsWithOnet}/${stats.totalSkills} kỹ năng gắn nghề O*NET (${onetRate}%)`}
        footer={
          <Text size="sm" c="dimmed">
            Chuẩn tham chiếu O*NET SOC
          </Text>
        }
      />

      <UnstyledButton
        onClick={onScrollToBlindSpots}
        title="Nhấp để cuộn nhanh đến Bảng Điểm mù"
        className={sfia.analyticsBlindSpotCard}
        mod={{ clear: !hasBlindSpots || undefined }}
      >
        <Stack justify="space-between" gap="xs" h="100%">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="sm" fw={700} c={blindColor}>
              Điểm mù cần hành động
            </Text>
            <ThemeIcon size="md" radius="md" variant="light" color={blindColor}>
              <IconAlertTriangle size={16} stroke={1.5} />
            </ThemeIcon>
          </Group>
          <Stack gap={6}>
            <Group gap={6} align="baseline">
              <Text
                size="xl"
                fw={800}
                c={blindColor}
                className={typography.tabularNums}
              >
                <NumberFormatter
                  value={stats.blindSpotsCount}
                  thousandSeparator="."
                  decimalSeparator=","
                />
              </Text>
              <Text size="sm" c="dimmed">
                kỹ năng (0 câu hỏi)
              </Text>
            </Group>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Badge size="sm" variant="filled" color={blindColor}>
                {hasBlindSpots ? 'Ưu tiên bổ sung' : 'Đã phủ đầy đủ'}
              </Badge>
              <Group gap={2} wrap="nowrap">
                <Text size="sm" fw={600} c={blindColor}>
                  Xem bảng
                </Text>
                <IconArrowUpRight size={15} stroke={1.5} />
              </Group>
            </Group>
          </Stack>
        </Stack>
      </UnstyledButton>
    </SimpleGrid>
  )
}
