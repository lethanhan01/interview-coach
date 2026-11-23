# Hướng Dẫn Thực Chiến: TanStack Query v5 + Mantine UI v9 + Zod v4 (`client/`)

Tài liệu này quy định kiến trúc và 5 mẫu thiết kế thực chiến (Patterns) kết hợp **TanStack Query v5 (`@tanstack/react-query`)**, **Mantine UI v9 (`^9.8.2`, Zero-Hex Semantic-Only)**, **`@mantine/form` (`mode: 'uncontrolled'`) + Zod v4 (`^4.4.3`)**, và tầng **1-Hop Direct REST (`client/lib/api-client.ts` & `client/services/*.service.ts`)** trên Next.js 16 App Router.

> **Tham chiếu liên quan:** [Cẩm nang Mantine v9 (`README.md`)](./README.md) | [Catalog 7 Nhóm Templates (`05-mantine-templates-catalog.md`)](./05-mantine-templates-catalog.md) | [Chuyên đề 03: State Management](../docs/01-foundations/state-management.md) | [Chuyên đề 11: API Contracts & Resilience](../docs/03-quality-and-security/api-contracts-and-resilience.md)

---

## MỤC LỤC

1. [Kiến Trúc 1-Hop Direct REST & Hạ Tầng `client/lib/query-client.tsx`](#1-kiến-trúc-1-hop-direct-rest-hạ-tầng-clientlibquery-clienttsx)
2. [Pattern 1 — `useQuery` + `queryKeys` + Mantine `Skeleton` & `Alert`](#2-pattern-1-usequery-querykeys-mantine-skeleton-alert)
3. [Pattern 2 — `@mantine/form` (`uncontrolled`, Zod v4) + `useMutation` + `@mantine/notifications`](#3-pattern-2-mantineform-uncontrolled-zod-v4-usemutation-mantinenotifications)
4. [Pattern 3 — Tìm Kiếm Tức Thì Với `useDebouncedValue` & TanStack Query `AbortSignal`](#4-pattern-3-tìm-kiếm-tức-thì-với-usedebouncedvalue-tanstack-query-abortsignal)
5. [Pattern 4 — Optimistic Updates Kết Hợp `@mantine/modals` (`modals.openConfirmModal`)](#5-pattern-4-optimistic-updates-kết-hợp-mantinemodals-modalsopenconfirmmodal)
6. [Pattern 5 — Đồng Bộ Realtime SSE (`EventSource`) & Binary Media Vào `QueryClient` Cache](#6-pattern-5-đồng-bộ-realtime-sse-eventsource-binary-media-vào-queryclient-cache)

---

## 1. Kiến Trúc 1-Hop Direct REST & Hạ Tầng `client/lib/query-client.tsx`

InterviewCoach sử dụng kiến trúc **Pure Client-Side TanStack Query v5 + 1-Hop Direct REST**:

- **Không dùng lớp trung gian BFF Proxy:** Mọi request (`JSON`, Multipart `FormData`, Audio `Blob`, và `EventSource` SSE) đi trực tiếp 1 hop từ trình duyệt tới NestJS 11 Backend (`:3000/api/v1/*`) qua `client/lib/api-client.ts` (`credentials: 'include'`, Mutex 401 Silent Refresh duy nhất, tự động gắn `Idempotency-Key`, và chuẩn hóa lỗi `ApiClientError`).
- **Tập trung hạ tầng tại 1 tệp duy nhất `client/lib/query-client.tsx`:** Cung cấp `makeQueryClient()`, `getQueryClient()`, `<QueryProvider>`, và bộ **`queryKeys` factory** bao phủ toàn bộ 10 miền nghiệp vụ (`auth`, `users`, `candidateProfile`, `prep`, `rubrics`, `sessions`, `onet`, `onetAdmin`, `sfiaAdmin`).

```tsx
// Chuẩn cấu hình client/lib/query-client.tsx (TanStack Query v5 + Smart Retry + queryKeys Factory)
'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiClientError } from '@/lib/api-client'

const NON_RETRYABLE_ERROR_CODES = new Set(['REPORT_NOT_READY'])

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false
  }
  if (error instanceof ApiClientError) {
    if (
      error.errorCode &&
      NON_RETRYABLE_ERROR_CODES.has(error.errorCode.toUpperCase())
    ) {
      return false
    }
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return false
    }
  }
  return true
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    me: () => ['users', 'me'] as const,
    adminList: () => ['users', 'admin-list'] as const,
    adminDetail: (id: string) => ['users', 'admin-detail', id] as const,
  },
  candidateProfile: {
    all: ['candidate-profile'] as const,
    detail: () => ['candidate-profile', 'detail'] as const,
  },
  prep: {
    all: ['prep'] as const,
    savedJds: () => ['prep', 'saved-jds'] as const,
  },
  rubrics: {
    all: ['rubrics'] as const,
    active: (contextPackId: string, sessionType?: string) =>
      ['rubrics', 'active', contextPackId, sessionType ?? 'all'] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    list: () => ['sessions', 'list'] as const,
    detail: (sessionId: string) => ['sessions', 'detail', sessionId] as const,
    status: (sessionId: string) => ['sessions', 'status', sessionId] as const,
    questions: (sessionId: string) =>
      ['sessions', 'questions', sessionId] as const,
    feedbackProgress: (sessionId: string) =>
      ['sessions', 'feedback-progress', sessionId] as const,
    report: (sessionId: string) => ['sessions', 'report', sessionId] as const,
  },
  onet: {
    all: ['onet'] as const,
    search: (query?: string, limit?: number) =>
      ['onet', 'search', query ?? '', limit ?? 20] as const,
    tech: (socCode: string) => ['onet', 'tech', socCode] as const,
  },
  onetAdmin: {
    all: ['onet-admin'] as const,
    summary: () => ['onet-admin', 'summary'] as const,
    majorGroups: () => ['onet-admin', 'major-groups'] as const,
    occupations: (filters?: Record<string, unknown>) =>
      ['onet-admin', 'occupations', filters ?? {}] as const,
    topOccupations: (filters?: Record<string, unknown>) =>
      ['onet-admin', 'top-occupations', filters ?? {}] as const,
    sfiaCoverage: (filters?: Record<string, unknown>) =>
      ['onet-admin', 'sfia-coverage', filters ?? {}] as const,
    detail: (socCode: string) => ['onet-admin', 'detail', socCode] as const,
    alternateTitles: (
      socCode: string,
      page?: number,
      limit?: number,
      search?: string
    ) =>
      [
        'onet-admin',
        'alternate-titles',
        socCode,
        page ?? 1,
        limit ?? 20,
        search ?? '',
      ] as const,
    sfiaMappings: (socCode: string) =>
      ['onet-admin', 'sfia-mappings', socCode] as const,
    sfiaLibrary: () => ['onet-admin', 'sfia-library'] as const,
  },
  sfiaAdmin: {
    all: ['sfia-admin'] as const,
    categories: () => ['sfia-admin', 'categories'] as const,
    subcategories: (categoryCode?: string) =>
      ['sfia-admin', 'subcategories', categoryCode ?? 'all'] as const,
    skills: (filters?: Record<string, unknown>) =>
      ['sfia-admin', 'skills', filters ?? {}] as const,
    skillDetail: (skillCode: string) =>
      ['sfia-admin', 'skill-detail', skillCode] as const,
    levels: () => ['sfia-admin', 'levels'] as const,
    attributes: () => ['sfia-admin', 'attributes'] as const,
    matrix: (categoryCode?: string) =>
      ['sfia-admin', 'matrix', categoryCode ?? 'all'] as const,
    coverage: () => ['sfia-admin', 'coverage'] as const,
  },
} as const

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient)
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

---

## 2. Pattern 1 — `useQuery` + `queryKeys` + Mantine `Skeleton` & `Alert`

- Mọi trạng thái đọc dữ liệu từ server đi qua `useQuery` với khóa từ `queryKeys`.
- Trong lúc `isPending`, hiển thị Mantine `<Skeleton>` có kích thước tương đương thẻ thật để giữ `CLS <= 0.1`.
- Khi `isError`, hiển thị `<Alert color="danger" variant="light">` kèm nút `<Button>` gọi `refetch()`.

```tsx
'use client'

import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'

export interface SessionListItem {
  id: string
  roleTitle: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}

async function fetchCandidateSessions(): Promise<SessionListItem[]> {
  const res = await apiClient.get<{ sessions: SessionListItem[] }>('/sessions')
  return res.sessions ?? []
}

export function CandidateSessionListSection() {
  const {
    data: sessions = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.sessions.list(),
    queryFn: fetchCandidateSessions,
    staleTime: 5_000,
  })

  if (isPending) {
    return (
      <Stack gap="sm" aria-busy="true" aria-label="Đang tải danh sách phiên">
        <Skeleton height={76} radius="md" />
        <Skeleton height={76} radius="md" />
        <Skeleton height={76} radius="md" />
      </Stack>
    )
  }

  if (isError) {
    return (
      <Alert
        color="danger"
        variant="light"
        title="Không thể tải danh sách phiên phỏng vấn"
        icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
      >
        <Group justify="space-between" align="center" gap="sm">
          <Text size="sm">
            {error instanceof Error
              ? error.message
              : 'Đã xảy ra lỗi kết nối máy chủ.'}
          </Text>
          <Button
            size="xs"
            color="danger"
            variant="light"
            leftSection={
              <IconRefresh size={14} stroke={1.5} aria-hidden="true" />
            }
            onClick={() => {
              void refetch()
            }}
          >
            Thử lại
          </Button>
        </Group>
      </Alert>
    )
  }

  return (
    <Stack gap="sm">
      {sessions.map((session) => (
        <Paper key={session.id} withBorder p="md" radius="md">
          <Group justify="space-between" align="center">
            <Title order={3} size="h5">
              {session.roleTitle}
            </Title>
            <Badge
              color={session.status === 'COMPLETED' ? 'success' : 'brand'}
              variant="light"
            >
              {session.status}
            </Badge>
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}
```

---

## 3. Pattern 2 — `@mantine/form` (`uncontrolled`, Zod v4) + `useMutation` + `@mantine/notifications`

- Xác thực biểu mẫu ở phía client bằng `@mantine/form` (`mode: 'uncontrolled'`, `form.key()`, `schemaResolver(zodSchema, { sync: true })`).
- Trong `onError` của `useMutation`, nếu lỗi là `ApiClientError` có `details` (`Record<string, string[]>`), ánh xạ trực tiếp lỗi từng trường vào `form.setErrors(...)` và thông báo qua `notifications.show({ color: 'danger', ... })`.
- Trong `onSuccess`, gọi `queryClient.invalidateQueries` để làm mới danh sách liên quan.

```tsx
'use client'

import {
  Box,
  Button,
  Group,
  Select,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient, ApiClientError } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'

const saveJdSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề JD cần tối thiểu 3 ký tự'),
  level: z.enum(['JUNIOR', 'MID', 'SENIOR']),
  content: z.string().trim().min(30, 'Nội dung JD cần tối thiểu 30 ký tự'),
})

type SaveJdValues = z.infer<typeof saveJdSchema>

export function SaveJobDescriptionForm({ onSaved }: { onSaved?: () => void }) {
  const queryClient = useQueryClient()

  const form = useForm<SaveJdValues>({
    mode: 'uncontrolled',
    initialValues: {
      title: '',
      level: 'MID',
      content: '',
    },
    validate: schemaResolver(saveJdSchema, { sync: true }),
  })

  const saveJdMutation = useMutation({
    mutationFn: (payload: SaveJdValues) =>
      apiClient.post<{ id: string }>('/saved-job-descriptions', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.prep.savedJds(),
      })
      form.reset()
      notifications.show({
        color: 'success',
        title: 'Đã lưu mô tả công việc',
        message: 'JD đã được thêm vào thư viện chuẩn bị phỏng vấn.',
      })
      onSaved?.()
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.details) {
        const fieldErrors: Record<string, string> = {}
        for (const [field, messages] of Object.entries(err.details)) {
          if (messages.length > 0) {
            fieldErrors[field] = messages[0]
          }
        }
        form.setErrors(fieldErrors)
      }
      notifications.show({
        color: 'danger',
        title: 'Lưu JD thất bại',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể lưu mô tả công việc lúc này.',
      })
    },
  })

  return (
    <Box
      component="form"
      onSubmit={form.onSubmit((values) => saveJdMutation.mutate(values))}
      noValidate
    >
      <Stack gap="md">
        <TextInput
          withAsterisk
          label="Tiêu đề vị trí (JD)"
          placeholder="Ví dụ: Senior Backend Engineer (NestJS)"
          key={form.key('title')}
          {...form.getInputProps('title')}
        />
        <Select
          withAsterisk
          label="Cấp độ mục tiêu"
          data={[
            { value: 'JUNIOR', label: 'Junior' },
            { value: 'MID', label: 'Mid-Level' },
            { value: 'SENIOR', label: 'Senior' },
          ]}
          key={form.key('level')}
          {...form.getInputProps('level')}
        />
        <Textarea
          withAsterisk
          label="Nội dung mô tả công việc"
          minRows={4}
          autosize
          key={form.key('content')}
          {...form.getInputProps('content')}
        />
        <Group justify="flex-end">
          <Button
            type="submit"
            color="brand"
            loading={saveJdMutation.isPending}
          >
            Lưu vào thư viện
          </Button>
        </Group>
      </Stack>
    </Box>
  )
}
```

---

## 4. Pattern 3 — Tìm Kiếm Tức Thì Với `useDebouncedValue` & TanStack Query `AbortSignal`

- Kết hợp `useDebouncedValue(search, 300)` từ `@mantine/hooks` với `queryKeys.onet.search(debounced, 20)`.
- Nhận `{ signal }` từ `QueryFunctionContext` của TanStack Query v5 và truyền xuống `apiClient.get(..., { signal })`. Khi người dùng gõ ký tự mới làm đổi `queryKey`, TanStack Query tự động hủy request in-flight trước đó qua `AbortSignal`.

```tsx
'use client'

import { useState } from 'react'
import { Loader, Select, Stack, Text } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'

export interface OnetOccupationItem {
  socCode: string
  title: string
}

async function searchOnetOccupations(
  query: string,
  signal?: AbortSignal
): Promise<OnetOccupationItem[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '20',
  })
  return apiClient.get<OnetOccupationItem[]>(
    `/onet/occupations?${params.toString()}`,
    { signal }
  )
}

export function OnetOccupationSearchSelect({
  value,
  onChange,
}: {
  value: string | null
  onChange: (socCode: string | null) => void
}) {
  const [searchValue, setSearchValue] = useState('')
  const [debouncedQuery] = useDebouncedValue(searchValue.trim(), 300)

  const { data: occupations = [], isFetching } = useQuery({
    queryKey: queryKeys.onet.search(debouncedQuery, 20),
    queryFn: ({ signal }) => searchOnetOccupations(debouncedQuery, signal),
    staleTime: 60_000,
  })

  const selectData = occupations.map((item) => ({
    value: item.socCode,
    label: `${item.title} (${item.socCode})`,
  }))

  return (
    <Stack gap="xs">
      <Select
        searchable
        clearable
        label="Ngành nghề chuẩn O*NET"
        placeholder="Gõ tên nghề nghiệp (ví dụ: Software Developer)..."
        data={selectData}
        value={value}
        onChange={onChange}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        rightSection={isFetching ? <Loader size="xs" /> : null}
        nothingFoundMessage="Không tìm thấy ngành nghề phù hợp"
      />
      <Text size="xs" c="dimmed">
        Dữ liệu tự động hủy request cũ qua AbortSignal khi thay đổi từ khóa.
      </Text>
    </Stack>
  )
}
```

---

## 5. Pattern 4 — Optimistic Updates Kết Hợp `@mantine/modals` (`modals.openConfirmModal`)

- Mở hộp thoại xác nhận chuẩn Mantine bằng `modals.openConfirmModal` (`confirmProps: { color: 'danger' }`).
- Trong `onMutate`: gọi `await queryClient.cancelQueries({ queryKey })`, chụp lại snapshot `previousItems`, và cập nhật lạc quan qua `queryClient.setQueryData`.
- Trong `onError`: khôi phục `previousItems` và báo lỗi qua `notifications.show`.
- Trong `onSettled`: luôn gọi `queryClient.invalidateQueries` để đồng bộ trạng thái cuối cùng từ Backend.

```tsx
'use client'

import { ActionIcon, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconTrash } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'

export interface SfiaMappingRecord {
  id: string
  skillCode: string
  skillName: string
}

export function SfiaMappingListWithOptimisticDelete({
  socCode,
  mappings,
}: {
  socCode: string
  mappings: SfiaMappingRecord[]
}) {
  const queryClient = useQueryClient()
  const mappingKey = queryKeys.onetAdmin.sfiaMappings(socCode)

  const deleteMappingMutation = useMutation({
    mutationFn: (mappingId: string) =>
      apiClient.delete(
        `/onet/admin/occupations/${encodeURIComponent(socCode)}/sfia-mappings/${encodeURIComponent(mappingId)}`
      ),
    onMutate: async (mappingId) => {
      await queryClient.cancelQueries({ queryKey: mappingKey })
      const previousMappings =
        queryClient.getQueryData<SfiaMappingRecord[]>(mappingKey)

      queryClient.setQueryData<SfiaMappingRecord[]>(mappingKey, (old = []) =>
        old.filter((item) => item.id !== mappingId)
      )

      return { previousMappings }
    },
    onError: (err, _mappingId, context) => {
      if (context?.previousMappings) {
        queryClient.setQueryData(mappingKey, context.previousMappings)
      }
      notifications.show({
        color: 'danger',
        title: 'Không thể xóa ánh xạ kỹ năng',
        message:
          err instanceof Error
            ? err.message
            : 'Đã khôi phục dữ liệu ban đầu do lỗi máy chủ.',
      })
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: mappingKey })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.onetAdmin.detail(socCode),
      })
    },
  })

  const handleConfirmDelete = (item: SfiaMappingRecord) => {
    modals.openConfirmModal({
      title: 'Xác nhận xóa ánh xạ SFIA',
      children: (
        <Text size="sm">
          Bạn có chắc chắn muốn gỡ kỹ năng {item.skillCode} ({item.skillName})
          khỏi nghề {socCode} không?
        </Text>
      ),
      labels: { confirm: 'Xóa ánh xạ', cancel: 'Hủy bỏ' },
      confirmProps: { color: 'danger' },
      onConfirm: () => deleteMappingMutation.mutate(item.id),
    })
  }

  return (
    <Stack gap="xs">
      {mappings.map((item) => (
        <Paper key={item.id} withBorder p="sm" radius="md">
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Title order={4} size="h6">
                {item.skillCode}
              </Title>
              <Text size="xs" c="dimmed">
                {item.skillName}
              </Text>
            </Stack>
            <ActionIcon
              color="danger"
              variant="subtle"
              aria-label={`Xóa ánh xạ kỹ năng ${item.skillCode}`}
              onClick={() => handleConfirmDelete(item)}
            >
              <IconTrash size={16} stroke={1.5} aria-hidden="true" />
            </ActionIcon>
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}
```

---

## 6. Pattern 5 — Đồng Bộ Realtime SSE (`EventSource`) & Binary Media Vào `QueryClient` Cache

- **Luồng SSE (`EventSource`):** Khi nhận frame tiến độ chấm điểm AI (`feedback_progress`), xác thực payload bằng **Zod v4** và gọi trực tiếp `queryClient.setQueryData(queryKeys.sessions.feedbackProgress(sessionId), ...)` để thanh `<Progress>` cập nhật tức thì mà không cần gửi thêm HTTP request. Khi nhận `report_ready`, gọi `queryClient.invalidateQueries` cho `report(sessionId)`, `detail(sessionId)` và `list()`.
- **Luồng Binary Media (`FormData` STT & Audio `Blob` TTS):** Gói trong `useMutation` gọi `apiClient.postForm` hoặc `fetch` với `credentials: 'include'`.

```ts
// Đồng bộ trực tiếp sự kiện SSE (EventSource) vào TanStack QueryClient Cache
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { getApiBaseUrl } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'

const sseFeedbackProgressSchema = z.object({
  totalTurns: z.number().int().nonnegative(),
  evaluatedTurns: z.number().int().nonnegative(),
  progressPercent: z.number().min(0).max(100),
  reportReady: z.boolean(),
})

export type SseFeedbackProgress = z.infer<typeof sseFeedbackProgressSchema>

export function useRealtimeSessionCacheSync(
  sessionId: string | null,
  enabled = true
): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!sessionId || !enabled) return

    const url = `${getApiBaseUrl()}/sessions/${encodeURIComponent(sessionId)}/events`
    const source = new EventSource(url, { withCredentials: true })

    source.addEventListener('feedback_progress', (event) => {
      try {
        const parsed = sseFeedbackProgressSchema.safeParse(
          JSON.parse((event as MessageEvent<string>).data)
        )
        if (parsed.success) {
          queryClient.setQueryData(
            queryKeys.sessions.feedbackProgress(sessionId),
            parsed.data
          )
        }
      } catch {
        // Bỏ qua gói dữ liệu SSE không hợp lệ
      }
    })

    source.addEventListener('report_ready', () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.report(sessionId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.list(),
      })
    })

    return () => {
      source.close()
    }
  }, [enabled, queryClient, sessionId])
}
```
