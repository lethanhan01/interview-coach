'use client'

import Link from 'next/link'
import {
  Badge,
  Button,
  Group,
  Progress,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import { IconArrowUpRight, IconCompass } from '@tabler/icons-react'
import typography from '@/styles/typography.module.css'
import type { OnetDetailSubTab, OnetTopOccupationItem } from '@/types'

interface OnetTopOccupationsTableProps {
  items: OnetTopOccupationItem[]
  startIndex: number
  onNavigateToExplorer: (socCode: string, subTab?: OnetDetailSubTab) => void
}

export function OnetTopOccupationsTable({
  items,
  startIndex,
  onNavigateToExplorer,
}: Readonly<OnetTopOccupationsTableProps>) {
  return (
    <Table.ScrollContainer minWidth={720}>
      <Table verticalSpacing="xs" fz="xs" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={56}>Hạng</Table.Th>
            <Table.Th>Nghề nghiệp O*NET</Table.Th>
            <Table.Th w={230}>Tỷ trọng Phỏng vấn / JD / SFIA</Table.Th>
            <Table.Th>Kỹ năng cốt lõi SFIA</Table.Th>
            <Table.Th ta="right" w={140}>
              Thao tác
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item, idx) => {
            const rank = startIndex + idx + 1
            const totalWeight =
              item.mockInterviewCount +
              item.jobDescriptionCount +
              item.mappingCount
            const interviewPct =
              totalWeight > 0
                ? (item.mockInterviewCount / totalWeight) * 100
                : 0
            const jdPct =
              totalWeight > 0
                ? (item.jobDescriptionCount / totalWeight) * 100
                : 0
            const mappingPct =
              totalWeight > 0 ? (item.mappingCount / totalWeight) * 100 : 0

            const uniqueCoreSkills = Array.from(new Set(item.coreSkillCodes))

            return (
              <Table.Tr key={item.socCode}>
                <Table.Td>
                  <Badge
                    color={rank <= 3 ? 'brand' : 'neutral'}
                    variant={rank === 1 ? 'filled' : 'light'}
                    size="xs"
                    className={typography.tabularNums}
                  >
                    #{rank}
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Stack gap={2}>
                    <Group gap={6} wrap="nowrap">
                      <Badge color="brand" variant="outline" size="xs">
                        {item.socCode}
                      </Badge>
                      <Text size="xs" fw={600} lineClamp={1}>
                        {item.title}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      Nhóm {item.majorGroupCode}: {item.majorGroupName}
                    </Text>
                  </Stack>
                </Table.Td>

                <Table.Td>
                  <Stack gap={4}>
                    <Progress.Root size="sm" radius="sm">
                      <Progress.Section
                        value={interviewPct}
                        color="brand"
                        aria-label={`Phỏng vấn: ${item.mockInterviewCount}`}
                      />
                      <Progress.Section
                        value={jdPct}
                        color="success"
                        aria-label={`JD: ${item.jobDescriptionCount}`}
                      />
                      <Progress.Section
                        value={mappingPct}
                        color="warning"
                        aria-label={`Ánh xạ SFIA: ${item.mappingCount}`}
                      />
                    </Progress.Root>
                    <Group gap={6} wrap="wrap" className={typography.tabularNums}>
                      <Text size="xs" c="brand">
                        PV: {item.mockInterviewCount}
                      </Text>
                      <Text size="xs" c="success">
                        JD: {item.jobDescriptionCount}
                      </Text>
                      <Text size="xs" c="warning">
                        SFIA: {item.mappingCount}
                      </Text>
                    </Group>
                  </Stack>
                </Table.Td>

                <Table.Td>
                  {uniqueCoreSkills.length === 0 ? (
                    <Text size="xs" c="dimmed">
                      Chưa gán
                    </Text>
                  ) : (
                    <Group gap={4} wrap="wrap">
                      {uniqueCoreSkills.slice(0, 4).map((code) => (
                        <Badge
                          key={code}
                          component={Link}
                          href={`/admin/sfia?skill=${encodeURIComponent(code)}`}
                          color="brand"
                          variant="light"
                          size="xs"
                          rightSection={
                            <IconArrowUpRight
                              size={10}
                              stroke={1.5}
                              aria-hidden="true"
                            />
                          }
                        >
                          {code}
                        </Badge>
                      ))}
                      {uniqueCoreSkills.length > 4 ? (
                        <Badge color="neutral" variant="light" size="xs">
                          +{uniqueCoreSkills.length - 4}
                        </Badge>
                      ) : null}
                    </Group>
                  )}
                </Table.Td>

                <Table.Td ta="right">
                  <Group gap={4} justify="flex-end" wrap="nowrap">
                    <Button
                      size="compact-xs"
                      variant="light"
                      color={item.isMapped ? 'success' : 'neutral'}
                      onClick={() => onNavigateToExplorer(item.socCode, 'sfia')}
                    >
                      SFIA ({item.mappingCount})
                    </Button>
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="brand"
                      leftSection={
                        <IconCompass size={12} stroke={1.5} aria-hidden="true" />
                      }
                      onClick={() =>
                        onNavigateToExplorer(item.socCode, 'overview')
                      }
                    >
                      Xem
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
