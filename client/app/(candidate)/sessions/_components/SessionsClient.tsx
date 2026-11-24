'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import { IconAlertCircle, IconMessages, IconPlus } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { SafeViewTransition } from '@/components/patterns/SafeViewTransition'
import { getErrorMessage } from '@/lib/form-errors'
import { sessionQueries } from '@/lib/query-client'
import SessionListCard, { getCompanyName } from './SessionListCard'
import SessionsFilterBar, {
  type SessionStatusFilter,
} from './SessionsFilterBar'
import SessionsStatsGrid, {
  computeSessionsStats,
  IN_PROGRESS_STATUSES,
  OTHER_STATUSES,
} from './SessionsStatsGrid'

function getSessionErrorMessage(err: unknown): string | null {
  if (!err) return null
  if (err instanceof Error && err.message === 'Failed to fetch') {
    return 'Không thể kết nối đến server. Kiểm tra server có đang chạy không.'
  }
  return getErrorMessage(err, 'Không thể tải danh sách phiên phỏng vấn')
}

export default function SessionsClient() {
  const [statusFilter, setStatusFilter] = useState<SessionStatusFilter>('all')
  const [search, setSearch] = useState('')

  const {
    data: sessions = [],
    isPending,
    error: queryError,
    refetch,
  } = useQuery(sessionQueries.list())

  const error = getSessionErrorMessage(queryError)

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [sessions]
  )

  const stats = useMemo(() => computeSessionsStats(sessions), [sessions])

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sortedSessions.filter((session) => {
      if (
        statusFilter === 'in_progress' &&
        !IN_PROGRESS_STATUSES.has(session.status)
      ) {
        return false
      }
      if (statusFilter === 'completed' && session.status !== 'completed') {
        return false
      }
      if (statusFilter === 'other' && !OTHER_STATUSES.has(session.status)) {
        return false
      }
      if (!q) return true
      const company = getCompanyName(session.jobDescription) ?? ''
      return `${session.jobTitle ?? ''} ${company}`.toLowerCase().includes(q)
    })
  }, [search, sortedSessions, statusFilter])

  if (isPending) {
    return (
      <Container size="xl" px={0}>
        <Stack gap="lg" aria-busy="true">
          <VisuallyHidden role="status">
            Đang tải danh sách phiên phỏng vấn...
          </VisuallyHidden>
          <Skeleton height={116} radius="md" />
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Skeleton height={92} radius="md" />
            <Skeleton height={92} radius="md" />
            <Skeleton height={92} radius="md" />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            <Skeleton height={220} radius="md" />
            <Skeleton height={220} radius="md" />
            <Skeleton height={220} radius="md" />
          </SimpleGrid>
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl" px={0} py="md">
        <Alert
          color="danger"
          variant="light"
          role="alert"
          title="Không thể tải danh sách phiên phỏng vấn"
          icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
        >
          <Stack gap="sm" align="flex-start">
            <Text size="sm">{error}</Text>
            <Button
              type="button"
              variant="light"
              color="danger"
              size="xs"
              onClick={() => void refetch()}
            >
              Thử lại
            </Button>
          </Stack>
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <Paper withBorder radius="md" p="lg">
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
            <Stack gap={6} maw={640}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                Phiên phỏng vấn
              </Text>
              <Group gap="sm" align="center" wrap="wrap">
                <Title order={1} size="h2">
                  Quản lý phiên phỏng vấn
                </Title>
                <Badge color="brand" variant="light">
                  {stats.total} phiên
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                Tạo phiên mới, tiếp tục phiên đang chạy hoặc xem báo cáo đã hoàn
                thành.
              </Text>
            </Stack>

            <Button
              component={Link}
              href="/setup"
              transitionTypes={['nav-forward']}
              color="brand"
              leftSection={
                <IconPlus size={16} stroke={1.5} aria-hidden="true" />
              }
            >
              Tạo phiên mới
            </Button>
          </Group>
        </Paper>

        {stats.total === 0 ? (
          <Paper withBorder radius="md" p="xl">
            <Stack align="center" gap="md" py="md">
              <ThemeIcon size={56} radius="xl" variant="light" color="brand">
                <IconMessages size={28} stroke={1.5} aria-hidden="true" />
              </ThemeIcon>
              <Stack gap={4} align="center">
                <Title order={2} size="h4">
                  Chưa có phiên phỏng vấn nào
                </Title>
                <Text size="sm" c="dimmed" ta="center" maw={420}>
                  Dán Job Description và bắt đầu luyện tập ngay để nhận phản hồi
                  từ AI.
                </Text>
              </Stack>
              <Button
                component={Link}
                href="/setup"
                transitionTypes={['nav-forward']}
                color="brand"
                leftSection={
                  <IconPlus size={16} stroke={1.5} aria-hidden="true" />
                }
              >
                Bắt đầu phỏng vấn
              </Button>
            </Stack>
          </Paper>
        ) : (
          <>
            <SessionsStatsGrid stats={stats} />
            <SessionsFilterBar
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              search={search}
              onSearchChange={setSearch}
            />

            {filteredSessions.length === 0 ? (
              <Paper withBorder radius="md" p="xl">
                <Stack align="center" gap="sm">
                  <Text fw={500}>Không tìm thấy phiên phỏng vấn phù hợp</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.
                  </Text>
                  <Button
                    type="button"
                    variant="light"
                    color="brand"
                    size="xs"
                    onClick={() => {
                      setStatusFilter('all')
                      setSearch('')
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </Stack>
              </Paper>
            ) : (
              <SafeViewTransition default="none">
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  {filteredSessions.map((session) => (
                    <SessionListCard key={session.id} session={session} />
                  ))}
                </SimpleGrid>
              </SafeViewTransition>
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}
