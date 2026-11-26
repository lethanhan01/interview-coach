# Hướng Dẫn Thực Chiến: TanStack Query v5 (`queryOptions`) + Mantine UI v9 + Zod v4 (`client/`)

Tài liệu này quy định kiến trúc quản trị Server State và 5 mẫu thiết kế thực chiến (Patterns) kết hợp **TanStack Query v5 (`@tanstack/react-query`)**, **Mantine UI v9 (`^9.8.2`, Zero-Hex Semantic-Only)**, và **`@mantine/form` (`mode: 'uncontrolled'`) + Zod v4 (`^4.4.3`)** trên Next.js 16 App Router.

Toàn bộ đoạn mã trong tài liệu này **tự chứa 100% (Zero Client Code Extraction)**, được chuẩn hóa trực tiếp từ tài liệu chính thức [`https://tanstack.com/query/v5`](https://tanstack.com/query/v5), [`https://mantine.dev/`](https://mantine.dev/) và bộ quy tắc [`client/.agents/skills/tanstack-integration-best-practices/SKILL.md`](../../.agents/skills/tanstack-integration-best-practices/SKILL.md) (`flow-loader-query-pattern`, `cache-single-source`, `setup-query-client-context`, `ssr-dehydrate-hydrate`).

> **Tham chiếu liên quan:** [Cẩm nang Mantine v9 (`README.md`)](./README.md) | [Catalog 7 Nhóm Templates (`05-mantine-templates-catalog.md`)](./05-mantine-templates-catalog.md) | [Chuyên đề 03: State Management](../docs/01-foundations/state-management.md) | [Chuyên đề 11: API Contracts & Resilience](../docs/03-quality-and-security/api-contracts-and-resilience.md)

---

## MỤC LỤC

1. [Kiến Trúc `QueryClient` & Chuẩn `queryOptions()` Factory (`tanstack-integration-best-practices`)](#1-kiến-trúc-queryclient-chuẩn-queryoptions-factory-tanstack-integration-best-practices)
2. [Pattern 1 — `queryOptions()` + `useQuery` + Mantine `Skeleton` & `Alert`](#2-pattern-1-queryoptions-usequery-mantine-skeleton-alert)
3. [Pattern 2 — `@mantine/form` (`uncontrolled`, Zod v4) + `useMutation` + `@mantine/notifications`](#3-pattern-2-mantineform-uncontrolled-zod-v4-usemutation-mantinenotifications)
4. [Pattern 3 — Tìm Kiếm Tức Thì Với `useDebouncedValue` & TanStack Query `AbortSignal`](#4-pattern-3-tìm-kiếm-tức-thì-với-usedebouncedvalue-tanstack-query-abortsignal)
5. [Pattern 4 — Optimistic Updates Type-Safe Kết Hợp `@mantine/modals` (`modals.openConfirmModal`)](#5-pattern-4-optimistic-updates-type-safe-kết-hợp-mantinemodals-modalsopenconfirmmodal)
6. [Pattern 5 — Đồng Bộ Realtime SSE (`EventSource`) & Parallel Prefetching Vào `QueryClient` Cache](#6-pattern-5-đồng-bộ-realtime-sse-eventsource-parallel-prefetching-vào-queryclient-cache)

---

## 1. Kiến Trúc `QueryClient` & Chuẩn `queryOptions()` Factory (`tanstack-integration-best-practices`)

Theo tài liệu chính thức của **TanStack Query v5** ([`queryOptions`](https://tanstack.com/query/v5/docs/framework/react/guides/query-options), [`Advanced SSR`](https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr)) và 4 quy tắc cốt lõi trong [`tanstack-integration-best-practices`](../../.agents/skills/tanstack-integration-best-practices/SKILL.md):

1. **Không dùng Global Mutable `QueryClient` Singleton trên SSR (`setup-query-client-context`):**
   - Tạo `QueryClient` mới cho mỗi request trên Server thông qua `makeQueryClient()`, và chỉ giữ 1 browser singleton trên Client thông qua `getQueryClient()` (hoặc khởi tạo cô lập qua `useState(makeQueryClient)` trong `<QueryProvider>`).
   - Trong kiểm thử Vitest (`@test-utils`), mỗi lần gọi `render()` phải tạo một `QueryClient` mới (`retry: false`, `gcTime: 0`) để không rò rỉ cache giữa các test cases.
2. **Đóng gói `queryKey + queryFn + staleTime` bằng `queryOptions()` (`flow-loader-query-pattern`):**
   - Thay vì tách rời mảng `queryKeys` kiểu v4 rồi lặp lại `queryFn` ở từng component, luôn dùng helper **`queryOptions()`** từ `@tanstack/react-query`.
   - `queryOptions()` mang lại suy luận kiểu tự động 100% cho cả `useQuery(sessionQueries.detail(id))`, `useSuspenseQuery(sessionQueries.detail(id))`, `queryClient.prefetchQuery(sessionQueries.detail(id))`, `queryClient.ensureQueryData(sessionQueries.detail(id))`, và `queryClient.getQueryData(sessionQueries.detail(id).queryKey)` mà **không cần** truyền generic thủ công.
3. **Một nguồn chân lý cache duy nhất (`cache-single-source`):**
   - Để `QueryClient` quản lý toàn bộ vòng đời dữ liệu server (`staleTime`, `gcTime`, `refetchOnWindowFocus`, invalidation). Tuyệt đối không sao chép dữ liệu từ `useQuery` hoặc SSE sang `useState` hay React Context.
4. **Tuân thủ ranh giới dịch vụ (`API-007`):**
   - Tách bạch rõ **Tầng 1 (Query Options Factory & Typed Fetchers + Zod v4 Validation)** với **Tầng 2 (Mantine v9 UI Component)**. Component UI chỉ gọi `useQuery(xxxQueries.list())` hoặc `useMutation(...)`, tuyệt đối không chứa đường dẫn endpoint URL thô bên trong JSX/Component.

```tsx
// Chuẩn cấu hình QueryClient, QueryProvider & queryOptions() Factory theo TanStack Query v5
'use client'

import { type ReactNode } from 'react'
import {
  isServer,
  QueryClient,
  QueryClientProvider,
  queryOptions,
} from '@tanstack/react-query'
import { z } from 'zod'

export class HttpStatusError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'HttpStatusError'
  }
}

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false
  }
  if (error instanceof HttpStatusError) {
    if (error.status >= 400 && error.status < 500) {
      return false
    }
    if (error.code === 'REPORT_NOT_READY') {
      return false
    }
  }
  return true
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: true,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Bộ khóa phân cấp (Hierarchical queryKeys) kết hợp trực tiếp với queryOptions()
export const queryKeys = {
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (status?: string) =>
      [...queryKeys.sessions.lists(), { status: status ?? 'ALL' }] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (sessionId: string) =>
      [...queryKeys.sessions.details(), sessionId] as const,
    progress: (sessionId: string) =>
      [...queryKeys.sessions.detail(sessionId), 'progress'] as const,
    report: (sessionId: string) =>
      [...queryKeys.sessions.detail(sessionId), 'report'] as const,
  },
} as const

const sessionSummarySchema = z.object({
  id: z.string(),
  roleTitle: z.string(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
})

export type SessionSummary = z.infer<typeof sessionSummarySchema>

async function fetchSessionsByStatus(
  status: string | undefined,
  signal?: AbortSignal
): Promise<SessionSummary[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  const response = await fetch(`/api/v1/sessions${qs}`, {
    credentials: 'include',
    signal,
  })
  if (!response.ok) {
    throw new HttpStatusError('Không thể tải danh sách phiên', response.status)
  }
  const raw: unknown = await response.json()
  return z.array(sessionSummarySchema).parse(raw)
}

export const sessionQueries = {
  all: () => queryKeys.sessions.all,
  list: (status?: string) =>
    queryOptions({
      queryKey: queryKeys.sessions.list(status),
      queryFn: ({ signal }) => fetchSessionsByStatus(status, signal),
      staleTime: 30_000,
    }),
}
```

---

## 2. Pattern 1 — `queryOptions()` + `useQuery` + Mantine `Skeleton` & `Alert`

- **Tầng 1 (Query Options Factory):** Định nghĩa `candidateSessionQueries.list()` gói `queryKey`, `queryFn` (nhận `{ signal }` và parse dữ liệu bằng Zod v4), cùng `staleTime`.
- **Tầng 2 (Mantine UI Component):** Gọi trực tiếp `useQuery(candidateSessionQueries.list())` — kiểu của `data` được suy luận tự động từ `queryOptions()`.
- Trong lúc `isPending`, hiển thị Mantine `<Skeleton>` giữ đúng chiều cao để đảm bảo `CLS <= 0.1`. Khi `isError`, hiển thị `<Alert color="danger" variant="light">` kèm nút `<Button>` gọi `refetch()`.

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
import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// --- Tầng 1: Domain Schema, Service Fetcher & queryOptions() Factory ---
const sessionItemSchema = z.object({
  id: z.string(),
  roleTitle: z.string(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
})

const sessionListResponseSchema = z.object({
  sessions: z.array(sessionItemSchema),
})

export type SessionListItem = z.infer<typeof sessionItemSchema>

async function fetchCandidateSessions(
  signal?: AbortSignal
): Promise<SessionListItem[]> {
  const response = await fetch('/api/v1/sessions', {
    credentials: 'include',
    signal,
  })
  if (!response.ok) {
    throw new Error('Không thể tải danh sách phiên phỏng vấn từ máy chủ.')
  }
  const raw: unknown = await response.json()
  return sessionListResponseSchema.parse(raw).sessions
}

export const candidateSessionQueries = {
  all: () => ['sessions'] as const,
  list: () =>
    queryOptions({
      queryKey: ['sessions', 'list'] as const,
      queryFn: ({ signal }) => fetchCandidateSessions(signal),
      staleTime: 10_000,
    }),
}

// --- Tầng 2: Mantine v9 UI Component (Không chứa URL hay logic HTTP) ---
export function CandidateSessionListSection() {
  const {
    data: sessions = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(candidateSessionQueries.list())

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
- Trong `onSuccess` của `useMutation`: gọi `await queryClient.invalidateQueries({ queryKey: savedJdQueries.all() })` theo quy tắc `cache-single-source` để làm mới dữ liệu trong cache duy nhất.
- Trong `onError`: ánh xạ lỗi validation từng trường từ server (`fieldErrors`) trực tiếp vào `form.setErrors(...)` và hiển thị thông báo qua `notifications.show({ color: 'danger', ... })`.

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

// --- Tầng 1: Schema Zod v4, Lỗi có cấu trúc & Hàm Mutation Service ---
const saveJdSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề JD cần tối thiểu 3 ký tự'),
  level: z.enum(['JUNIOR', 'MID', 'SENIOR']),
  content: z.string().trim().min(30, 'Nội dung JD cần tối thiểu 30 ký tự'),
})

export type SaveJdValues = z.infer<typeof saveJdSchema>

export class ValidationApiError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ValidationApiError'
  }
}

export const savedJdQueries = {
  all: () => ['prep', 'saved-jds'] as const,
}

async function createSavedJobDescription(
  payload: SaveJdValues
): Promise<{ id: string }> {
  const response = await fetch('/api/v1/saved-job-descriptions', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new ValidationApiError('Không thể lưu mô tả công việc lúc này.')
  }
  const raw: unknown = await response.json()
  return z.object({ id: z.string() }).parse(raw)
}

const TARGET_LEVEL_OPTIONS = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid-Level' },
  { value: 'SENIOR', label: 'Senior' },
]

// --- Tầng 2: Mantine v9 Form Component ---
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
    mutationFn: createSavedJobDescription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: savedJdQueries.all(),
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
      if (err instanceof ValidationApiError && err.details) {
        const fieldErrors: Record<string, string> = {}
        for (const [field, messages] of Object.entries(err.details)) {
          if (messages[0]) {
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
          data={TARGET_LEVEL_OPTIONS}
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

- Kết hợp `useDebouncedValue(searchValue.trim(), 300)` từ `@mantine/hooks` với `onetSearchQueries.search(debouncedQuery)` được tạo bằng **`queryOptions()`**.
- Nhận `{ signal }` từ `QueryFunctionContext` của TanStack Query v5 và truyền xuống `fetch(..., { signal })`. Khi người dùng gõ từ khóa mới làm thay đổi `queryKey`, TanStack Query tự động gọi `abort()` trên request đang chạy để triệt tiêu race condition (`API-003`).

```tsx
'use client'

import { useState } from 'react'
import { Loader, Select, Stack, Text } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// --- Tầng 1: Schema & queryOptions() Factory có hỗ trợ AbortSignal ---
const onetOccupationSchema = z.object({
  socCode: z.string(),
  title: z.string(),
})

export type OnetOccupationItem = z.infer<typeof onetOccupationSchema>

async function searchOnetOccupations(
  query: string,
  limit: number,
  signal?: AbortSignal
): Promise<OnetOccupationItem[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  })
  const response = await fetch(
    `/api/v1/onet/occupations?${params.toString()}`,
    {
      credentials: 'include',
      signal,
    }
  )
  if (!response.ok) {
    throw new Error('Không thể tra cứu danh mục nghề O*NET.')
  }
  const raw: unknown = await response.json()
  return z.array(onetOccupationSchema).parse(raw)
}

export const onetSearchQueries = {
  all: () => ['onet'] as const,
  search: (query: string, limit = 20) =>
    queryOptions({
      queryKey: ['onet', 'search', { query, limit }] as const,
      queryFn: ({ signal }) => searchOnetOccupations(query, limit, signal),
      staleTime: 60_000,
    }),
}

// --- Tầng 2: Mantine v9 Searchable Select Component ---
export function OnetOccupationSearchSelect({
  value,
  onChange,
}: {
  value: string | null
  onChange: (socCode: string | null) => void
}) {
  const [searchValue, setSearchValue] = useState('')
  const [debouncedQuery] = useDebouncedValue(searchValue.trim(), 300)

  const { data: occupations = [], isFetching } = useQuery(
    onetSearchQueries.search(debouncedQuery, 20)
  )

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

## 5. Pattern 4 — Optimistic Updates Type-Safe Kết Hợp `@mantine/modals` (`modals.openConfirmModal`)

- Nhờ định nghĩa `sfiaMappingQueries.byOccupation(socCode)` bằng **`queryOptions()`**, thuộc tính `targetQuery.queryKey` mang sẵn thông tin kiểu `SfiaMappingRecord[]` (`DataTag`). Do đó `queryClient.getQueryData(targetQuery.queryKey)` và `queryClient.setQueryData(targetQuery.queryKey, ...)` tự động suy luận đúng kiểu dữ liệu mà không cần truyền generic thủ công.
- Mở hộp thoại xác nhận bằng `modals.openConfirmModal` (`confirmProps: { color: 'danger' }`), thực hiện cập nhật lạc quan trong `onMutate`, hoàn tác (rollback) trong `onError`, và đồng bộ lại với server trong `onSettled`.

```tsx
'use client'

import { ActionIcon, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconTrash } from '@tabler/icons-react'
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { z } from 'zod'

// --- Tầng 1: Schema, queryOptions() Factory & Mutation Service ---
const sfiaMappingSchema = z.object({
  id: z.string(),
  skillCode: z.string(),
  skillName: z.string(),
})

export type SfiaMappingRecord = z.infer<typeof sfiaMappingSchema>

async function fetchSfiaMappings(
  socCode: string,
  signal?: AbortSignal
): Promise<SfiaMappingRecord[]> {
  const response = await fetch(
    `/api/v1/onet/admin/occupations/${encodeURIComponent(socCode)}/sfia-mappings`,
    { credentials: 'include', signal }
  )
  if (!response.ok) {
    throw new Error('Không thể tải danh sách ánh xạ kỹ năng SFIA.')
  }
  const raw: unknown = await response.json()
  return z.array(sfiaMappingSchema).parse(raw)
}

async function deleteSfiaMappingRequest(params: {
  socCode: string
  mappingId: string
}): Promise<void> {
  const response = await fetch(
    `/api/v1/onet/admin/occupations/${encodeURIComponent(params.socCode)}/sfia-mappings/${encodeURIComponent(params.mappingId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }
  )
  if (!response.ok) {
    throw new Error('Không thể xóa ánh xạ kỹ năng trên máy chủ.')
  }
}

export const sfiaMappingQueries = {
  all: () => ['onet-admin', 'sfia-mappings'] as const,
  byOccupation: (socCode: string) =>
    queryOptions({
      queryKey: ['onet-admin', 'sfia-mappings', socCode] as const,
      queryFn: ({ signal }) => fetchSfiaMappings(socCode, signal),
      staleTime: 60_000,
    }),
}

// --- Tầng 2: Mantine v9 Component với Optimistic Delete & Confirm Modal ---
export function SfiaMappingListWithOptimisticDelete({
  socCode,
  mappings,
}: {
  socCode: string
  mappings: SfiaMappingRecord[]
}) {
  const queryClient = useQueryClient()
  const occupationMappingsQuery = sfiaMappingQueries.byOccupation(socCode)

  const deleteMappingMutation = useMutation({
    mutationFn: (mappingId: string) =>
      deleteSfiaMappingRequest({ socCode, mappingId }),
    onMutate: async (mappingId) => {
      await queryClient.cancelQueries({
        queryKey: occupationMappingsQuery.queryKey,
      })

      // Tự động suy luận kiểu SfiaMappingRecord[] nhờ DataTag từ queryOptions()
      const previousMappings = queryClient.getQueryData(
        occupationMappingsQuery.queryKey
      )

      queryClient.setQueryData(occupationMappingsQuery.queryKey, (old = []) =>
        old.filter((item) => item.id !== mappingId)
      )

      return { previousMappings }
    },
    onError: (err, _mappingId, context) => {
      if (context?.previousMappings) {
        queryClient.setQueryData(
          occupationMappingsQuery.queryKey,
          context.previousMappings
        )
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
      await queryClient.invalidateQueries({
        queryKey: occupationMappingsQuery.queryKey,
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

## 6. Pattern 5 — Đồng Bộ Realtime SSE (`EventSource`) & Parallel Prefetching Vào `QueryClient` Cache

- **Tuân thủ `cache-single-source` (`tanstack-integration-best-practices`):** Không tạo thêm `useState` để lưu bản sao dữ liệu tiến độ SSE. Khi `EventSource` nhận sự kiện tiến độ chấm điểm AI, xác thực payload bằng **Zod v4** rồi ghi thẳng vào `queryClient.setQueryData(evaluationQueries.progress(sessionId).queryKey, parsed.data)`. Component UI chỉ cần đọc từ `useQuery(evaluationQueries.progress(sessionId))`.
- **Parallel Prefetching (`flow-loader-query-pattern`):** Khi cần nạp trước nhiều tài nguyên độc lập vào cache (ví dụ chi tiết phiên và tiến độ chấm điểm), sử dụng `await Promise.all([queryClient.ensureQueryData(...), queryClient.ensureQueryData(...)])` để triệt tiêu request waterfall.

```ts
// Đồng bộ trực tiếp SSE (EventSource) & Parallel ensureQueryData vào TanStack QueryClient Cache
'use client'

import { useEffect } from 'react'
import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { z } from 'zod'

const evaluationProgressSchema = z.object({
  totalTurns: z.number().int().nonnegative(),
  evaluatedTurns: z.number().int().nonnegative(),
  progressPercent: z.number().min(0).max(100),
  reportReady: z.boolean(),
})

export type EvaluationProgress = z.infer<typeof evaluationProgressSchema>

async function fetchEvaluationProgress(
  sessionId: string,
  signal?: AbortSignal
): Promise<EvaluationProgress> {
  const response = await fetch(
    `/api/v1/sessions/${encodeURIComponent(sessionId)}/feedback-progress`,
    { credentials: 'include', signal }
  )
  if (!response.ok) {
    throw new Error('Không thể tải tiến độ đánh giá.')
  }
  const raw: unknown = await response.json()
  return evaluationProgressSchema.parse(raw)
}

export const evaluationQueries = {
  all: () => ['sessions'] as const,
  progress: (sessionId: string) =>
    queryOptions({
      queryKey: ['sessions', 'detail', sessionId, 'progress'] as const,
      queryFn: ({ signal }) => fetchEvaluationProgress(sessionId, signal),
      staleTime: Infinity,
    }),
  report: (sessionId: string) =>
    ['sessions', 'detail', sessionId, 'report'] as const,
}

export async function prefetchSessionEvaluationData(
  queryClient: QueryClient,
  sessionId: string
): Promise<void> {
  await Promise.all([
    queryClient.ensureQueryData(evaluationQueries.progress(sessionId)),
  ])
}

export function useEvaluationProgressStream(
  sessionId: string,
  streamUrl: string,
  enabled = true
) {
  const queryClient = useQueryClient()
  const progressOptions = evaluationQueries.progress(sessionId)

  useEffect(() => {
    if (!enabled || !sessionId || !streamUrl) return

    const source = new EventSource(streamUrl, { withCredentials: true })

    source.addEventListener('session.feedback_progress', (event) => {
      try {
        const parsed = evaluationProgressSchema.safeParse(
          JSON.parse((event as MessageEvent<string>).data)
        )
        if (parsed.success) {
          // Single Source of Truth: ghi thẳng vào QueryClient cache
          queryClient.setQueryData(progressOptions.queryKey, parsed.data)
        }
      } catch {
        // Bỏ qua gói dữ liệu SSE không hợp lệ
      }
    })

    source.addEventListener('report.ready', () => {
      void queryClient.invalidateQueries({
        queryKey: evaluationQueries.report(sessionId),
      })
      void queryClient.invalidateQueries({
        queryKey: evaluationQueries.all(),
      })
      source.close()
    })

    return () => {
      source.close()
    }
  }, [enabled, progressOptions.queryKey, queryClient, sessionId, streamUrl])

  // Đọc trực tiếp từ QueryClient cache thay vì tạo useState trùng lặp
  return useQuery({
    ...progressOptions,
    enabled: Boolean(sessionId) && enabled,
  })
}
```
