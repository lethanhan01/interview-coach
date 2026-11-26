'use client'

import {
  Alert,
  Button,
  Group,
  Skeleton,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { CatalogSfiaLevelOption } from '@/types'

export interface SfiaLevelsTableProps {
  sfiaLevels?: readonly CatalogSfiaLevelOption[]
  isPending?: boolean
  isError?: boolean
  onRetry?: () => void
}

const SKELETON_ROWS = [1, 2, 3, 4]

export function SfiaLevelsTable({
  sfiaLevels,
  isPending = false,
  isError = false,
  onRetry,
}: Readonly<SfiaLevelsTableProps>) {
  if (isError) {
    return (
      <Alert
        color="danger"
        variant="light"
        icon={<IconAlertTriangle size={16} stroke={1.5} aria-hidden="true" />}
        title="Không thể tải thang cấp độ SFIA"
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Text size="xs">
            Không thể tải danh mục cấp độ SFIA từ hệ thống. Vui lòng thử lại.
          </Text>
          {onRetry ? (
            <Button size="xs" variant="light" color="danger" onClick={onRetry}>
              Thử lại
            </Button>
          ) : null}
        </Group>
      </Alert>
    )
  }

  if (isPending && (!sfiaLevels || sfiaLevels.length === 0)) {
    return (
      <Stack gap="xs" aria-label="Đang tải thang cấp độ SFIA">
        {SKELETON_ROWS.map((row) => (
          <Skeleton key={row} height={28} radius="sm" />
        ))}
      </Stack>
    )
  }

  const levels = sfiaLevels ?? []
  if (levels.length === 0) {
    return null
  }

  return (
    <Table.ScrollContainer minWidth={480}>
      <Table withTableBorder withColumnBorders fz="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={90}>Cấp độ</Table.Th>
            <Table.Th w={180}>Tên SFIA</Table.Th>
            <Table.Th>Mô tả hành vi chuẩn hóa</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {levels.map((row) => (
            <Table.Tr key={row.levelId}>
              <Table.Td fw={700}>Level {row.levelId}</Table.Td>
              <Table.Td fw={500}>
                {row.nameVi ? `${row.name} (${row.nameVi})` : row.name}
              </Table.Td>
              <Table.Td c="dimmed">{row.essence || row.description}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

export default SfiaLevelsTable
