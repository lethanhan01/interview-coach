'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Badge,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconBook,
  IconRefresh,
  IconUsers,
} from '@tabler/icons-react'
import { useAuth } from '@/providers/AuthProvider'
import { userQueries } from '@/queries/user.queries'
import { AdminKpiGrid } from './AdminKpiGrid'
import { AdminQuickActions } from './AdminQuickActions'
import { computeUserMetrics } from '@/components/admin/user-metrics'
import { KnowledgeBaseHealthCard } from './KnowledgeBaseHealthCard'
import { RecentUsersTable } from './RecentUsersTable'
import { UserDistributionChart } from './UserDistributionChart'
import { UserRegistrationChart } from './UserRegistrationChart'

export function AdminDashboardClient() {
  const { role, isLoading: authLoading } = useAuth()
  const isAdmin = !authLoading && role === 'admin'

  const usersQuery = useQuery({
    ...userQueries.adminList(),
    enabled: isAdmin,
  })

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])
  const metrics = useMemo(() => computeUserMetrics(users), [users])

  if (!isAdmin) return null

  const usersErrorMessage =
    usersQuery.error instanceof Error
      ? usersQuery.error.message
      : usersQuery.error
        ? 'Không thể tải dữ liệu người dùng quản trị.'
        : null

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        {/* Hero Banner */}
        <Paper withBorder p="lg" radius="md">
          <Group justify="space-between" align="center" gap="md" wrap="wrap">
            <Stack gap="xs">
              <Group gap="xs">
                <Badge color="brand" variant="light" size="sm">
                  Bảng điều khiển quản trị
                </Badge>
              </Group>
              <Title order={1} size="h2">
                Tổng quan hệ thống InterviewCoach
              </Title>
              <Text size="sm" c="dimmed">
                Giám sát tăng trưởng người dùng, trạng thái phân quyền và độ phủ
                kho tri thức O*NET / SFIA 9.
              </Text>
            </Stack>

            <Group gap="sm">
              <Button
                component={Link}
                href="/admin/onet"
                variant="light"
                color="brand"
                leftSection={<IconBook size={16} stroke={1.5} />}
              >
                Kho O*NET
              </Button>
              <Button
                component={Link}
                href="/admin/users"
                color="brand"
                leftSection={<IconUsers size={16} stroke={1.5} />}
              >
                Quản lý người dùng
              </Button>
            </Group>
          </Group>
        </Paper>

        {/* Users KPIs & Charts Section */}
        {usersQuery.isLoading ? (
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              <Skeleton height={104} radius="md" />
              <Skeleton height={104} radius="md" />
              <Skeleton height={104} radius="md" />
              <Skeleton height={104} radius="md" />
            </SimpleGrid>
            <Grid gap="lg">
              <Grid.Col span={{ base: 12, lg: 7 }}>
                <Skeleton height={300} radius="md" />
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 5 }}>
                <Skeleton height={300} radius="md" />
              </Grid.Col>
            </Grid>
          </Stack>
        ) : usersErrorMessage ? (
          <Alert
            color="danger"
            variant="light"
            icon={<IconAlertCircle size={18} stroke={1.5} />}
            title="Không thể tải thống kê người dùng"
          >
            <Stack gap="xs">
              <Text size="sm">{usersErrorMessage}</Text>
              <Group>
                <Button
                  size="xs"
                  variant="light"
                  color="danger"
                  leftSection={<IconRefresh size={14} stroke={1.5} />}
                  onClick={() => void usersQuery.refetch()}
                >
                  Thử lại
                </Button>
              </Group>
            </Stack>
          </Alert>
        ) : (
          <>
            <AdminKpiGrid metrics={metrics} />

            <Grid gap="lg">
              <Grid.Col span={{ base: 12, lg: 7 }}>
                <UserRegistrationChart users={users} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 5 }}>
                <UserDistributionChart metrics={metrics} />
              </Grid.Col>
            </Grid>
          </>
        )}

        {/* Independent Knowledge Base Health Card */}
        <KnowledgeBaseHealthCard enabled={isAdmin} />

        {/* Bottom Row: Recent Users + Quick Actions */}
        {usersQuery.isError ? (
          <AdminQuickActions />
        ) : (
          <Grid gap="lg">
            <Grid.Col span={{ base: 12, lg: 8 }}>
              {usersQuery.isLoading ? (
                <Skeleton height={300} radius="md" />
              ) : (
                <RecentUsersTable users={metrics.recentUsers} />
              )}
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <AdminQuickActions />
            </Grid.Col>
          </Grid>
        )}
      </Stack>
    </Container>
  )
}
