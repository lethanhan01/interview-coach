'use client'

import {
  ActionIcon,
  Badge,
  Button,
  Chip,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconPlus, IconRotate, IconSearch, IconX } from '@tabler/icons-react'

export interface OnetSfiaSummaryBarProps {
  totalCount: number
  filteredCount: number
  coreCount: number
  secondaryCount: number
  searchQuery: string
  onSearchChange: (q: string) => void
  activeFilter: 'all' | 'core' | 'secondary'
  onFilterChange: (f: 'all' | 'core' | 'secondary') => void
  onOpenAddModal: () => void
  onOpenResetModal: () => void
  isMutating?: boolean
}

export function OnetSfiaSummaryBar({
  totalCount,
  filteredCount,
  coreCount,
  secondaryCount,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onOpenAddModal,
  onOpenResetModal,
  isMutating = false,
}: Readonly<OnetSfiaSummaryBarProps>) {
  return (
    <Paper withBorder p="sm" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="xs">
            <Title order={2} size="h6">
              Danh sách Ánh xạ Kỹ năng SFIA 9
            </Title>
            <Badge color="neutral" variant="outline" size="xs">
              {totalCount} kỹ năng
            </Badge>
          </Group>

          <Group gap="xs">
            <Button
              size="xs"
              variant="outline"
              color="danger"
              leftSection={<IconRotate size={14} stroke={1.5} />}
              onClick={onOpenResetModal}
              disabled={isMutating}
            >
              Khôi phục Mẫu
            </Button>

            <Button
              size="xs"
              color="brand"
              leftSection={<IconPlus size={14} stroke={1.5} />}
              onClick={onOpenAddModal}
              disabled={isMutating}
            >
              Thêm ánh xạ
            </Button>
          </Group>
        </Group>

        <Group justify="space-between" align="center" wrap="wrap">
          <TextInput
            size="xs"
            flex={1}
            miw={220}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            placeholder="Tìm kiếm mã hoặc tên kỹ năng SFIA..."
            aria-label="Tìm kiếm kỹ năng SFIA"
            leftSection={<IconSearch size={14} stroke={1.5} />}
            rightSection={
              searchQuery ? (
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="neutral"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => onSearchChange('')}
                >
                  <IconX size={12} stroke={1.5} />
                </ActionIcon>
              ) : null
            }
          />

          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Hiển thị {filteredCount} / {totalCount}
            </Text>

            <Chip.Group
              multiple={false}
              value={activeFilter}
              onChange={(val) =>
                onFilterChange((val as 'all' | 'core' | 'secondary') || 'all')
              }
            >
              <Group gap="xs">
                <Chip value="all" size="xs" variant="outline">
                  Tất cả ({totalCount})
                </Chip>
                <Chip value="core" size="xs" variant="outline" color="brand">
                  Cốt lõi ({coreCount})
                </Chip>
                <Chip
                  value="secondary"
                  size="xs"
                  variant="outline"
                  color="neutral"
                >
                  Bổ trợ ({secondaryCount})
                </Chip>
              </Group>
            </Chip.Group>
          </Group>
        </Group>
      </Stack>
    </Paper>
  )
}
