import {
  Badge,
  Card,
  Group,
  List,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Timeline,
} from '@mantine/core'
import {
  IconBook,
  IconCircleCheck,
  IconClock,
  IconCompass,
} from '@tabler/icons-react'
import type { ActionPlanItem } from '@/types'

export interface ActionPlanTimelineProps {
  actionPlan?:
    | {
        items?: string[]
        actionPlan?: ActionPlanItem[]
      }
    | ActionPlanItem[]
    | string[]
    | null
  className?: string
}

const PRIORITY_CONFIG: Record<
  ActionPlanItem['priority'],
  { label: string; color: 'danger' | 'warning' | 'brand' }
> = {
  high: { label: 'Ưu tiên cao', color: 'danger' },
  medium: { label: 'Ưu tiên trung bình', color: 'warning' },
  low: { label: 'Ưu tiên thấp', color: 'brand' },
}

export function ActionPlanTimeline({
  actionPlan,
  className,
}: Readonly<ActionPlanTimelineProps>) {
  if (!actionPlan) {
    return null
  }

  let structuredItems: ActionPlanItem[] = []
  let legacyItems: string[] = []

  if (Array.isArray(actionPlan)) {
    if (actionPlan.length > 0 && typeof actionPlan[0] === 'string') {
      legacyItems = actionPlan as string[]
    } else {
      structuredItems = actionPlan as ActionPlanItem[]
    }
  } else if (typeof actionPlan === 'object') {
    if (actionPlan.actionPlan && Array.isArray(actionPlan.actionPlan)) {
      structuredItems = actionPlan.actionPlan
    } else if (actionPlan.items && Array.isArray(actionPlan.items)) {
      legacyItems = actionPlan.items
    }
  }

  if (structuredItems.length === 0 && legacyItems.length === 0) {
    return null
  }

  const totalEstimatedWeeks = structuredItems.reduce(
    (sum, item) => sum + (item.estimatedWeeks || 0),
    0
  )

  return (
    <Card withBorder radius="md" p="lg" className={className}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon size={36} radius="md" color="brand" variant="light">
              <IconCompass size={20} aria-hidden="true" />
            </ThemeIcon>
            <Stack gap={2}>
              <Text size="lg" fw={700}>
                Kế Hoạch Hành Động & Lộ Trình Ôn Tập (Action Plan)
              </Text>
              <Text size="xs" c="dimmed">
                Lộ trình phát triển kỹ năng được cá nhân hóa dựa trên kết quả
                phỏng vấn
              </Text>
            </Stack>
          </Group>

          {totalEstimatedWeeks > 0 && (
            <Badge
              variant="light"
              color="neutral"
              size="lg"
              leftSection={<IconClock size={14} aria-hidden="true" />}
            >
              Tổng thời gian ước tính: ~{totalEstimatedWeeks} tuần
            </Badge>
          )}
        </Group>

        {structuredItems.length > 0 && (
          <Timeline
            active={structuredItems.length}
            bulletSize={28}
            lineWidth={2}
          >
            {structuredItems.map((item, index) => {
              const priority =
                PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium

              return (
                <Timeline.Item
                  key={`${item.skillCode}-${index}`}
                  bullet={
                    <ThemeIcon size={24} radius="xl" color={priority.color}>
                      <IconCompass size={14} aria-hidden="true" />
                    </ThemeIcon>
                  }
                  title={
                    <Group
                      justify="space-between"
                      align="center"
                      wrap="wrap"
                      mb="xs"
                    >
                      <Group gap="xs">
                        <Badge color={priority.color} size="sm">
                          {priority.label}
                        </Badge>
                        <Badge variant="outline" size="sm" ff="monospace">
                          {item.skillCode}
                        </Badge>
                      </Group>
                      <Group gap={4}>
                        <IconClock size={14} aria-hidden="true" />
                        <Text size="xs" c="dimmed">
                          Thời gian:{' '}
                          <Text
                            component="span"
                            fw={700}
                            c="var(--mantine-color-text)"
                          >
                            {item.estimatedWeeks} tuần
                          </Text>
                        </Text>
                      </Group>
                    </Group>
                  }
                >
                  <Paper withBorder radius="md" p="md" mt="xs">
                    <Stack gap="xs">
                      <Text size="sm" fw={700}>
                        {item.title}
                      </Text>

                      {item.topics && item.topics.length > 0 && (
                        <Stack gap={4}>
                          <Text size="xs" fw={500} c="dimmed" tt="uppercase">
                            Chủ đề trọng tâm cần củng cố:
                          </Text>
                          <Group gap="xs" wrap="wrap">
                            {item.topics.map((topic) => (
                              <Badge
                                key={topic}
                                variant="light"
                                color="neutral"
                                size="sm"
                                leftSection={
                                  <IconBook size={12} aria-hidden="true" />
                                }
                              >
                                {topic}
                              </Badge>
                            ))}
                          </Group>
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                </Timeline.Item>
              )
            })}
          </Timeline>
        )}

        {legacyItems.length > 0 && structuredItems.length === 0 && (
          <List
            spacing="sm"
            size="sm"
            center
            icon={
              <ThemeIcon color="brand" size={20} radius="xl">
                <IconCircleCheck size={14} aria-hidden="true" />
              </ThemeIcon>
            }
          >
            {legacyItems.map((item, index) => (
              <List.Item key={index}>{item}</List.Item>
            ))}
          </List>
        )}
      </Stack>
    </Card>
  )
}

export default ActionPlanTimeline
