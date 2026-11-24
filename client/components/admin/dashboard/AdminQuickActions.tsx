'use client'

import Link from 'next/link'
import {
  Badge,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core'
import {
  IconArrowRight,
  IconBook,
  IconNetwork,
  IconSparkles,
  IconUserCog,
  IconUsers,
} from '@tabler/icons-react'
import type { SemanticColor } from '@/theme'
import surfaces from '@/styles/surfaces.module.css'
import classes from './AdminQuickActions.module.css'

interface QuickActionItem {
  href: string
  title: string
  description: string
  color: SemanticColor
  icon: typeof IconUsers
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    href: '/admin/users',
    title: 'Quản lý người dùng',
    description: 'Khóa, mở khóa và kiểm soát tài khoản',
    color: 'brand',
    icon: IconUsers,
  },
  {
    href: '/admin/onet',
    title: 'Trình duyệt O*NET',
    description: 'Quản trị nghề nghiệp & ánh xạ SFIA',
    color: 'success',
    icon: IconBook,
  },
  {
    href: '/admin/sfia',
    title: 'Khung năng lực SFIA 9',
    description: 'Ma trận kỹ năng & ngân hàng câu hỏi',
    color: 'warning',
    icon: IconNetwork,
  },
  {
    href: '/admin/profile',
    title: 'Hồ sơ quản trị',
    description: 'Cập nhật thông tin & bảo mật tài khoản',
    color: 'neutral',
    icon: IconUserCog,
  },
]

export function AdminQuickActions() {
  return (
    <Stack gap="md" h="100%">
      <Paper withBorder p="lg" radius="md">
        <Stack gap="sm">
          <Stack gap={2}>
            <Title order={2} size="h4">
              Thao tác nhanh
            </Title>
            <Text size="xs" c="dimmed">
              Truy cập nhanh các phân hệ quản trị trọng yếu
            </Text>
          </Stack>

          <Stack gap="xs">
            {QUICK_ACTIONS.map((item) => {
              const Icon = item.icon
              return (
                <UnstyledButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                  className={classes.actionLink}
                >
                  <Group justify="space-between" wrap="nowrap" gap="sm">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon
                        color={item.color}
                        variant="light"
                        size="md"
                        radius="md"
                      >
                        <Icon size={16} stroke={1.5} aria-hidden="true" />
                      </ThemeIcon>
                      <Stack gap={0}>
                        <Text size="sm" fw={600}>
                          {item.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {item.description}
                        </Text>
                      </Stack>
                    </Group>
                    <IconArrowRight size={16} stroke={1.5} aria-hidden="true" />
                  </Group>
                </UnstyledButton>
              )
            })}
          </Stack>
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md" className={surfaces.subtleSurface}>
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <ThemeIcon color="brand" variant="light" size="sm" radius="md">
                <IconSparkles size={14} stroke={1.5} aria-hidden="true" />
              </ThemeIcon>
              <Text size="sm" fw={600}>
                AI Session Engine
              </Text>
            </Group>
            <Badge color="success" variant="dot" size="xs">
              Sẵn sàng
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            Hệ thống phỏng vấn AI, đối chiếu O*NET 29.1 và đánh giá năng lực
            SFIA 9 đang vận hành ổn định.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  )
}
