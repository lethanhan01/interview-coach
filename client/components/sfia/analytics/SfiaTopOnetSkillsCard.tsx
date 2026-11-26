'use client'

import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconExternalLink, IconTrophy } from '@tabler/icons-react'
import { getSfiaCategorySemanticTheme } from '@/components/sfia/sfia-theme'
import interactions from '@/styles/interactions.module.css'
import surfaces from '@/styles/surfaces.module.css'
import typography from '@/styles/typography.module.css'
import type { SfiaTopOnetMappedSkill } from '@/types'
import sfia from '../sfia.module.css'

export interface SfiaTopOnetSkillsCardProps {
  topSkills: SfiaTopOnetMappedSkill[]
  onSelectSkill?: (skillCode: string) => void
}

function getRankColor(
  rank: number
): 'warning' | 'brand' | 'success' | 'neutral' {
  if (rank === 1) return 'warning'
  if (rank === 2) return 'brand'
  if (rank === 3) return 'success'
  return 'neutral'
}

export function SfiaTopOnetSkillsCard({
  topSkills,
  onSelectSkill,
}: Readonly<SfiaTopOnetSkillsCardProps>) {
  const maxOnetCount = Math.max(...topSkills.map((item) => item.onetCount), 1)

  return (
    <Paper withBorder p="sm" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
          <Group gap="xs" align="flex-start" wrap="nowrap">
            <ThemeIcon size="md" radius="md" variant="light" color="warning">
              <IconTrophy size={16} stroke={1.5} />
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={3} size="h4">
                Top 10 Kỹ Năng SFIA Phổ Biến Nhất trong O*NET
              </Title>
              <Text size="sm" c="dimmed">
                Xếp hạng theo số vị trí nghề nghiệp O*NET SOC đang tích hợp (Cốt
                lõi so với Bổ trợ)
              </Text>
            </Stack>
          </Group>

          <Group gap="xs">
            <Badge size="sm" variant="light" color="brand">
              Cốt lõi (Core)
            </Badge>
            <Badge size="sm" variant="light" color="neutral">
              Bổ trợ
            </Badge>
          </Group>
        </Group>

        {topSkills.length === 0 ? (
          <Paper p="sm" radius="md" className={surfaces.subtleSurface}>
            <Text size="sm" c="dimmed" ta="center">
              Chưa có dữ liệu xếp hạng kỹ năng SFIA gắn với O*NET.
            </Text>
          </Paper>
        ) : (
          <Stack gap={4}>
            {topSkills.map((item, index) => {
              const rank = index + 1
              const categoryTheme = getSfiaCategorySemanticTheme(
                item.categoryCode
              )
              const secondaryCount = Math.max(
                0,
                item.onetCount - item.coreCount
              )
              const corePct = Math.round((item.coreCount / maxOnetCount) * 100)
              const secondaryPct = Math.min(
                100 - corePct,
                Math.round((secondaryCount / maxOnetCount) * 100)
              )

              return (
                <Group
                  key={item.skillCode}
                  justify="space-between"
                  align="center"
                  gap="sm"
                  p="xs"
                  wrap="nowrap"
                  className={`${interactions.hoverRow} ${sfia.analyticsLeaderboardRow}`}
                >
                  <Group gap="sm" wrap="nowrap" miw={0} flex={1}>
                    <Badge
                      size="sm"
                      circle
                      variant={rank <= 3 ? 'filled' : 'light'}
                      color={getRankColor(rank)}
                      className={typography.tabularNums}
                    >
                      {rank}
                    </Badge>

                    <Stack gap={4} miw={0} flex={1}>
                      <Group gap="xs" wrap="wrap">
                        <Text size="sm" fw={700} ff="monospace">
                          {item.skillCode}
                        </Text>
                        <Badge
                          size="sm"
                          color={categoryTheme.color}
                          variant={categoryTheme.badgeVariant}
                        >
                          {item.categoryCode}
                        </Badge>
                        <Text size="sm" c="dimmed" truncate>
                          {item.skillName}
                        </Text>
                      </Group>

                      <Progress.Root size="sm" radius="xl">
                        <Tooltip
                          label={`Cốt lõi: ${item.coreCount} nghề`}
                          withArrow
                        >
                          <Progress.Section
                            value={corePct}
                            color="brand"
                            aria-label={`${item.skillCode} cốt lõi: ${item.coreCount} nghề`}
                          />
                        </Tooltip>
                        <Tooltip
                          label={`Bổ trợ: ${secondaryCount} nghề`}
                          withArrow
                        >
                          <Progress.Section
                            value={secondaryPct}
                            color="neutral"
                            aria-label={`${item.skillCode} bổ trợ: ${secondaryCount} nghề`}
                          />
                        </Tooltip>
                      </Progress.Root>
                    </Stack>
                  </Group>

                  <Group gap="sm" wrap="nowrap">
                    <Stack gap={0} align="flex-end">
                      <Text
                        size="sm"
                        fw={700}
                        c="brand"
                        className={typography.tabularNums}
                      >
                        {item.onetCount} nghề
                      </Text>
                      <Text
                        size="xs"
                        c="dimmed"
                        className={typography.tabularNums}
                      >
                        {item.coreCount} cốt lõi
                      </Text>
                    </Stack>

                    <Badge
                      size="sm"
                      variant="light"
                      color="success"
                      visibleFrom="sm"
                      className={typography.tabularNums}
                    >
                      {item.questionCount} câu hỏi
                    </Badge>

                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="neutral"
                      aria-label={`Xem chi tiết ${item.skillCode}`}
                      title={`Mở chi tiết kỹ năng ${item.skillCode} trong Cây kỹ năng`}
                      onClick={() => onSelectSkill?.(item.skillCode)}
                    >
                      <IconExternalLink size={15} stroke={1.5} />
                    </ActionIcon>
                  </Group>
                </Group>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
