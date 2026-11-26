'use client'

import Link from 'next/link'
import {
  Anchor,
  Badge,
  Group,
  Paper,
  Progress,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import type { SfiaOnetMappingItem } from '@/types'
import { getSfiaLevelSemanticTheme } from '../sfia-theme'

export interface SfiaOnetMappingRowProps {
  mapping: SfiaOnetMappingItem
}

export function SfiaOnetMappingRow({
  mapping,
}: Readonly<SfiaOnetMappingRowProps>) {
  const levelTheme = getSfiaLevelSemanticTheme(mapping.targetLevel)
  const weightProgress = Math.min(100, Math.round((mapping.weight / 5) * 100))

  return (
    <Table.Tr>
      <Table.Td w={120}>
        <Text ff="monospace" fw={700} size="sm" c="brand">
          {mapping.socCode}
        </Text>
      </Table.Td>

      <Table.Td miw={200}>
        <Text size="sm" fw={500}>
          {mapping.occupationTitle}
        </Text>
      </Table.Td>

      <Table.Td w={100} ta="center">
        <Badge
          color={levelTheme.color}
          variant={levelTheme.badgeVariant}
          size="sm"
        >
          Cấp độ {mapping.targetLevel}
        </Badge>
      </Table.Td>

      <Table.Td w={140}>
        <Stack gap={2}>
          <Group justify="space-between" align="center">
            <Text size="sm" ff="monospace" fw={600}>
              x{mapping.weight.toFixed(1)}
            </Text>
            <Text size="xs" c="dimmed">
              {mapping.weight >= 2.0
                ? 'Rất cao'
                : mapping.weight >= 1.5
                  ? 'Cao'
                  : 'Tiêu chuẩn'}
            </Text>
          </Group>
          <Progress
            value={weightProgress}
            color={mapping.isCore ? 'brand' : 'neutral'}
            size="sm"
            radius="xl"
            aria-label={`Trọng số đánh giá x${mapping.weight.toFixed(1)}`}
          />
        </Stack>
      </Table.Td>

      <Table.Td w={100} ta="center">
        {mapping.isCore ? (
          <Badge color="success" variant="light" size="sm">
            Cốt lõi
          </Badge>
        ) : (
          <Badge color="neutral" variant="outline" size="sm">
            Bổ trợ
          </Badge>
        )}
      </Table.Td>

      <Table.Td w={88} ta="right">
        <Anchor
          component={Link}
          href={`/admin/onet?soc=${encodeURIComponent(mapping.socCode)}&detail=sfia`}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          c="brand"
        >
          <Group gap={4} justify="flex-end" wrap="nowrap">
            <Text size="sm">Chi tiết</Text>
            <IconExternalLink size={14} stroke={1.5} />
          </Group>
        </Anchor>
      </Table.Td>
    </Table.Tr>
  )
}

export function SfiaOnetMappingCard({
  mapping,
}: Readonly<SfiaOnetMappingRowProps>) {
  const levelTheme = getSfiaLevelSemanticTheme(mapping.targetLevel)

  return (
    <Paper withBorder p="xs" radius="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2} miw={0}>
            <Text ff="monospace" fw={700} size="sm" c="brand">
              {mapping.socCode}
            </Text>
            <Text size="sm" fw={600} truncate>
              {mapping.occupationTitle}
            </Text>
          </Stack>

          {mapping.isCore ? (
            <Badge color="success" variant="light" size="sm">
              Cốt lõi
            </Badge>
          ) : (
            <Badge color="neutral" variant="outline" size="sm">
              Bổ trợ
            </Badge>
          )}
        </Group>

        <Group justify="space-between" align="center">
          <Badge
            color={levelTheme.color}
            variant={levelTheme.badgeVariant}
            size="sm"
          >
            L{mapping.targetLevel}
          </Badge>

          <Text size="sm" c="dimmed">
            Trọng số:{' '}
            <Text span fw={700} c="inherit">
              x{mapping.weight.toFixed(1)}
            </Text>
          </Text>

          <Anchor
            component={Link}
            href={`/admin/onet?soc=${encodeURIComponent(mapping.socCode)}&detail=sfia`}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            c="brand"
          >
            <Group gap={2} wrap="nowrap">
              <Text size="sm">Xem</Text>
              <IconExternalLink size={14} stroke={1.5} />
            </Group>
          </Anchor>
        </Group>
      </Stack>
    </Paper>
  )
}
