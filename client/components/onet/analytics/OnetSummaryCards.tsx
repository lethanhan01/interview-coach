'use client'

import {
  Badge,
  Group,
  NumberFormatter,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import {
  IconActivity,
  IconBook,
  IconCpu,
  IconLayersLinked,
} from '@tabler/icons-react'
import typography from '@/styles/typography.module.css'
import type { OnetAnalyticsSummary } from '@/types'

export interface OnetSummaryCardsProps {
  summary: OnetAnalyticsSummary
}

export function OnetSummaryCards({ summary }: Readonly<OnetSummaryCardsProps>) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs">
      {/* Card 1: Tổng nghề O*NET (100% real data — Bug #4 fix) */}
      <Paper withBorder p="xs" radius="md">
        <Stack gap={6}>
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm" fw={600} tt="uppercase" c="dimmed">
              Tổng nghề O*NET
            </Text>
            <ThemeIcon color="brand" variant="light" size="sm" radius="md">
              <IconBook size={15} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
          </Group>
          <Group align="baseline" gap="xs">
            <Text size="xl" fw={700} className={typography.tabularNums}>
              <NumberFormatter
                value={summary.totalOccupations}
                thousandSeparator="."
                decimalSeparator=","
              />
            </Text>
            <Text size="sm" c="dimmed">
              mã chuẩn SOC
            </Text>
          </Group>
          <Group gap="xs" wrap="wrap">
            <Badge color="neutral" variant="light" size="sm">
              {summary.totalMajorGroups} nhóm ngành
            </Badge>
            <Text size="sm" c="dimmed" className={typography.tabularNums}>
              {summary.totalMappedOccupations} nghề đã ánh xạ
            </Text>
          </Group>
        </Stack>
      </Paper>

      {/* Card 2: Độ phủ ánh xạ SFIA (Real percentage + IT Group 15) */}
      <Paper withBorder p="xs" radius="md">
        <Group align="center" gap="sm" wrap="nowrap">
          <RingProgress
            size={64}
            thickness={7}
            roundCaps
            sections={[
              {
                value: summary.overallMappingCoveragePercent,
                color: 'brand',
              },
            ]}
            label={
              <Text
                ta="center"
                fw={700}
                size="xs"
                className={typography.tabularNums}
              >
                {summary.overallMappingCoveragePercent}%
              </Text>
            }
          />
          <Stack gap={4} flex={1}>
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm" fw={600} tt="uppercase" c="dimmed">
                Độ phủ ánh xạ SFIA
              </Text>
              <ThemeIcon color="success" variant="light" size="sm" radius="md">
                <IconLayersLinked size={15} stroke={1.5} aria-hidden="true" />
              </ThemeIcon>
            </Group>
            <Text size="sm" fw={600} className={typography.tabularNums}>
              {summary.totalMappedOccupations} / {summary.totalOccupations} nghề
            </Text>
            <Badge color="brand" variant="light" size="sm">
              Nhóm CNTT (15): {summary.itGroupMappedOccupations}/
              {summary.itGroupOccupations} ({summary.itGroupCoveragePercent}%)
            </Badge>
          </Stack>
        </Group>
      </Paper>

      {/* Card 3: Công nghệ phần mềm */}
      <Paper withBorder p="xs" radius="md">
        <Stack gap={6}>
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm" fw={600} tt="uppercase" c="dimmed">
              Công nghệ phần mềm
            </Text>
            <ThemeIcon color="warning" variant="light" size="sm" radius="md">
              <IconCpu size={15} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
          </Group>
          <Group align="baseline" gap="xs">
            <Text size="xl" fw={700} className={typography.tabularNums}>
              <NumberFormatter
                value={summary.totalSoftwareSkills}
                thousandSeparator="."
                decimalSeparator=","
              />
            </Text>
            <Text size="sm" c="dimmed">
              kỹ năng & công cụ
            </Text>
          </Group>
          <Group gap="xs" wrap="wrap">
            <Badge color="warning" variant="light" size="sm">
              Hot Tech:{' '}
              <NumberFormatter
                value={summary.hotTechCount}
                thousandSeparator="."
                decimalSeparator=","
              />
            </Badge>
            <Badge color="success" variant="light" size="sm">
              Nhu cầu cao:{' '}
              <NumberFormatter
                value={summary.inDemandTechCount}
                thousandSeparator="."
                decimalSeparator=","
              />
            </Badge>
          </Group>
        </Stack>
      </Paper>

      {/* Card 4: Ứng dụng thực tế */}
      <Paper withBorder p="xs" radius="md">
        <Stack gap={6}>
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm" fw={600} tt="uppercase" c="dimmed">
              Ứng dụng thực tế
            </Text>
            <ThemeIcon color="success" variant="light" size="sm" radius="md">
              <IconActivity size={15} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
          </Group>
          <Group align="baseline" gap="xs">
            <Text size="xl" fw={700} className={typography.tabularNums}>
              <NumberFormatter
                value={summary.totalMockInterviews}
                thousandSeparator="."
                decimalSeparator=","
              />
            </Text>
            <Text size="sm" c="dimmed">
              phiên phỏng vấn
            </Text>
          </Group>
          <Group gap="xs" wrap="wrap">
            <Badge color="brand" variant="light" size="sm">
              <NumberFormatter
                value={summary.totalLinkedJobDescriptions}
                thousandSeparator="."
                decimalSeparator=","
              />{' '}
              JD liên kết
            </Badge>
            <Badge color="neutral" variant="light" size="sm">
              <NumberFormatter
                value={summary.totalAlternateTitles}
                thousandSeparator="."
                decimalSeparator=","
              />{' '}
              chức danh
            </Badge>
          </Group>
        </Stack>
      </Paper>
    </SimpleGrid>
  )
}
