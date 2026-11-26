'use client'

import Link from 'next/link'
import {
  Avatar,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import {
  formatVietnamDateTime,
  formatVietnamRelativeDate,
} from '@/lib/date-time'
import {
  getUserDisplayName,
  getUserInitials,
} from '@/components/admin/user-metrics'
import type { AdminUser } from '@/types'

interface RecentUsersTableProps {
  users: AdminUser[]
}

export function RecentUsersTable({ users }: Readonly<RecentUsersTableProps>) {
  return (
    <Paper withBorder p="lg" radius="md" h="100%">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={2}>
            <Title order={2} size="h4">
              Người dùng mới đăng ký
            </Title>
            <Text size="xs" c="dimmed">
              5 tài khoản vừa tham gia gần nhất trên nền tảng
            </Text>
          </Stack>
          <Button
            component={Link}
            href="/admin/users"
            variant="subtle"
            size="xs"
            rightSection={<IconArrowRight size={14} stroke={1.5} />}
          >
            Xem tất cả
          </Button>
        </Group>

        {users.length === 0 ? (
          <Text size="sm" c="dimmed" py="md">
            Chưa có người dùng nào đăng ký trong hệ thống.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={560}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Người dùng</Table.Th>
                  <Table.Th>Vai trò</Table.Th>
                  <Table.Th>Trạng thái</Table.Th>
                  <Table.Th ta="right">Ngày tham gia</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((user) => {
                  const displayName = getUserDisplayName(user)
                  return (
                    <Table.Tr key={user.id}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar
                            color="brand"
                            radius="xl"
                            size="sm"
                            aria-hidden="true"
                          >
                            {getUserInitials(user)}
                          </Avatar>
                          <Stack gap={0}>
                            <Text size="sm" fw={500} lineClamp={1}>
                              {displayName}
                            </Text>
                            {displayName !== user.email ? (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {user.email}
                              </Text>
                            ) : null}
                          </Stack>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={user.role === 'admin' ? 'brand' : 'neutral'}
                          variant="light"
                          size="sm"
                        >
                          {user.role === 'admin' ? 'Quản trị viên' : 'Ứng viên'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            user.status === 'active' ? 'success' : 'danger'
                          }
                          variant="light"
                          size="sm"
                        >
                          {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Tooltip
                          label={formatVietnamDateTime(user.createdAt)}
                          withArrow
                        >
                          <Text span size="xs" c="dimmed">
                            {formatVietnamRelativeDate(user.createdAt)}
                          </Text>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Stack>
    </Paper>
  )
}
