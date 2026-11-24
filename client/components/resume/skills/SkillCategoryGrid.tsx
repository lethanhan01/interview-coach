'use client'

import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import ProfileEmptyState from '@/components/profile/primitives/ProfileEmptyState'
import type { TechnicalSkillEntry } from '@/types'
import { TECH_CATEGORIES } from '@/components/resume/constants'

export interface SkillCategoryGridProps {
  items: TechnicalSkillEntry[]
  isEditing: boolean
  onRemove: (id: string) => void
}

export default function SkillCategoryGrid({
  items,
  isEditing,
  onRemove,
}: Readonly<SkillCategoryGridProps>) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      {TECH_CATEGORIES.map(({ key, label }) => {
        const groupItems = items.filter((item) => item.category === key)
        return (
          <Paper key={key} withBorder radius="md" p="md">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                  {label}
                </Text>
                <Text size="xs" c="dimmed">
                  {groupItems.length} kỹ năng
                </Text>
              </Group>

              {groupItems.length === 0 ? (
                <ProfileEmptyState message="Chưa thêm" />
              ) : (
                <Group gap={6} wrap="wrap">
                  {groupItems.map((item) => (
                    <Badge
                      key={item.id}
                      variant="light"
                      color="brand"
                      size="md"
                      rightSection={
                        isEditing ? (
                          <ActionIcon
                            size="xs"
                            variant="transparent"
                            color="brand"
                            aria-label={`Xóa kỹ năng ${item.name}`}
                            onClick={() => onRemove(item.id)}
                          >
                            <IconX size={12} stroke={1.5} aria-hidden="true" />
                          </ActionIcon>
                        ) : undefined
                      }
                    >
                      {item.name} · {item.usagePeriod}th
                    </Badge>
                  ))}
                </Group>
              )}
            </Stack>
          </Paper>
        )
      })}
    </SimpleGrid>
  )
}
