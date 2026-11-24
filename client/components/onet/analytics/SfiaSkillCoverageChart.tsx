'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Badge,
  Button,
  Chip,
  Group,
  Loader,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
} from '@tabler/icons-react'
import { onetAdminQueries } from '@/queries/onet.queries'
import surfaces from '@/styles/surfaces.module.css'
import typography from '@/styles/typography.module.css'
import type { SfiaSkillCoverageItem } from '@/types'

const SfiaCoverageBarChart = dynamic(() => import('./SfiaCoverageBarChart'), {
  ssr: false,
  loading: () => <Skeleton height={180} radius="md" />,
})

const DEFAULT_VISIBLE_COUNT = 5

export interface SfiaSkillCoverageChartProps {
  data: SfiaSkillCoverageItem[]
}

export function SfiaSkillCoverageChart({
  data,
}: Readonly<SfiaSkillCoverageChartProps>) {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [isExpanded, setIsExpanded] = useState(false)

  const categories = useMemo(() => {
    const unique = new Set<string>()
    for (const item of data) {
      if (item.category) unique.add(item.category)
    }
    return ['ALL', ...Array.from(unique)]
  }, [data])

  const isFiltered = selectedCategory !== 'ALL'
  const categoryQuery = useQuery({
    ...onetAdminQueries.sfiaCoverage(
      20,
      isFiltered ? selectedCategory : undefined
    ),
    enabled: isFiltered,
    placeholderData: keepPreviousData,
  })

  const filteredData = useMemo(
    () => (isFiltered ? (categoryQuery.data ?? []) : data),
    [isFiltered, categoryQuery.data, data]
  )

  const visibleItems = useMemo(
    () =>
      isExpanded ? filteredData : filteredData.slice(0, DEFAULT_VISIBLE_COUNT),
    [filteredData, isExpanded]
  )

  const chartData = useMemo(
    () =>
      visibleItems.map((item) => ({
        code: item.code,
        name: item.name,
        coreCount: item.coreCount,
        secondaryCount: item.secondaryCount,
      })),
    [visibleItems]
  )

  return (
    <Paper withBorder p="sm" radius="md" h="100%">
      <Stack gap="xs" h="100%">
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Stack gap={0}>
            <Title order={2} size="h5">
              Độ phủ kỹ năng SFIA 9
            </Title>
            <Text size="xs" c="dimmed">
              Kỹ năng cốt lõi và bổ trợ theo dải cấp độ mục tiêu
            </Text>
          </Stack>
          <Group gap={6} align="center">
            {isFiltered && categoryQuery.isFetching ? (
              <Loader size={12} />
            ) : null}
            <Badge color="brand" variant="light" size="xs">
              {filteredData.length} kỹ năng
            </Badge>
          </Group>
        </Group>

        {categories.length > 1 ? (
          <Chip.Group
            value={selectedCategory}
            onChange={(value) => {
              setSelectedCategory(
                Array.isArray(value) ? (value[0] ?? 'ALL') : value
              )
              setIsExpanded(false)
            }}
          >
            <Group gap={6} wrap="wrap">
              {categories.map((cat) => (
                <Chip key={cat} value={cat} size="xs" variant="light">
                  {cat === 'ALL' ? 'Tất cả' : cat}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        ) : null}

        {isFiltered && categoryQuery.isError ? (
          <Alert
            color="danger"
            variant="light"
            icon={<IconAlertCircle size={16} stroke={1.5} />}
            title="Không thể lọc độ phủ SFIA"
          >
            <Stack gap="xs">
              <Text size="xs">
                {categoryQuery.error instanceof Error
                  ? categoryQuery.error.message
                  : 'Đã xảy ra lỗi khi tải dữ liệu theo danh mục.'}
              </Text>
              <Group>
                <Button
                  size="xs"
                  variant="light"
                  color="danger"
                  leftSection={<IconRefresh size={12} stroke={1.5} />}
                  onClick={() => void categoryQuery.refetch()}
                >
                  Thử lại
                </Button>
              </Group>
            </Stack>
          </Alert>
        ) : visibleItems.length === 0 ? (
          <Paper p="md" radius="md" className={surfaces.subtleSurface}>
            <Text size="xs" c="dimmed" ta="center">
              Chưa có dữ liệu độ phủ kỹ năng SFIA.
            </Text>
          </Paper>
        ) : (
          <>
            <SfiaCoverageBarChart data={chartData} />

            <Stack gap={4}>
              {visibleItems.map((item) => (
                <Group
                  key={item.code}
                  justify="space-between"
                  align="center"
                  wrap="nowrap"
                  gap="xs"
                >
                  <Group gap={6} wrap="nowrap" miw={0}>
                    <Badge color="brand" variant="outline" size="xs">
                      {item.code}
                    </Badge>
                    <Text size="xs" lineClamp={1}>
                      {item.name}
                    </Text>
                  </Group>
                  <Group
                    gap={6}
                    wrap="nowrap"
                    className={typography.tabularNums}
                  >
                    <Badge color="neutral" variant="light" size="xs">
                      L{item.minTargetLevel}–L{item.maxTargetLevel}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      TB L{item.avgTargetLevel}
                    </Text>
                  </Group>
                </Group>
              ))}
            </Stack>

            {filteredData.length > DEFAULT_VISIBLE_COUNT ? (
              <Group justify="center" mt="auto">
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  rightSection={
                    isExpanded ? (
                      <IconChevronUp size={14} stroke={1.5} />
                    ) : (
                      <IconChevronDown size={14} stroke={1.5} />
                    )
                  }
                >
                  {isExpanded
                    ? 'Thu gọn'
                    : `Xem thêm ${filteredData.length - DEFAULT_VISIBLE_COUNT} kỹ năng`}
                </Button>
              </Group>
            ) : null}
          </>
        )}
      </Stack>
    </Paper>
  )
}
