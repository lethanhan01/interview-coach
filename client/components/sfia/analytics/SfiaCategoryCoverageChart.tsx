'use client'

import dynamic from 'next/dynamic'
import {
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { IconFolder, IconInfoCircle, IconX } from '@tabler/icons-react'
import { getSfiaCategorySemanticTheme } from '@/components/sfia/sfia-theme'
import surfaces from '@/styles/surfaces.module.css'
import typography from '@/styles/typography.module.css'
import type { SfiaCategoryMetric } from '@/types'
import classes from './SfiaAnalytics.module.css'

const SfiaCategoryBarChart = dynamic(() => import('./SfiaCategoryBarChart'), {
  ssr: false,
  loading: () => <Skeleton height={220} radius="md" />,
})

export interface SfiaCategoryCoverageChartProps {
  categoryDistribution: SfiaCategoryMetric[]
  selectedCategory?: string | null
  onSelectCategory?: (categoryCode: string | null) => void
}

export function SfiaCategoryCoverageChart({
  categoryDistribution,
  selectedCategory,
  onSelectCategory,
}: Readonly<SfiaCategoryCoverageChartProps>) {
  return (
    <Paper withBorder p="md" radius="md" h="100%">
      <Stack justify="space-between" gap="sm" h="100%">
        <Stack gap="sm">
          <Group
            justify="space-between"
            align="flex-start"
            gap="xs"
            wrap="wrap"
          >
            <Group gap="xs" align="flex-start" wrap="nowrap">
              <ThemeIcon size="md" radius="md" variant="light" color="brand">
                <IconFolder size={16} stroke={1.5} />
              </ThemeIcon>
              <Stack gap={0}>
                <Title order={3} size="h5">
                  Phân bổ &amp; Độ phủ theo 6 Danh mục SFIA
                </Title>
                <Text size="xs" c="dimmed">
                  So sánh số lượng câu hỏi và kỹ năng trong từng danh mục
                </Text>
              </Stack>
            </Group>

            {selectedCategory ? (
              <Button
                variant="light"
                color="brand"
                size="compact-xs"
                rightSection={<IconX size={12} stroke={1.5} />}
                onClick={() => onSelectCategory?.(null)}
              >
                Bỏ lọc danh mục
              </Button>
            ) : null}
          </Group>

          {categoryDistribution.length === 0 ? (
            <Paper p="md" radius="md" className={surfaces.subtleSurface}>
              <Text size="xs" c="dimmed" ta="center">
                Chưa có dữ liệu phân bổ theo danh mục SFIA.
              </Text>
            </Paper>
          ) : (
            <SfiaCategoryBarChart
              data={categoryDistribution}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
            />
          )}

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            {categoryDistribution.map((cat) => {
              const theme = getSfiaCategorySemanticTheme(cat.code)
              const Icon = theme.icon
              const isSelected = selectedCategory === cat.code

              return (
                <UnstyledButton
                  key={cat.code}
                  aria-pressed={isSelected}
                  aria-label={`Lọc theo danh mục ${cat.nameVi} (${cat.code})`}
                  className={classes.filterPill}
                  mod={{ active: isSelected || undefined }}
                  onClick={() =>
                    onSelectCategory?.(isSelected ? null : cat.code)
                  }
                >
                  <Group gap="xs" wrap="nowrap" miw={0}>
                    <ThemeIcon
                      size="xs"
                      radius="sm"
                      variant={theme.badgeVariant}
                      color={theme.color}
                    >
                      <Icon size={12} stroke={1.5} />
                    </ThemeIcon>
                    <Stack gap={0} miw={0}>
                      <Text size="xs" fw={600} truncate>
                        {cat.nameVi}
                      </Text>
                      <Group gap={6} wrap="nowrap">
                        <Badge
                          size="xs"
                          variant={theme.badgeVariant}
                          color={theme.color}
                        >
                          {cat.code}
                        </Badge>
                        <Text
                          size="xs"
                          c="dimmed"
                          className={typography.tabularNums}
                        >
                          {cat.skillCount} KN · {cat.questionCount} CH
                        </Text>
                      </Group>
                    </Stack>
                  </Group>
                </UnstyledButton>
              )
            })}
          </SimpleGrid>
        </Stack>

        <Group gap={6} wrap="nowrap" pt="xs" className={surfaces.borderedTop}>
          <IconInfoCircle size={14} stroke={1.5} />
          <Text size="xs" c="dimmed">
            Chọn cột biểu đồ hoặc nút danh mục để lọc chéo Bảng Điểm mù bên
            dưới.
          </Text>
        </Group>
      </Stack>
    </Paper>
  )
}
