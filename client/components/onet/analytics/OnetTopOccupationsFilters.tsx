'use client'

import {
  ActionIcon,
  Badge,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconSearch, IconX } from '@tabler/icons-react'

export type TopOccupationsSort =
  | 'mock_desc'
  | 'jd_desc'
  | 'mapping_desc'
  | 'title_asc'

interface OnetTopOccupationsFiltersProps {
  totalCount: number
  searchQuery: string
  onSearchChange: (value: string) => void
  sortBy: TopOccupationsSort
  onSortChange: (value: TopOccupationsSort) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  activeGroupFilter: string | null
  activeGroupName?: string
  onClearGroupFilter?: () => void
}

export function OnetTopOccupationsFilters({
  totalCount,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  pageSize,
  onPageSizeChange,
  activeGroupFilter,
  activeGroupName,
  onClearGroupFilter,
}: Readonly<OnetTopOccupationsFiltersProps>) {
  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Group gap="xs" align="center" wrap="wrap">
          <Title order={2} size="h5">
            Top nghề nghiệp được quan tâm nhất
          </Title>
          <Badge color="neutral" variant="light" size="xs">
            {totalCount} nghề
          </Badge>
          {activeGroupFilter ? (
            <Badge
              color="brand"
              variant="light"
              size="xs"
              rightSection={
                onClearGroupFilter ? (
                  <ActionIcon
                    size="xs"
                    variant="transparent"
                    color="brand"
                    aria-label="Bỏ lọc nhóm SOC trên bảng Top nghề nghiệp"
                    onClick={onClearGroupFilter}
                  >
                    <IconX size={12} stroke={1.5} />
                  </ActionIcon>
                ) : null
              }
            >
              Nhóm {activeGroupFilter}
              {activeGroupName ? ` — ${activeGroupName}` : ''}
            </Badge>
          ) : null}
        </Group>
        <Text size="xs" c="dimmed">
          Bấm mã kỹ năng SFIA để mở thẳng sang Khung năng lực SFIA 9
        </Text>
      </Group>

      <Group justify="space-between" align="center" gap="xs" wrap="wrap">
        <TextInput
          size="xs"
          w={{ base: '100%', sm: 260 }}
          placeholder="Tìm theo mã SOC, tên nghề..."
          aria-label="Tìm trong bảng Top nghề nghiệp"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          leftSection={<IconSearch size={14} stroke={1.5} />}
          rightSection={
            searchQuery ? (
              <ActionIcon
                size="xs"
                variant="subtle"
                color="neutral"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={() => onSearchChange('')}
              >
                <IconX size={12} stroke={1.5} />
              </ActionIcon>
            ) : null
          }
        />

        <Group gap="xs" wrap="wrap">
          <Select
            size="xs"
            w={175}
            aria-label="Sắp xếp Top nghề nghiệp"
            value={sortBy}
            allowDeselect={false}
            onChange={(val) =>
              onSortChange((val as TopOccupationsSort | null) ?? 'mock_desc')
            }
            data={[
              { value: 'mock_desc', label: 'Nhiều phỏng vấn nhất' },
              { value: 'jd_desc', label: 'Nhiều JD nhất' },
              { value: 'mapping_desc', label: 'Nhiều ánh xạ SFIA nhất' },
              { value: 'title_asc', label: 'Tên nghề (A → Z)' },
            ]}
          />

          <Select
            size="xs"
            w={110}
            aria-label="Số dòng mỗi trang"
            value={String(pageSize)}
            allowDeselect={false}
            onChange={(val) => onPageSizeChange(Number(val) || 5)}
            data={[
              { value: '5', label: '5 / trang' },
              { value: '10', label: '10 / trang' },
              { value: '20', label: '20 / trang' },
            ]}
          />
        </Group>
      </Group>
    </Stack>
  )
}
