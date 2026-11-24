'use client'

import {
  Badge,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import type { SfiaGenericAttribute } from '@/types'
import { getSfiaAttributeSemanticTheme } from '@/components/sfia/sfia-theme'
import surfaces from '@/styles/surfaces.module.css'

export interface SfiaLevelAttributeCardProps {
  attribute: SfiaGenericAttribute
  selectedLevel: number
}

export function SfiaLevelAttributeCard({
  attribute,
  selectedLevel,
}: Readonly<SfiaLevelAttributeCardProps>) {
  const theme = getSfiaAttributeSemanticTheme(attribute.code)
  const Icon = theme.icon
  const statement =
    attribute.levels[selectedLevel] || 'Chưa có mô tả cho cấp độ này.'

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm" h="100%" justify="space-between">
        <Stack gap="xs">
          <Group
            justify="space-between"
            align="flex-start"
            gap="xs"
            wrap="nowrap"
          >
            <Group gap="xs" align="center" wrap="nowrap">
              <ThemeIcon
                color={theme.color}
                variant="light"
                size="md"
                radius="md"
              >
                <Icon size={16} stroke={1.5} />
              </ThemeIcon>
              <Stack gap={0}>
                <Title order={4} fz="sm" fw={700}>
                  {attribute.nameVi || attribute.name}
                </Title>
                {attribute.nameVi && attribute.name !== attribute.nameVi && (
                  <Text size="xs" c="dimmed">
                    {attribute.name}
                  </Text>
                )}
              </Stack>
            </Group>
            <Badge
              color={theme.color}
              variant={theme.badgeVariant}
              size="xs"
              flex="0 0 auto"
            >
              {attribute.code}
            </Badge>
          </Group>

          <Text size="xs" c="dimmed" lh={1.5}>
            {attribute.description}
          </Text>
        </Stack>

        <Paper withBorder p="sm" radius="sm" className={surfaces.subtleSurface}>
          <Stack gap={6}>
            <Group justify="space-between" align="center" gap="xs">
              <Text size="xs" fw={700} c={theme.color}>
                Tiêu chuẩn Cấp độ {selectedLevel}
              </Text>
              <Badge color={theme.color} variant="light" size="xs">
                L{selectedLevel}
              </Badge>
            </Group>
            <Text size="xs" lh={1.6}>
              {statement}
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  )
}
