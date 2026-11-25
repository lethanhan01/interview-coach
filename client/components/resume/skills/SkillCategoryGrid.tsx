'use client'

import { ActionIcon, Badge, Group, Paper, Stack, Text } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import ProfileEmptyState from '@/components/profile/primitives/ProfileEmptyState'
import type { TechnicalSkillEntry } from '@/types'

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
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">
            Danh sách công nghệ &amp; kỹ năng
          </Text>
          <Text size="xs" c="dimmed">
            {items.length} kỹ năng
          </Text>
        </Group>

        {items.length === 0 ? (
          <ProfileEmptyState message="Chưa thêm kỹ năng nào" />
        ) : (
          <Group gap="xs" wrap="wrap">
            {items.map((item) => (
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
}
