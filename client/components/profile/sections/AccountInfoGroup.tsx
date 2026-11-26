'use client'

import { Badge, Group, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core'
import {
  IconCalendar,
  IconMail,
  IconShieldCheck,
  IconUserCheck,
} from '@tabler/icons-react'
import { formatVietnamDateTime } from '@/lib/date-time'
import type { SemanticColor } from '@/theme'
import ProfileSection from '@/components/profile/primitives/ProfileSection'

export interface AccountInfoGroupProps {
  email?: string
  role?: string
  status?: string
  createdAt?: string
}

interface StatusPresentation {
  label: string
  color: SemanticColor
}

function getStatusPresentation(status: string): StatusPresentation {
  switch (status) {
    case 'active':
      return { label: 'Đang hoạt động', color: 'success' }
    case 'password_reset_required':
      return { label: 'Cần đặt lại mật khẩu', color: 'warning' }
    case 'locked':
      return { label: 'Tạm khóa', color: 'danger' }
    case 'deleted':
      return { label: 'Đã xóa', color: 'danger' }
    default:
      return { label: status, color: 'neutral' }
  }
}

function formatCreatedAt(iso?: string): string {
  if (!iso) return 'Chưa cập nhật'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return 'Chưa cập nhật'
  return formatVietnamDateTime(iso)
}

export default function AccountInfoGroup({
  email,
  role = 'candidate',
  status = 'active',
  createdAt,
}: Readonly<AccountInfoGroupProps>) {
  const isAdmin = role === 'admin'
  const roleLabel = isAdmin ? 'Quản trị viên' : 'Ứng viên'
  const statusMeta = getStatusPresentation(status)
  const createdAtLabel = formatCreatedAt(createdAt)

  return (
    <ProfileSection title="Thông tin tài khoản">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Stack gap={4}>
          <Group gap={6} wrap="nowrap">
            <ThemeIcon color="brand" variant="transparent" size="xs">
              <IconMail size={14} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
            <Text size="xs" c="dimmed" fw={500} tt="uppercase">
              Email đăng nhập
            </Text>
          </Group>
          <Text size="sm" fw={500}>
            {email || 'Chưa cập nhật'}
          </Text>
        </Stack>

        <Stack gap={4}>
          <Group gap={6} wrap="nowrap">
            <ThemeIcon color="brand" variant="transparent" size="xs">
              <IconUserCheck size={14} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
            <Text size="xs" c="dimmed" fw={500} tt="uppercase">
              Vai trò hệ thống
            </Text>
          </Group>
          <Group>
            <Badge color={isAdmin ? 'brand' : 'neutral'} variant="light">
              {roleLabel}
            </Badge>
          </Group>
        </Stack>

        <Stack gap={4}>
          <Group gap={6} wrap="nowrap">
            <ThemeIcon color={statusMeta.color} variant="transparent" size="xs">
              <IconShieldCheck size={14} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
            <Text size="xs" c="dimmed" fw={500} tt="uppercase">
              Trạng thái tài khoản
            </Text>
          </Group>
          <Group>
            <Badge color={statusMeta.color} variant="light">
              {statusMeta.label}
            </Badge>
          </Group>
        </Stack>

        <Stack gap={4}>
          <Group gap={6} wrap="nowrap">
            <ThemeIcon color="neutral" variant="transparent" size="xs">
              <IconCalendar size={14} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
            <Text size="xs" c="dimmed" fw={500} tt="uppercase">
              Ngày tạo tài khoản
            </Text>
          </Group>
          <Text size="sm" fw={500}>
            {createdAtLabel}
          </Text>
        </Stack>
      </SimpleGrid>
    </ProfileSection>
  )
}
