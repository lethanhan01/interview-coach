'use client'

import {
  Badge,
  Button,
  Collapse,
  Group,
  NumberFormatter,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import {
  IconChevronDown,
  IconChevronUp,
  IconSparkles,
} from '@tabler/icons-react'
import type { SfiaCoverageStats } from '@/types'
import { SfiaAnatomyDiagram } from './SfiaAnatomyDiagram'

const LOCAL_STORAGE_KEY = 'sfia_anatomy_banner_collapsed'

export interface SfiaAnatomyBannerProps {
  stats?: SfiaCoverageStats | null
  coverageStats?: SfiaCoverageStats | null
  className?: string
}

function StatValue({
  value,
  suffix,
}: Readonly<{ value?: number; suffix?: string }>) {
  if (value === undefined || value === null) {
    return <>—</>
  }
  return (
    <>
      <NumberFormatter
        value={value}
        thousandSeparator="."
        decimalSeparator=","
      />
      {suffix ? ` ${suffix}` : null}
    </>
  )
}

export function SfiaAnatomyBanner({
  stats,
  coverageStats,
  className,
}: Readonly<SfiaAnatomyBannerProps>) {
  const resolvedStats = coverageStats ?? stats
  const [collapsed, setCollapsed] = useLocalStorage<boolean>({
    key: LOCAL_STORAGE_KEY,
    defaultValue: false,
  })

  return (
    <Paper withBorder radius="md" p="sm" className={className}>
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="xs" align="center">
            <ThemeIcon color="brand" variant="light" size="md" radius="sm">
              <IconSparkles size={16} stroke={1.5} />
            </ThemeIcon>
            <Stack gap={2}>
              <Group gap="xs" align="center">
                <Title order={3} fz="sm" fw={700}>
                  Cấu Trúc Khung Năng Lực SFIA 9
                </Title>
                <Badge color="brand" variant="light" size="xs">
                  4 TRỤ CỘT CỐT LÕI
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Kiến trúc chuẩn hóa: Danh mục ➔ Phân nhóm ➔ Kỹ năng ➔ 7 Cấp độ
                trách nhiệm
              </Text>
            </Stack>
          </Group>

          <Button
            variant="subtle"
            color="neutral"
            size="xs"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={
              collapsed
                ? 'Mở rộng cấu trúc khung năng lực SFIA 9'
                : 'Thu gọn cấu trúc khung năng lực SFIA 9'
            }
            rightSection={
              collapsed ? (
                <IconChevronDown size={14} stroke={1.5} />
              ) : (
                <IconChevronUp size={14} stroke={1.5} />
              )
            }
          >
            {collapsed ? 'Mở rộng' : 'Thu gọn'}
          </Button>
        </Group>

        <Collapse expanded={!collapsed}>
          <Stack gap="sm" pt="xs">
            <SfiaAnatomyDiagram />

            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
              <Paper withBorder p="xs" radius="sm">
                <Group justify="space-between" align="center">
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">
                      Kỹ năng SFIA 9
                    </Text>
                    <Text fw={700} size="sm">
                      <StatValue
                        value={resolvedStats?.totalSkills}
                        suffix="Kỹ năng"
                      />
                    </Text>
                  </Stack>
                  <Badge color="brand" variant="light" size="sm">
                    <StatValue value={resolvedStats?.totalSkills} />
                  </Badge>
                </Group>
              </Paper>

              <Paper withBorder p="xs" radius="sm">
                <Group justify="space-between" align="center">
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">
                      Phân nhóm
                    </Text>
                    <Text fw={700} size="sm">
                      <StatValue
                        value={resolvedStats?.totalSubcategories}
                        suffix="Phân nhóm"
                      />
                    </Text>
                  </Stack>
                  <Badge color="success" variant="light" size="sm">
                    <StatValue value={resolvedStats?.totalSubcategories} />
                  </Badge>
                </Group>
              </Paper>

              <Paper withBorder p="xs" radius="sm">
                <Group justify="space-between" align="center">
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">
                      Danh mục
                    </Text>
                    <Text fw={700} size="sm">
                      <StatValue
                        value={resolvedStats?.totalCategories}
                        suffix="Danh mục"
                      />
                    </Text>
                  </Stack>
                  <Badge color="brand" variant="light" size="sm">
                    <StatValue value={resolvedStats?.totalCategories} />
                  </Badge>
                </Group>
              </Paper>

              <Paper withBorder p="xs" radius="sm">
                <Group justify="space-between" align="center">
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">
                      Ngân hàng câu hỏi
                    </Text>
                    <Text fw={700} size="sm">
                      <StatValue
                        value={resolvedStats?.totalQuestions}
                        suffix="Câu hỏi"
                      />
                    </Text>
                  </Stack>
                  <Badge color="warning" variant="light" size="sm">
                    <StatValue value={resolvedStats?.totalQuestions} />
                  </Badge>
                </Group>
              </Paper>
            </SimpleGrid>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  )
}
