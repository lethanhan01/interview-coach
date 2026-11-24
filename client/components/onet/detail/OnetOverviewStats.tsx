'use client'

import {
  Badge,
  Group,
  Paper,
  Progress,
  SemiCircleProgress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import {
  IconArrowRight,
  IconBriefcase,
  IconClock,
  IconFileCheck,
  IconLayersLinked,
  IconSchool,
  IconSparkles,
  IconTools,
} from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import type { OnetDetailSubTab, OnetOccupationDetail } from '@/types'

export interface OnetOverviewStatsProps {
  detail: OnetOccupationDetail
  onSelectDetailTab: (tab: OnetDetailSubTab) => void
}

const JOB_ZONE_LABELS = [
  'Mức 1: Ít / Không cần chuẩn bị',
  'Mức 2: Chuẩn bị cơ bản',
  'Mức 3: Chuẩn bị trung bình',
  'Mức 4: Chuẩn bị đáng kể',
  'Mức 5: Chuẩn bị chuyên sâu',
]

export function OnetOverviewStats({
  detail,
  onSelectDetailTab,
}: Readonly<OnetOverviewStatsProps>) {
  const kpiCards = [
    {
      tab: 'tech' as const,
      label: 'Công nghệ',
      count: detail.stats.toolCount,
      unit: 'tools',
      color: 'brand' as const,
      Icon: IconTools,
      aria: 'Xem kỹ năng phần mềm của nghề này',
    },
    {
      tab: 'sfia' as const,
      label: 'SFIA 9',
      count: detail.stats.mappingCount,
      unit: 'kỹ năng',
      color: 'success' as const,
      Icon: IconSparkles,
      aria: 'Xem ánh xạ SFIA của nghề này',
    },
    {
      tab: 'tasks' as const,
      label: 'Nhiệm vụ',
      count: detail.stats.taskCount,
      unit: 'tasks',
      color: 'brand' as const,
      Icon: IconFileCheck,
      aria: 'Xem danh sách nhiệm vụ của nghề này',
    },
    {
      tab: 'titles' as const,
      label: 'Chức danh',
      count: detail.stats.alternateTitleCount,
      unit: 'titles',
      color: 'neutral' as const,
      Icon: IconLayersLinked,
      aria: 'Xem danh sách chức danh thị trường',
    },
  ]

  return (
    <Stack gap="sm">
      {/* 4 Interactive KPI Cards using UnstyledButton (SEM-HTML-003) */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
        {kpiCards.map((card) => (
          <UnstyledButton
            key={card.tab}
            onClick={() => onSelectDetailTab(card.tab)}
            aria-label={card.aria}
          >
            <Paper withBorder p="sm" radius="md" h="100%">
              <Stack gap={6} justify="space-between" h="100%">
                <Group justify="space-between" wrap="nowrap">
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                    {card.label}
                  </Text>
                  <ThemeIcon size="sm" variant="light" color={card.color}>
                    <card.Icon size={14} stroke={1.5} />
                  </ThemeIcon>
                </Group>

                <Group justify="space-between" align="flex-end" wrap="nowrap">
                  <Group gap={4} align="baseline">
                    <Text size="xl" fw={700}>
                      {card.count}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {card.unit}
                    </Text>
                  </Group>
                  <IconArrowRight size={14} stroke={1.5} />
                </Group>
              </Stack>
            </Paper>
          </UnstyledButton>
        ))}
      </SimpleGrid>

      {/* Job Zone Section */}
      <Paper withBorder p="sm" radius="md">
        <Stack gap="xs">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="brand">
                <IconSchool size={16} stroke={1.5} />
              </ThemeIcon>
              <Text size="sm" fw={700}>
                Job Zone {detail.jobZone.zone}: {detail.jobZone.name}
              </Text>
            </Group>
            <Badge color="brand" variant="outline" size="xs">
              Cấp độ {detail.jobZone.zone} / 5
            </Badge>
          </Group>

          {/* Job Zone Gauge */}
          <Group justify="space-between" align="center" wrap="wrap">
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Mức độ đào tạo & yêu cầu kinh nghiệm:
              </Text>
              <Text size="xs" fw={600} c="brand">
                {JOB_ZONE_LABELS[detail.jobZone.zone - 1] ??
                  `Cấp độ ${detail.jobZone.zone}`}
              </Text>
            </Stack>

            <SemiCircleProgress
              value={(detail.jobZone.zone / 5) * 100}
              filledSegmentColor="brand"
              label={`Mức ${detail.jobZone.zone}/5`}
              size={110}
              thickness={10}
            />
          </Group>

          <Progress
            value={(detail.jobZone.zone / 5) * 100}
            color="brand"
            size="sm"
            radius="xl"
            aria-label={`Mức độ chuẩn bị Job Zone ${detail.jobZone.zone}/5`}
          />

          {/* 3 Job Zone Specific Requirements */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
            <Paper p="xs" radius="sm" className={surfaces.subtleSurface}>
              <Stack gap={2}>
                <Group gap={6}>
                  <IconSchool size={14} stroke={1.5} />
                  <Text size="xs" c="dimmed">
                    Trình độ học vấn
                  </Text>
                </Group>
                <Text size="xs" fw={600}>
                  {detail.jobZone.education}
                </Text>
              </Stack>
            </Paper>

            <Paper p="xs" radius="sm" className={surfaces.subtleSurface}>
              <Stack gap={2}>
                <Group gap={6}>
                  <IconBriefcase size={14} stroke={1.5} />
                  <Text size="xs" c="dimmed">
                    Kinh nghiệm yêu cầu
                  </Text>
                </Group>
                <Text size="xs" fw={600}>
                  {detail.jobZone.experience}
                </Text>
              </Stack>
            </Paper>

            <Paper p="xs" radius="sm" className={surfaces.subtleSurface}>
              <Stack gap={2}>
                <Group gap={6}>
                  <IconClock size={14} stroke={1.5} />
                  <Text size="xs" c="dimmed">
                    Đào tạo tại chỗ
                  </Text>
                </Group>
                <Text size="xs" fw={600}>
                  {detail.jobZone.jobTraining}
                </Text>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Paper>
    </Stack>
  )
}
