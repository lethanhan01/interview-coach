'use client'

import {
  Badge,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconAward,
  IconCode,
  IconFolderRoot,
  IconLayersLinked,
} from '@tabler/icons-react'

interface PillarItem {
  id: string
  pillarNumber: number
  badgeCount: string
  color: 'brand' | 'success' | 'warning' | 'danger'
  title: string
  description: string
  example: string
  icon: typeof IconLayersLinked
}

const PILLARS: PillarItem[] = [
  {
    id: 'categories',
    pillarNumber: 1,
    badgeCount: '6 Danh mục',
    color: 'brand',
    title: 'Danh mục nghiệp vụ',
    description:
      'Các miền nghiệp vụ cấp cao: Chiến lược & Kiến trúc, Thay đổi & Chuyển đổi, Phát triển & Triển khai, Vận hành, Con người, Quan hệ đối tác.',
    example: 'STRAT_ARCH • DEV_IMPL...',
    icon: IconLayersLinked,
  },
  {
    id: 'subcategories',
    pillarNumber: 2,
    badgeCount: '22 Phân nhóm',
    color: 'success',
    title: 'Nhóm chuyên môn',
    description:
      'Nhóm năng lực chuyên sâu: Phát triển hệ thống, Dữ liệu & Phân tích, An toàn thông tin, Thiết kế trải nghiệm người dùng, Quản trị dự án.',
    example: 'SYS_DEV • DATA_ANA...',
    icon: IconFolderRoot,
  },
  {
    id: 'skills',
    pillarNumber: 3,
    badgeCount: '147 Kỹ năng',
    color: 'brand',
    title: 'Kỹ năng thực hành',
    description:
      'Chuẩn mã 4 ký tự quốc tế (PROG, SWDN, DBDS). Mỗi kỹ năng xác định dải cấp độ áp dụng cụ thể (min_level..max_level).',
    example: 'PROG (L2–L6) • ARCH (L5–L7)',
    icon: IconCode,
  },
  {
    id: 'levels',
    pillarNumber: 4,
    badgeCount: '7 Cấp độ',
    color: 'warning',
    title: 'Cấp độ trách nhiệm',
    description:
      'Từ Cấp độ 1 (Tuân thủ & Thực thi cơ bản) đến Cấp độ 7 (Định hình chiến lược), neo chuẩn hóa qua 5 thuộc tính chung cốt lõi.',
    example: 'Cấp độ 1 ➔ Cấp độ 7',
    icon: IconAward,
  },
]

export function SfiaAnatomyDiagram() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
      {PILLARS.map((p) => {
        const IconComponent = p.icon
        return (
          <Paper
            key={p.id}
            withBorder
            p="sm"
            radius="md"
            bg="var(--mantine-color-body)"
          >
            <Stack justify="space-between" h="100%" gap="xs">
              <Stack gap={6}>
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Badge
                    color={p.color}
                    variant="light"
                    size="xs"
                    leftSection={<IconComponent size={12} stroke={1.5} />}
                  >
                    Trụ cột {p.pillarNumber}
                  </Badge>
                  <Badge color={p.color} variant="outline" size="xs">
                    {p.badgeCount}
                  </Badge>
                </Group>

                <Text fw={700} size="xs">
                  {p.title}
                </Text>

                <Text size="xs" c="dimmed" lh={1.4}>
                  {p.description}
                </Text>
              </Stack>

              <Stack gap={4}>
                <Divider />
                <Text size="xs" c="dimmed" ff="monospace" fz={10}>
                  {p.example}
                </Text>
              </Stack>
            </Stack>
          </Paper>
        )
      })}
    </SimpleGrid>
  )
}
