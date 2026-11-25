'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import { IconAlertCircle, IconBuilding, IconPlus } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { SafeViewTransition } from '@/components/common/SafeViewTransition'
import { getErrorMessage } from '@/lib/form-errors'
import { normalizeJdLevel } from '@/lib/interview-option-helpers'
import { catalogQueries } from '@/queries/catalog.queries'
import { prepQueries } from '@/queries/prep.queries'
import JdCard from './JdCard'
import JdLibraryFilterBar from './JdLibraryFilterBar'

export default function JdLibraryClient() {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  const catalogQuery = useQuery(catalogQueries.interviewOptions())
  const jdLevels = useMemo(
    () => catalogQuery.data?.jdLevels ?? [],
    [catalogQuery.data]
  )

  const {
    data: items = [],
    isPending,
    error: queryError,
    refetch,
  } = useQuery(prepQueries.savedJds())

  const error = queryError
    ? getErrorMessage(queryError, 'Không thể tải danh sách Job Descriptions')
    : null

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (
        levelFilter !== 'all' &&
        normalizeJdLevel(item.level, jdLevels) !== levelFilter
      )
        return false
      if (!q) return true
      return [
        item.companyName,
        item.jobTitle,
        item.location,
        item.onetOccupationTitle,
        item.onetSocCode,
        ...item.techStack,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [items, jdLevels, levelFilter, search])

  if (isPending) {
    return (
      <Container size="md" px={0}>
        <Stack gap="lg" aria-busy="true">
          <VisuallyHidden role="status">
            Đang tải danh sách Job Descriptions...
          </VisuallyHidden>
          <Skeleton height={48} radius="sm" />
          <Skeleton height={132} radius="md" />
          <Skeleton height={132} radius="md" />
          <Skeleton height={132} radius="md" />
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="md" px={0} py="md">
        <Alert
          color="danger"
          variant="light"
          role="alert"
          title="Không thể tải danh sách Job Descriptions"
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

  const hasFilters = search.trim().length > 0 || levelFilter !== 'all'

  return (
    <Container size="md" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Stack gap={4}>
            <Title order={1} size="h2">
              Job Descriptions
            </Title>
            <Text size="sm" c="dimmed">
              {items.length > 0
                ? `${items.length} JD đã lưu — chọn để bắt đầu phỏng vấn`
                : 'Chưa có JD nào được lưu'}
            </Text>
          </Stack>

          <Button
            component={Link}
            href="/setup?new=1"
            transitionTypes={['nav-forward']}
            color="brand"
            leftSection={<IconPlus size={16} stroke={1.5} aria-hidden="true" />}
          >
            Tạo phiên mới
          </Button>
        </Group>

        {items.length === 0 ? (
          <Paper withBorder radius="md" p="xl">
            <Stack align="center" gap="md" py="md">
              <ThemeIcon size={56} radius="xl" variant="light" color="brand">
                <IconBuilding size={28} stroke={1.5} aria-hidden="true" />
              </ThemeIcon>
              <Title order={2} size="h4">
                Chưa có Job Description nào
              </Title>
              <Text size="sm" c="dimmed" ta="center" maw={400}>
                Tạo phiên phỏng vấn đầu tiên để bắt đầu lưu JD và tái sử dụng
                nhanh cho các buổi luyện tập tiếp theo.
              </Text>
              <Button
                component={Link}
                href="/setup?new=1"
                transitionTypes={['nav-forward']}
                color="brand"
                leftSection={
                  <IconPlus size={16} stroke={1.5} aria-hidden="true" />
                }
              >
                Tạo phiên mới
              </Button>
            </Stack>
          </Paper>
        ) : (
          <>
            <JdLibraryFilterBar
              search={search}
              onSearchChange={setSearch}
              levelFilter={levelFilter}
              onLevelFilterChange={setLevelFilter}
              jdLevels={jdLevels}
              isCatalogPending={catalogQuery.isPending}
              isCatalogError={catalogQuery.isError}
              onRetryCatalog={() => void catalogQuery.refetch()}
            />

            {filteredItems.length === 0 ? (
              <Paper withBorder radius="md" p="xl">
                <Stack align="center" gap="sm">
                  <Text fw={500}>Không tìm thấy Job Description phù hợp</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc cấp bậc.
                  </Text>
                  {hasFilters ? (
                    <Button
                      type="button"
                      variant="light"
                      color="brand"
                      size="xs"
                      onClick={() => {
                        setSearch('')
                        setLevelFilter('all')
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  ) : null}
                </Stack>
              </Paper>
            ) : (
              <SafeViewTransition default="none">
                <Stack gap="sm">
                  {filteredItems.map((item) => (
                    <JdCard key={item.id} item={item} jdLevels={jdLevels} />
                  ))}
                </Stack>
              </SafeViewTransition>
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}
