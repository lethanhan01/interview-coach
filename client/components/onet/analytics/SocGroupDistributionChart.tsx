'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import type { SocGroupDistributionItem } from '@/types'
import type { SocChartDatum, SocChartMetricMode } from './SocGroupBarChart'

const SocGroupBarChart = dynamic(() => import('./SocGroupBarChart'), {
  ssr: false,
  loading: () => <Skeleton height={220} radius="md" />,
})

export interface SocGroupDistributionChartProps {
  data: SocGroupDistributionItem[]
  selectedGroup: string | null
  onSelectGroup: (groupCode: string | null) => void
}

export function SocGroupDistributionChart({
  data,
  selectedGroup,
  onSelectGroup,
}: Readonly<SocGroupDistributionChartProps>) {
  const [metricMode, setMetricMode] =
    useState<SocChartMetricMode>('occupations')

  const chartData = useMemo<SocChartDatum[]>(
    () =>
      data.map((item) => ({
        code: item.code,
        name: item.name,
        totalOccupations: item.totalOccupations,
        mappedOccupations: item.mappedOccupations,
        unmappedOccupations: Math.max(
          0,
          item.totalOccupations - item.mappedOccupations
        ),
        mappingCoveragePercent: item.mappingCoveragePercent,
      })),
    [data]
  )

  const selectOptions = useMemo(
    () =>
      data.map((item) => ({
        value: item.code,
        label: `${item.code} — ${item.name} (${item.mappedOccupations}/${item.totalOccupations})`,
      })),
    [data]
  )

  const activeGroupMeta = useMemo(
    () => data.find((item) => item.code === selectedGroup) ?? null,
    [data, selectedGroup]
  )

  return (
    <Paper withBorder p="sm" radius="md" h="100%">
      <Stack gap="xs" h="100%">
        <Group justify="space-between" align="flex-start" gap="xs" wrap="wrap">
          <Stack gap={0}>
            <Title order={2} size="h5">
              Phân bổ {data.length || 23} nhóm ngành SOC
            </Title>
            <Text size="xs" c="dimmed">
              Chọn cột hoặc danh sách để lọc chéo bảng Top nghề nghiệp bên dưới
            </Text>
          </Stack>

          <SegmentedControl
            size="xs"
            value={metricMode}
            onChange={(val) => setMetricMode(val as SocChartMetricMode)}
            aria-label="Chế độ hiển thị biểu đồ nhóm ngành SOC"
            data={[
              { value: 'occupations', label: 'Số nghề' },
              { value: 'coverage', label: 'Tỷ lệ %' },
              { value: 'mappedSplit', label: 'Xếp chồng' },
            ]}
          />
        </Group>

        {/* Keyboard-accessible Dual Interaction filter (Q8) */}
        <Group gap="xs" align="center" wrap="wrap">
          <Select
            size="xs"
            searchable
            clearable
            w={{ base: '100%', sm: 280 }}
            placeholder="Lọc nhanh theo nhóm ngành SOC..."
            aria-label="Lọc nhanh theo nhóm ngành SOC"
            value={selectedGroup}
            onChange={(val) => onSelectGroup(val)}
            data={selectOptions}
          />

          {activeGroupMeta ? (
            <Badge
              color="brand"
              variant="light"
              size="sm"
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="transparent"
                  color="brand"
                  aria-label="Xóa lọc nhóm SOC"
                  onClick={() => onSelectGroup(null)}
                >
                  <IconX size={12} stroke={1.5} />
                </ActionIcon>
              }
            >
              Đang lọc: {activeGroupMeta.code} — {activeGroupMeta.name}
            </Badge>
          ) : null}
        </Group>

        {chartData.length === 0 ? (
          <Paper p="md" radius="md" className={surfaces.subtleSurface}>
            <Text size="xs" c="dimmed" ta="center">
              Chưa có dữ liệu phân bổ nhóm ngành SOC.
            </Text>
          </Paper>
        ) : (
          <SocGroupBarChart
            data={chartData}
            metricMode={metricMode}
            selectedGroup={selectedGroup}
            onSelectGroup={onSelectGroup}
          />
        )}
      </Stack>
    </Paper>
  )
}
