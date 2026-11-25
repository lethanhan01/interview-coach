'use client'

import dynamic from 'next/dynamic'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconStack2,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { catalogQueries } from '@/queries/catalog.queries'
import type { SkillBreakdownItem } from '@/types'
import report from '../report.module.css'
import { SfiaSegmentMeter } from './SfiaSegmentMeter'

const SfiaCompetencyCharts = dynamic(() => import('./SfiaCompetencyCharts'), {
  ssr: false,
  loading: () => <Skeleton height={260} radius="md" />,
})

export interface SfiaCompetencyOverviewProps {
  skills?: SkillBreakdownItem[]
  className?: string
}

export function SfiaCompetencyOverview({
  skills = [],
  className,
}: Readonly<SfiaCompetencyOverviewProps>) {
  const catalogQuery = useQuery({
    ...catalogQueries.interviewOptions(),
    enabled: skills.length > 0,
  })

  if (!skills || skills.length === 0) {
    return null
  }

  const passedCount = skills.filter((s) => s.status === 'passed').length
  const gapCount = skills.filter((s) => s.status === 'gap').length
  const sfiaLevels = catalogQuery.data?.sfiaLevels

  return (
    <Card withBorder radius="md" p="lg" className={className}>
      <Stack gap="lg">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon size={36} radius="md" color="brand" variant="light">
              <IconStack2 size={20} aria-hidden="true" />
            </ThemeIcon>
            <Stack gap={2}>
              <Text size="lg" fw={700}>
                Tổng Quan Năng Lực SFIA (Level 1-7)
              </Text>
              <Text size="xs" c="dimmed">
                Đối chiếu Cấp độ Kỳ vọng (Target) và Cấp độ Thể hiện thực tế
                (Demonstrated)
              </Text>
            </Stack>
          </Group>

          <Group gap="xs">
            <Badge
              color="success"
              variant="light"
              size="md"
              leftSection={<IconCircleCheck size={14} aria-hidden="true" />}
            >
              <Text component="span" fw={700}>
                {passedCount}
              </Text>{' '}
              Đạt chuẩn
            </Badge>
            {gapCount > 0 && (
              <Badge
                color="warning"
                variant="light"
                size="md"
                leftSection={<IconAlertTriangle size={14} aria-hidden="true" />}
              >
                <Text component="span" fw={700}>
                  {gapCount}
                </Text>{' '}
                Cần hoàn thiện
              </Badge>
            )}
          </Group>
        </Group>

        <SfiaCompetencyCharts skills={skills} />

        {catalogQuery.isError ? (
          <Alert
            color="danger"
            variant="light"
            icon={
              <IconAlertTriangle size={16} stroke={1.5} aria-hidden="true" />
            }
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="xs">
              <Text size="xs">
                Không thể tải mô tả cấp độ SFIA. Thanh đo đang hiển thị theo mã
                cấp độ L1–L7.
              </Text>
              <Button
                size="xs"
                variant="light"
                color="danger"
                onClick={() => void catalogQuery.refetch()}
              >
                Thử lại
              </Button>
            </Group>
          </Alert>
        ) : null}

        <Table.ScrollContainer minWidth={680}>
          <Stack gap="xs">
            {skills.map((skill) => {
              const isPassed = skill.status === 'passed'

              return (
                <Paper key={skill.skillCode} withBorder radius="md" p="md">
                  <Box className={report.competencyRow}>
                    <Stack gap={4} className={report.competencyInfo}>
                      <Group gap="xs">
                        <Badge variant="outline" size="sm" ff="monospace">
                          {skill.skillCode}
                        </Badge>
                        <Text size="sm" fw={600}>
                          {skill.skillName}
                        </Text>
                      </Group>
                      {skill.techContext && skill.techContext.length > 0 && (
                        <Text size="xs" c="dimmed">
                          Ngữ cảnh: {skill.techContext.join(' • ')}
                        </Text>
                      )}
                    </Stack>

                    <Box className={report.competencyMeter}>
                      <SfiaSegmentMeter
                        demonstratedLevel={skill.demonstratedLevel}
                        targetLevel={skill.targetLevel}
                        skillName={skill.skillName}
                        sfiaLevels={sfiaLevels}
                      />
                    </Box>

                    <Box className={report.competencyStatus}>
                      <Stack gap={2} align="flex-end">
                        <Text size="xs" c="dimmed">
                          Kỳ vọng:{' '}
                          <Text
                            component="span"
                            fw={700}
                            c="var(--mantine-color-text)"
                          >
                            Level {skill.targetLevel}
                          </Text>
                        </Text>
                        <Text size="xs" c="dimmed">
                          Thể hiện:{' '}
                          <Text
                            component="span"
                            fw={700}
                            c={isPassed ? 'success' : 'warning'}
                          >
                            {skill.demonstratedLevel > 0
                              ? `Level ${skill.demonstratedLevel}`
                              : 'Chưa thể hiện (Level 0)'}
                          </Text>
                        </Text>
                      </Stack>

                      <Badge
                        color={isPassed ? 'success' : 'warning'}
                        variant="light"
                        size="sm"
                      >
                        {isPassed ? 'Đạt chuẩn' : 'Có khoảng cách'}
                      </Badge>
                    </Box>
                  </Box>
                </Paper>
              )
            })}
          </Stack>
        </Table.ScrollContainer>
      </Stack>
    </Card>
  )
}

export default SfiaCompetencyOverview
