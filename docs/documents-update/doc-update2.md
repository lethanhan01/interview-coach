
# Kế Hoạch Triển Khai Tinh Gọn: Chuẩn Hóa Tài Liệu & Chuyển Đổi Sang Mantine UI v9 + TanStack Query v5 + Zod v4

## 1. Mục Tiêu & Chiến Lược Tổng Thể (Executive Summary)

Dự án **InterviewCoach Frontend (`client/`)** chuyển đổi triệt để tầng Server State, Data Fetching và API Contract từ `swr` v2 + `client/services/*.service.ts` thủ công sang bộ ba công nghệ chuẩn mực:
Dự án **InterviewCoach Frontend (`client/`)** chuyển đổi tầng quản lý Server State từ `swr` v2 sang **TanStack Query v5 (`@tanstack/react-query`)** theo kiến trúc **Tinh Gọn (1-Hop Direct REST)** — kết hợp trực tiếp với **Mantine UI v9**, **`@mantine/form` + Zod v4** và tầng **`client/services/*.service.ts` + `client/lib/api-client.ts`** hiện có:

- **UI & Design System:** **Mantine UI v9 (`^9.8.2`)** — Mantine-First, Zero-Hex Semantic-Only (`client/theme.ts`), `@mantine/form` (`uncontrolled`) + Zod v4, `@mantine/hooks`, `@mantine/notifications`, `@mantine/modals`, `@mantine/dropzone`, và các mẫu giao diện chuẩn hóa từ `https://ui.mantine.dev/`.
- **End-to-End Type-Safe RPC & Contract Layer:** **tRPC v11 (`@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`)** + `superjson` đặt tại tầng **Next.js 16 App Router BFF (`/api/trpc/[trpc]`)**, xác thực input bằng **Zod v4 schemas** colocated trong `client/trpc/schemas/*` và ủy quyền sang NestJS Backend (`:3000/api/v1/*`).
- **Async Server State & RSC Hydration Layer:** **TanStack Query v5 (`@tanstack/react-query`)** hỗ trợ đầy đủ **React 19 Server Components (RSC) Prefetch + `<HydrateClient>`**, Client Query/Mutation Options (`trpc.<domain>.<proc>.queryOptions()` / `mutationOptions()`), Optimistic Updates và đồng bộ Realtime trực tiếp từ **SSE (`EventSource`)** vào `QueryClient` cache.
- **UI & Design System:** **Mantine UI v9 (`^9.8.2`)** — Mantine-First, Zero-Hex Semantic-Only (`client/theme.ts`), `@mantine/form` (`mode: 'uncontrolled'`) + **Zod v4 (`^4.4.3`)**, `@mantine/hooks`, `@mantine/notifications`, `@mantine/modals`, `@mantine/dropzone`, và các mẫu giao diện chuẩn hóa từ `https://ui.mantine.dev/`.
- **Async Server State & Caching Layer (Pure Client-Side):** **TanStack Query v5 (`@tanstack/react-query`)** quản lý tập trung trong 1 tệp duy nhất **`client/lib/query-client.tsx`** (`<QueryProvider>`, `makeQueryClient()`, và bộ **`queryKeys` factory** chuẩn hóa cho toàn bộ 10 miền nghiệp vụ), hỗ trợ `useQuery`, `useMutation`, Optimistic Updates, hủy request qua `AbortSignal`, và đồng bộ Realtime trực tiếp từ **SSE (`EventSource`)** vào `QueryClient` cache.
- **HTTP Transport & Domain Services Layer (1-Hop Direct REST):** Giữ nguyên 100% **`client/services/*.service.ts`** và **`client/lib/api-client.ts`** gọi trực tiếp tới **NestJS 11 Backend (`:3000/api/v1/*`)** với một cơ chế duy nhất cho `HttpOnly` Cookie (`credentials: 'include'`), **Browser 401 Silent Refresh**, tự động đính kèm **`Idempotency-Key`**, và chuẩn hóa lỗi **`ApiClientError`**.

### Nguyên Tắc Thực Thi Cốt Lõi (Đã Chốt Qua `/grill-me`)

---

### Các Quyết Định Đơn Giản Hóa Kiến Trúc (Đã Chốt Qua `/grill-me`)

> [!IMPORTANT]
>
> 1. **Chiến lược Docs-First (Tài liệu đi trước — Code theo sau):**
>    - **Chặng 1** tập trung 100% vào việc xây dựng, nâng cấp và hoàn thiện hệ thống tài liệu dự án (`client/docs/docs/`, `client/docs/mantine/`, `AGENTS.md`, `.agents/AGENTS.md`, `.claude/rules/ui-conventions.md`, `client/README.md`) cùng bộ **Catalog Templates Mantine v9 (`ui.mantine.dev`) + tRPC v11 + TanStack Query v5** và công cụ kiểm toán `client/scripts/verify-docs-integrity.mjs`.
>    - Chỉ sau khi hoàn tất Chặng 1 (`npm run verify:docs` đạt 0 errors, 0 warnings) mới bước sang **Chặng 2, 3, 4** để cập nhật mã nguồn cho **tRPC v11 & TanStack Query v5**.
> 2. **Ranh giới Code Migration vs UI Refactoring:**
>    - Ở các chặng cập nhật mã nguồn (Chặng 2–4), **chỉ thay thế tầng dữ liệu** (dựng `client/trpc/*`, thay `useSWR` và các lời gọi `client/services/*` trong hooks/pages/components bằng tRPC + TanStack Query, cập nhật unit tests), **giữ nguyên 100% cấu trúc JSX/HTML/CSS hiện tại của các trang** để chủ động xử lý phần giao diện UI sau theo bộ tài liệu & Mantine Templates mới.
>    - **Phạm vi Playwright E2E (`client/e2e/*.spec.ts`):** Giữ ngoài phạm vi của 4 chặng này (do E2E hiện dùng `page.route('**/api/v1/**')` ở tầng trình duyệt và sẽ được đồng bộ riêng khi nâng cấp UI/E2E). Cổng kiểm thử tự động của 4 chặng là `npm run test:unit` (Vitest 4).
> 3. **Kiến trúc Transport Link, Cookie Forwarding & Per-Request 401 Refresh Mutex (Q11):**
>    - Dùng **`httpBatchLink`** (với `superjson` và `credentials: 'include'`) thay vì `httpBatchStreamLink` tại `client/trpc/client.tsx` để đảm bảo `responseMeta` trong `/api/trpc/[trpc]/route.ts` luôn chuyển tiếp đầy đủ mọi header `Set-Cookie` từ các thủ tục Auth (`login`, `register`, `logout`, `refresh`, `changePassword`) cũng như từ **Server-Side 401 Silent Refresh** về trình duyệt trước khi đóng HTTP response headers.
>    - Tích hợp **Per-Request Refresh Mutex (`refreshPromise`)** trong `BFFRequestContext` (`client/trpc/bff-client.ts`) để khi nhiều procedures trong cùng 1 batch request đồng thời gặp `401`, BFF chỉ gọi `POST /auth/refresh` đúng 1 lần duy nhất, chia sẻ cookie mới cho toàn bộ procedures trong batch retry và không làm hỏng cơ chế Refresh Token Rotation.
>    - Tách bạch `createTRPCContext(opts)` (tạo context độc lập cho mỗi HTTP request tại Route Handler) và `getServerTRPCContext = cache(() => createTRPCContext())` (dùng cho RSC trong `client/trpc/server.tsx`).
>    - Thêm `'/api'` vào `MAINTENANCE_BYPASS_PREFIXES` trong `client/middleware/config.ts` để `maintenanceGuard` không redirect các lời gọi `/api/trpc/*` sang trang HTML `/maintenance`.
> 4. **Chiến lược Zod v4 Input Validation vs Output Typing & DTO Transform (Q12):**
>    - Bắt buộc **100% strict Zod v4 `.input(schema)`** cho mọi procedure có tham số đầu vào.
>    - Chiều đầu ra sử dụng kiểu trả về tĩnh `bffFetch<T>()` cho các endpoints thông thường (tránh lỗi `TRPCError: Output validation failed` trước các trường mở rộng từ Backend hoặc mock fixtures rút gọn trong unit tests), và chỉ dùng Zod `.output()` / `.transform()` (với `.loose()`) tại các biên cần chuẩn hóa cấu trúc DTO (`onetAdmin.occupationDetail`, `onetAdmin.sfiaLibrary`).
> 5. **Bảo toàn Hạ Tầng `client/lib/api-client.ts`, Di Chuyển Domain Types & Đồng Bộ 10 Component Unit Tests (Q13):**
>    - Giữ lại `client/lib/api-client.ts` (và `client/lib/__tests__/api-client.test.ts`) làm tầng low-level cung cấp `ApiClientError`, `API_ERROR_MESSAGES`, `API_BASE_URL`, `getApiBaseUrl`, và cơ chế Browser 401 Silent Refresh + `Idempotency-Key` cho `client/lib/media-client.ts` (nâng cấp cả `transcribeAudio` lẫn `synthesizeSpeech` đều có 401 Silent Refresh).
>    - Chuyển toàn bộ các domain types đang khai báo trong `client/services/*` (`OnetOccupation`, `OnetTech`, `SfiaSkillFilters`, `SfiaMatrixDataResponse`, `CreateSfiaQuestionPayload`) sang `client/trpc/schemas/*` và re-export tại `client/lib/types.ts`.
>    - Nâng cấp đủ **10 file component unit tests** (gồm 8 file test gọi services + 2 file `QuestionCard.test.tsx` & `VoiceRecorder.test.tsx` gọi `useMediaMutations`) sang `import { render, ... } from '@test-utils'` чтобы mọi component test đều có `QueryClientProvider` và `TRPCProvider` cô lập.
> 6. **Bảo toàn 100% Kiến trúc NestJS Backend (`server/`):**
>    - Không sửa đổi hay phá vỡ 10 Bounded Contexts, 3-Layer Clean Architecture (`server/src/core/architecture.spec.ts`), Guards, Interceptors, hay BullMQ Worker role của `server/`.
> 7. **Loại bỏ hoàn toàn lớp Next.js tRPC BFF Proxy:**
>    - Không dựng Route Handler `/api/trpc/[trpc]`, không tạo 10 BFF routers trùng lặp 1:1 với NestJS Controllers, không cần Server-Side Cookie / `Set-Cookie` passthrough hay BFF 401 Refresh Mutex.
>    - Mọi request (JSON, Multipart `FormData`, Binary Audio `Blob`, và `EventSource` SSE) đều đi **trực tiếp 1 hop từ Trình duyệt tới NestJS (`:3000/api/v1`)** qua một cơ chế xác thực `HttpOnly` cookie và 401 Silent Refresh duy nhất tại `client/lib/api-client.ts`.
> 8. **Pure Client-Side TanStack Query v5 (Không RSC Prefetch / `HydrateClient` / `superjson`):**
>    - Bỏ hoàn toàn lớp RSC Server Prefetch, `HydrateClient`, `superjson` và `server-only`.
>    - Chỉ sử dụng `<QueryProvider>` ở phía Client kết hợp với Mantine `<Skeleton>` cho trạng thái tải dữ liệu, tương thích tự nhiên 100% với cơ chế `HttpOnly` cookie của trình duyệt.
> 9. **Tổ chức tầng dữ liệu tối giản (`client/lib/query-client.tsx` + `client/services/*.service.ts`):**
>    - Giữ nguyên 100% các tệp `client/services/*.service.ts` làm tầng gọi `apiClient`.
>    - Chỉ bổ sung **1 tệp hạ tầng mới duy nhất** `client/lib/query-client.tsx` chứa `makeQueryClient()`, `getQueryClient()`, `<QueryProvider>` và bộ `queryKeys` factory tập trung để các hooks/pages gọi trực tiếp `useQuery` / `useMutation`.
> 10. **Lộ trình 2 Chặng Gọn Nhẹ & Zero-Breakage (Docs-First → Core Setup & Gỡ Bỏ SWR):**
>     - **Chặng 1 (Docs-First):** Hoàn thiện hệ thống tài liệu kiến trúc (`client/docs/mantine/`, `client/docs/docs/`, `AGENTS.md`, `.agents/AGENTS.md`, `.claude/rules/ui-conventions.md`, `client/README.md`) cùng 2 tài liệu mới `04-tanstack-query-guide.md` và `05-mantine-templates-catalog.md`, vượt qua 100% cổng kiểm toán `npm run verify:docs`.
>     - **Chặng 2 (Core TanStack Query v5 & Gỡ Bỏ SWR):** Cài đặt `@tanstack/react-query`, dựng `client/lib/query-client.tsx`, tích hợp vào `RootLayout` / `@test-utils` / Storybook, nâng cấp `useSessions.ts`, `useSessionEvents.ts`, `AuthProvider` (`queryClient.clear()` khi logout/hết phiên) và gỡ bỏ hoàn toàn `swr`. Các trang đang gọi `client/services/*` trực tiếp tiếp tục hoạt động ổn định 100% (Zero-Breakage) và sẽ chuyển dần sang `useQuery` / `useMutation` khi refactor UI sang Mantine v9.
> 11. **Bảo toàn 100% Kiến trúc NestJS Backend (`server/`) & Playwright E2E (`client/e2e/`):**
>     - Không sửa đổi bất kỳ dòng code nào của `server/`.
>     - Toàn bộ các bài kiểm thử Playwright E2E (`page.route('**/api/v1/**')`) giữ nguyên 100% tính tương thích vì trình duyệt vẫn gọi trực tiếp `/api/v1/*`.

---

## 2. Kiến Trúc Kỹ Thuật Đích (Target Technical Architecture)

## 2. Kiến Trúc Kỹ Thuật Đích Tinh Gọn (Simplified Target Technical Architecture)

```mermaid
flowchart TB
    subgraph ClientLayer["Client Layer ('use client' Components & Hooks)"]
        MantineUI["Mantine v9 UI + @mantine/form + Notifications/Modals"]
        TQCache["TanStack Query v5 Cache (QueryClient)"]
        TRPCHooks["useTRPC() -> useQuery(queryOptions) / useMutation(mutationOptions)"]
        MediaHooks["useTranscribeAudioMutation() / useSynthesizeSpeechMutation()"]
        SSEHook["useSessionEvents() (EventSource -> setQueryData / invalidateQueries)"]
    subgraph ClientUI["1. Client UI & Hooks Layer ('use client')"]
        MantineUI["Mantine v9 UI + @mantine/form (Zod v4)<br/>Notifications / Modals / Dropzone / Skeleton"]
        TQHooks["TanStack Query v5 Hooks<br/>useQuery() / useMutation() + queryKeys"]
        TQCache["QueryClient Cache (client/lib/query-client.tsx)<br/>staleTime: 30s | Smart Retry | queryClient.clear() on Logout"]
        SSEHook["useSessionEvents() Hook<br/>EventSource -> setQueryData / invalidateQueries"]
    end

    subgraph NextBFF["Next.js 16 App Router BFF Layer (client/trpc/ & app/api/trpc/)"]
        RSCPrefetch["Server Components (page.tsx)<br/>prefetch(trpc.*.queryOptions()) + HydrateClient"]
        RouteHandler["app/api/trpc/[trpc]/route.ts<br/>fetchRequestHandler + responseMeta Set-Cookie Forwarding"]
        AppRouter["appRouter (10 Domain Sub-Routers)<br/>Strict Zod v4 Input Schemas + DTO Transforms + SuperJSON"]
        BFFAdapter["bffFetch() Upstream Adapter<br/>HttpOnly Cookie Forward + Per-Request 401 Refresh Mutex + Idempotency-Key + Error Mapper"]
    subgraph ServiceLayer["2. Domain Services & HTTP Client Layer (client/services/ & client/lib/)"]
        Services["client/services/*.service.ts (10 Domain Services)<br/>auth, user, candidateProfile, prep, rubric, session, onet, onetAdmin, sfiaAdmin, media"]
        ApiClient["client/lib/api-client.ts<br/>credentials: 'include' + Single 401 Silent Refresh + Idempotency-Key + ApiClientError"]
    end

    subgraph BrowserDirect["Browser Non-JSON Adapters (client/lib/)"]
        MediaClient["lib/media-client.ts + lib/api-client.ts<br/>FormData STT & Binary Blob TTS + 401 Silent Refresh"]
        SSEClient["lib/sse-client.ts<br/>createSessionEventSource (withCredentials)"]
    end

    subgraph NestServer["NestJS 11 Backend (server/ :3000/api/v1)"]
    subgraph NestServer["3. NestJS 11 Backend (server/ :3000/api/v1)"]
        NestREST["REST Controllers + Guards + IdempotencyInterceptor + ExceptionFilter"]
        NestSSE["@Sse('/sessions/:id/events')"]
        NestMedia["POST /media/transcribe (Multipart)<br/>POST /media/synthesize (Audio Stream)"]
        NestMedia["POST /media/transcribe (Multipart)<br/>POST /media/synthesize (Audio Blob)"]
    end

    MantineUI --> TRPCHooks
    MantineUI --> MediaHooks
    MantineUI --> TQHooks
    MantineUI --> SSEHook
    TRPCHooks <--> TQCache
    MediaHooks <--> TQCache
    TQHooks <--> TQCache
    SSEHook -- "Đồng bộ trực tiếp cache" --> TQCache

    RSCPrefetch -- "Direct Server Caller (getServerTRPCContext, 0 HTTP hop)" --> AppRouter
    RSCPrefetch -- "DehydratedState (SuperJSON)" --> TQCache
    TRPCHooks -- "httpBatchLink (/api/trpc, credentials: include)" --> RouteHandler
    RouteHandler --> AppRouter
    AppRouter --> BFFAdapter
    BFFAdapter -- "HTTP JSON + Cookies + Idempotency-Key" --> NestREST

    MediaHooks --> MediaClient
    MediaClient -- "Direct FormData / Binary Blob Fetch" --> NestMedia
    SSEHook --> SSEClient
    SSEClient -- "Direct EventSource" --> NestSSE
    TQHooks --> Services
    Services --> ApiClient
    ApiClient -- "1-Hop Direct HTTP (JSON / FormData / Blob + HttpOnly Cookies)" --> NestREST
    ApiClient -- "Multipart STT / Audio Blob TTS" --> NestMedia
    SSEHook -- "Direct EventSource (withCredentials: true)" --> NestSSE
```

### Bảng Đối Chiếu Mức Độ Tinh Gọn (So Với Kiến Trúc tRPC BFF Cũ)

| Tiêu chí kỹ thuật                       | Kiến trúc tRPC BFF cũ (Phức tạp)                                                                                                              | Kiến trúc Tinh gọn mới (Đã chốt)                                                         |
| :-------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **Số chặng mạng (Network Hops)**        | 2 hops cho JSON (`Browser -> Next.js BFF -> NestJS`), 1 hop cho Media/SSE                                                                     | **1 hop đồng nhất** (`Browser -> NestJS :3000/api/v1`) cho cả JSON, Media và SSE         |
| **Số lượng packages cài thêm**          | 7 packages (`@tanstack/react-query`, `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `superjson`, `server-only`, `client-only`) | **1 package runtime** (`@tanstack/react-query` + `@tanstack/react-query-devtools` ở dev) |
| **Số file hạ tầng phải tạo mới**        | > 25 files (`client/trpc/*`, 10 routers, 10 BFF schemas, `/api/trpc/[trpc]/route.ts`, `bff-client.ts`, `server.tsx`...)                       | **1 file duy nhất** (`client/lib/query-client.tsx`)                                      |
| **Cơ chế Cookie & 401 Silent Refresh**  | 2 cơ chế song song (Server BFF Refresh Mutex + `responseMeta` `Set-Cookie` forwarding VÀ Browser Refresh trong `api-client.ts`)               | **1 cơ chế duy nhất** sẵn có trong `client/lib/api-client.ts`                            |
| **Tầng `client/services/*.service.ts`** | Phải xóa toàn bộ 13 files và viết lại 29 màn hình ngay lập tức                                                                                | **Giữ nguyên 100%**, tái sử dụng trực tiếp làm `queryFn` / `mutationFn` (Zero-Breakage)  |
| **Tương thích Playwright E2E**          | Vỡ `page.route('**/api/v1/**')` do trình duyệt gọi `/api/trpc/*`                                                                              | **Tương thích 100%** không cần sửa E2E mocks                                             |

---

## 3. Lộ Trình Chi Tiết 4 Chặng Thực Thi (Detailed 4-Phase Execution Plan)

## 3. Lộ Trình Chi Tiết 2 Chặng Thực Thi (Detailed 2-Phase Execution Plan)

---

### CHẶNG 1 (DOCS-FIRST): Hoàn Thiện Hệ Thống Tài Liệu Kiến Trúc, Bộ Luật AI & Catalog Templates Mantine v9 + tRPC v11 + TanStack Query v5

### CHẶNG 1 (DOCS-FIRST): Hoàn Thiện Hệ Thống Tài Liệu Kiến Trúc, Bộ Luật AI & Catalog Templates Mantine v9 + TanStack Query v5

Mục tiêu của Chặng 1 là biến `client/docs/` thành nguồn chân lý duy nhất (SSOT) hoàn chỉnh cho bộ ba **Mantine UI v9 + tRPC v11 + TanStack Query v5**, bao gồm cả các mẫu giao diện từ `ui.mantine.dev` kết nối sẵn với tRPC/TanStack Query, và vượt qua 100% cổng kiểm toán `npm run verify:docs`.
Mục tiêu của Chặng 1 là cập nhật `client/docs/` thành nguồn chân lý duy nhất (SSOT) cho kiến trúc **Mantine UI v9 + TanStack Query v5 + `@mantine/form` (Zod v4) + `client/services/*`**, bao gồm bộ mẫu giao diện từ `ui.mantine.dev` và vượt qua 100% cổng kiểm toán `npm run verify:docs`.

#### 1.1. Mở rộng Cẩm Nang Thực Chiến & Catalog Templates trong `client/docs/mantine/`

#### 1.1. Mở Rộng Cẩm Nang Thực Chiến & Catalog Templates Trong `client/docs/mantine/`

##### [NEW] `client/docs/mantine/04-trpc-tanstack-query-guide.md`

##### [NEW] `client/docs/mantine/04-tanstack-query-guide.md`

Cẩm nang thực chiến chuyên sâu kết hợp **Mantine v9 + tRPC v11 + TanStack Query v5** trên Next.js 16 App Router:
Cẩm nang thực chiến kết hợp **Mantine v9 + TanStack Query v5 + `@mantine/form` (Zod v4) + `client/services/*`** trên Next.js 16 App Router:

1. **Kiến trúc BFF & Cấu trúc thư mục `client/trpc/`:** Giải thích chi tiết `init.ts` (tách `createTRPCContext` cho Route Handler và `getServerTRPCContext` cho RSC), `bff-client.ts` (forward `HttpOnly` cookie, **Per-Request 401 Silent Refresh Mutex** + `Set-Cookie` forwarding qua `httpBatchLink` & `responseMeta`, tự động sinh `Idempotency-Key`, chuẩn hóa `TRPCError` chứa `apiError`), `query-client.ts`, `client.tsx`, `server.tsx`.
2. **Pattern 1 — RSC Prefetch + `<HydrateClient>` + Mantine `<Skeleton>`:** Cách prefetch song song trên Server Component (`page.tsx`) và đọc bằng `useQuery(trpc.<domain>.<proc>.queryOptions())` hoặc `useSuspenseQuery` ở Client Component.
3. **Pattern 2 — `@mantine/form` (`uncontrolled`, Zod v4) + tRPC `useMutation` + `@mantine/notifications`:**
   - Dùng chung Zod v4 schema giữa `@mantine/form` (`schemaResolver(schema, { sync: true })`) và tRPC `.input(schema)`.
   - Ánh xạ tự động lỗi validation trả về từ NestJS (`error.data?.apiError?.details`) thẳng vào `form.setErrors(...)` của Mantine Form và hiển thị thông báo qua `notifications.show({ color: 'danger' | 'success', ... })`.
4. **Kiến trúc Client-Side Server State (`client/lib/query-client.tsx` & `client/services/*`):**
   - Cấu hình `makeQueryClient()` (smart retry bỏ qua lỗi `4xx` và `REPORT_NOT_READY`, `staleTime: 30_000`), `<QueryProvider>`, và bộ **`queryKeys` factory tập trung** (`queryKeys.auth`, `queryKeys.sessions`, `queryKeys.prep`, `queryKeys.onet`, `queryKeys.sfia`, `queryKeys.adminUsers`...).
   - Luồng 1-Hop Direct REST qua `client/services/*.service.ts` và `client/lib/api-client.ts` (`credentials: 'include'`, 401 Silent Refresh, `Idempotency-Key`, `ApiClientError`).
5. **Pattern 1 — `useQuery` + `queryKeys` + Mantine `<Skeleton>` / `<Alert color="danger">`:**
   - Cách đọc dữ liệu chuẩn từ `client/services/*` bằng `useQuery({ queryKey: queryKeys.sessions.list(), queryFn: () => sessionService.getSessions() })` và hiển thị `<Skeleton>` không gây layout shift.
6. **Pattern 2 — `@mantine/form` (`uncontrolled`, Zod v4) + `useMutation` + `@mantine/notifications`:**
   - Xác thực form ở client bằng `schemaResolver(zodSchema, { sync: true })`.
   - Ánh xạ tự động lỗi validation trả về từ NestJS (`err instanceof ApiClientError && err.details`) thẳng vào `form.setErrors(...)` của Mantine Form và hiển thị thông báo qua `notifications.show({ color: 'danger' | 'success', ... })`.
7. **Pattern 3 — Mantine `<Combobox>` / `<Select>` Tìm Kiếm Tức Thì (`useDebouncedValue` + TanStack Query `AbortSignal`):**
   - Kết hợp `useDebouncedValue(search, 300)` từ `@mantine/hooks` với `useQuery(trpc.onet.searchOccupations.queryOptions({ query: debounced }))` — TanStack Query tự động hủy request in-flight qua `signal` khi query key thay đổi.
   - Kết hợp `useDebouncedValue(search, 300)` từ `@mantine/hooks` với `useQuery({ queryKey: queryKeys.onet.search(debounced), queryFn: ({ signal }) => onetService.searchOccupations(debounced, 20, signal) })` — TanStack Query tự động hủy request in-flight qua `signal` khi từ khóa thay đổi.
8. **Pattern 4 — Optimistic Updates & `@mantine/modals` (`modals.openConfirmModal`):**
   - Xác nhận xóa/cập nhật bằng `modals.openConfirmModal`, thực hiện cập nhật lạc quan (`onMutate` -> `queryClient.cancelQueries` + `setQueryData`, `onError` -> rollback + `notifications.show`, `onSettled` -> `invalidateQueries`).
9. **Pattern 5 — Đồng bộ Realtime SSE (`EventSource`) & Binary Media (`@mantine/dropzone` / Audio Blob) với TanStack Query Cache:**
   - Cách `useSessionEvents` đẩy dữ liệu trực tiếp vào `queryClient.setQueryData(trpc.session.feedbackProgress.queryKey({ sessionId }), ...)` và `invalidateQueries`.
10. **Pattern 5 — Đồng bộ Realtime SSE (`EventSource`) & Binary Media (`@mantine/dropzone` / Audio Blob) với `QueryClient` Cache:**
    - Cách `useSessionEvents` đẩy dữ liệu trực tiếp vào `queryClient.setQueryData(queryKeys.sessions.feedbackProgress(sessionId), ...)` và `queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) })`.

##### [NEW] `client/docs/mantine/05-mantine-templates-catalog.md`

Bộ **Full-Stack Mantine v9 UI Templates Catalog** (tham khảo & adapt 4 bước Zero-Hex từ `https://ui.mantine.dev/` kết hợp trực tiếp với `useTRPC`, TanStack Query v5 và `@mantine/form` — dùng làm bản thiết kế mẫu khi nâng cấp UI cho toàn bộ ứng dụng):
Bộ **Full-Stack Mantine v9 UI Templates Catalog** (tham khảo & adapt 4 bước Zero-Hex từ `https://ui.mantine.dev/` kết hợp trực tiếp với TanStack Query v5 `useQuery` / `useMutation`, `queryKeys`, `client/services/*` và `@mantine/form` Zod v4 — dùng làm bản thiết kế mẫu khi nâng cấp UI cho các màn hình):

1. **Template Nhóm 1 — Workspace AppShell & Navigation (`ui.mantine.dev/category/navbars/` & `headers/`):**
   - Mẫu `NavbarNested` / `NavbarSimple` + `UserMenu` + `ColorSchemeToggle` dùng `<AppShell>`, `<NavLink component={Link}>`, `<Menu>`, `<Avatar>`, kết nối `trpc.auth.me` và `trpc.auth.logout` (kèm `queryClient.clear()`).
   - Mẫu `NavbarNested` / `NavbarSimple` + `UserMenu` + `ColorSchemeToggle` dùng `<AppShell>`, `<NavLink component={Link}>`, `<Menu>`, `<Avatar>`, kết nối `useAuth()` / `authService` và gọi `queryClient.clear()` khi đăng xuất.
2. **Template Nhóm 2 — Authentication & Security (`ui.mantine.dev/category/authentication/` & `inputs/`):**
   - Mẫu `AuthenticationTitle` (Đăng nhập / Đăng ký / Đặt lại mật khẩu) + `PasswordStrength` (`<PasswordInput>`, `<Progress>`, `<Popover>`) kết nối `@mantine/form` (`uncontrolled`) + `trpc.auth.login` / `register`.
   - Mẫu `AuthenticationTitle` (Đăng nhập / Đăng ký / Đặt lại mật khẩu) + `PasswordStrength` (`<PasswordInput>`, `<Progress>`, `<Popover>`) kết nối `@mantine/form` (`uncontrolled`) + `useMutation` gọi `authService.login` / `register`.
3. **Template Nhóm 3 — Candidate Dashboard, StatsGrid & Session Cards (`ui.mantine.dev/category/stats/` & `cards/`):**
   - Mẫu `StatsGrid` + `SessionCard` (`<UnstyledButton mod={{ active }}>` + `<Paper withBorder>`) + bộ lọc URL (`<SegmentedControl>`, `<TextInput>`) + `<Skeleton>` / EmptyState kết nối `trpc.session.list`.
   - Mẫu `StatsGrid` + `SessionCard` (`<UnstyledButton mod={{ active }}>` + `<Paper withBorder>`) + bộ lọc URL (`<SegmentedControl>`, `<TextInput>`) + `<Skeleton>` / EmptyState kết nối `useSessions()` (`queryKeys.sessions.list()`).
4. **Template Nhóm 4 — Multi-Step Interview Setup Wizard (`mantine.dev/core/stepper/` & `x/dropzone/`):**
   - Mẫu `<Stepper>` 3 bước + `<Dropzone>` tải CV/JD + `<Combobox>` tìm nghề O\*NET + `<Radio.Group>` chọn chế độ phỏng vấn kết nối `trpc.onet.searchOccupations`, `trpc.prep.saveJd`, `trpc.session.create`.
   - Mẫu `<Stepper>` 3 bước + `<Dropzone>` tải CV/JD + `<Combobox>` tìm nghề O\*NET + `<Radio.Group>` chọn chế độ phỏng vấn kết nối `onetService.searchOccupations`, `prepService.saveJobDescription`, `sessionService.createSession`.
5. **Template Nhóm 5 — Live Interview Split-View & STAR Competency Report (`ui.mantine.dev/category/stats/` — `StatsRing` & `Accordion`):**
   - Mẫu Split-View 2 cột (`<Grid>`, `<RingProgress>`, `<Timeline>`, `<Accordion>`, `<Badge color="brand|success|warning|danger">`) kết nối `trpc.session.byId`, `trpc.session.report` và SSE `useSessionEvents`.
   - Mẫu Split-View 2 cột (`<Grid>`, `<RingProgress>`, `<Timeline>`, `<Accordion>`, `<Badge color="brand|success|warning|danger">`) kết nối `sessionService.getSession`, `sessionService.getReport` và SSE `useSessionEvents`.
6. **Template Nhóm 6 — Admin Master-Detail & Server-Paginated Data Table (`ui.mantine.dev/category/tables/`):**
   - Mẫu `<Table.ScrollContainer>` + `<Pagination>` + `<Drawer>` inspection sheet + `keepPreviousData` (`placeholderData`) kết nối `trpc.sfiaAdmin.*`, `trpc.onetAdmin.*`, và `trpc.adminUser.*`.
   - Mẫu `<Table.ScrollContainer>` + `<Pagination>` + `<Drawer>` inspection sheet + `keepPreviousData` (`placeholderData`) kết nối `sfiaAdminService.*`, `onetAdminService.*`, và `userManagementService.*`.
7. **Template Nhóm 7 — Public Hero Landing & System Status Pages (`ui.mantine.dev/category/hero/` & `error-pages/`):**
   - Mẫu Hero Section, Features Grid và Error Banner (`401`, `403`, `429`, `503`, `OfflineBanner` với `useNetwork()`).

##### [MODIFY] [client/docs/mantine/README.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/mantine/README.md), [02-setup-forms-hooks-guide.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/mantine/02-setup-forms-hooks-guide.md), [03-testing-and-tooling.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/mantine/03-testing-and-tooling.md)

- Cập nhật bảng Stack trong `client/docs/mantine/README.md`: Thay `swr` bằng `@tanstack/react-query` (`^5`), `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query` (`^11`), `superjson`; bổ sung mục lục liên kết tới `04-trpc-tanstack-query-guide.md` và `05-mantine-templates-catalog.md`.
- Cập nhật `02-setup-forms-hooks-guide.md`: Minh họa `RootLayout` bọc `<TRPCReactProvider>`, ví dụ `useDebouncedValue` kết hợp `useQuery(trpc.onet.searchOccupations.queryOptions(...))`.
- Cập nhật `03-testing-and-tooling.md`: Minh họa `test-utils/render.tsx` bọc `<QueryClientProvider>` (với `retry: false`, `gcTime: 0`) + `<TRPCProvider>` để test mọi component gọi tRPC hooks.
- Cập nhật bảng Stack trong `client/docs/mantine/README.md`: Thay `swr` (`^2.4.1`) bằng `@tanstack/react-query` (`^5`); bổ sung mục lục liên kết tới `04-tanstack-query-guide.md` và `05-mantine-templates-catalog.md`.
- Cập nhật `02-setup-forms-hooks-guide.md`: Minh họa `RootLayout` bọc `<QueryProvider>`, ví dụ `useDebouncedValue` kết hợp `useQuery` + `queryKeys.onet.search(debounced)`.
- Cập nhật `03-testing-and-tooling.md`: Minh họa `test-utils/render.tsx` tạo `QueryClient` cô lập cho mỗi bài test (`retry: false`, `gcTime: 0`) bọc quanh `<MantineProvider>`.

---

#### 1.2. Nâng Cấp Đồng Bộ 16 Chuyên Đề SSOT Trong `client/docs/docs/`

#### 1.2. Nâng Cấp Đồng Bộ Các Chuyên Đề SSOT Trong `client/docs/docs/`

Mọi thay đổi trong `client/docs/docs/` tuân thủ nghiêm ngặt **Unified 6-Part Anatomy**, **Zero Raw-Icon Typography**, **Zero Client Code Extraction** (code block tự chứa hoặc chỉ import từ các canonical aliases trong `ALLOWED_INTERNAL_ALIASES`), và bảo toàn đúng **131 Core Rule IDs (+ 18 Vercel Sub-Rules)**:
Mọi thay đổi trong `client/docs/docs/` tuân thủ nghiêm ngặt **Unified 6-Part Anatomy**, **Zero Raw-Icon Typography**, **Zero Client Code Extraction**, và bảo toàn đúng **131 Core Rule IDs (+ 18 Vercel Sub-Rules)**:

1. **[MODIFY] [client/docs/docs/README.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/README.md) (Master Hub):**
   - Cập nhật Mindmap (`State TanStack Query & SSE`, `API Contracts & tRPC BFF`).
   - Cập nhật bảng Bối cảnh kỹ thuật mục `Data, State & Forms`: `@tanstack/react-query` `^5`, `@trpc/server` / `@trpc/client` / `@trpc/tanstack-react-query` `^11`, `superjson`, SSE `EventSource`, `@mantine/form` (`uncontrolled`) + `zod` `^4.4.3`.
   - Cập nhật bảng Sitemap cho Chuyên đề 03 (`State Management`) và Chuyên đề 11 (`API Contracts & Resilience`).
   - Cập nhật Mindmap (`State TanStack Query & SSE`) và bảng Bối cảnh kỹ thuật mục `Data, State & Forms`: `@tanstack/react-query` `^5`, SSE `EventSource`, Minimal React Context, Next.js URL params, `@mantine/form` (`uncontrolled`) + `zod` `^4.4.3`.
   - Cập nhật bảng Sitemap cho Chuyên đề 03 (`State Management`).
2. **[MODIFY] [client/docs/docs/QUICK_REFERENCE.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/QUICK_REFERENCE.md):**
   - Tiêu chí DoD số 5: Đổi từ `State & SWR` sang `State, tRPC & TanStack Query` (không fetch trong `useEffect`, đọc dữ liệu qua `useQuery(trpc.<domain>.<proc>.queryOptions())` hoặc RSC `prefetch` + `<HydrateClient>`).
   - **Recipe 3:** Thay công thức SWR v2 bằng **Công thức Chuẩn tRPC v11 + TanStack Query v5 Hook & Mutation Tự Chứa**.
   - Bảng ma trận 131 Rule IDs & Bảng Tóm Tắt Quy Tắc Cốt Lõi: Cập nhật mô tả ngắn của `API-001`, `API-007`, `API-008`, `API-009`, `API-012`, `SEC-010`, `PERF-009` sang kiến trúc tRPC BFF + TanStack Query v5 (giữ nguyên tên rule gốc `client-swr-dedup` ở dòng ánh xạ skill `vercel-react-best-practices` để khớp `HARD_BANNED_PHRASES`).
3. **[MODIFY] [client/docs/docs/01-foundations/architecture-and-structure.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/01-foundations/architecture-and-structure.md):**
   - Cập nhật sơ đồ Mermaid luồng phụ thuộc một chiều: `app/ (RSC prefetch + HydrateClient)` → `components/ (Mantine v9)` → `hooks/ (TanStack Query, SSE, Domain Hooks)` → `trpc/ (tRPC v11 Client/Server Proxy & 10 BFF Routers + Zod v4 Schemas)` → `bffFetch (NestJS Upstream)`.
   - Cập nhật cây thư mục mục tiêu `client/`: Thêm `trpc/` (`init.ts`, `bff-client.ts`, `query-client.ts`, `client.tsx`, `server.tsx`, `routers/`, `schemas/`) và `app/api/trpc/[trpc]/route.ts`; ghi rõ `lib/api-client.ts`, `lib/media-client.ts` và `lib/sse-client.ts` đảm nhận hạ tầng lỗi `ApiClientError` và luồng Binary/SSE.
4. **[MODIFY] [client/docs/docs/01-foundations/state-management.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/01-foundations/state-management.md):**
   - Viết lại toàn diện **Mục 2.1 (Lớp 1 — Server State Với TanStack Query v5 & tRPC v11)**:
     - Cách dùng `useTRPC()`, `queryOptions()`, `mutationOptions()`, RSC `prefetch()` + `<HydrateClient>`.
     - Tự động sinh typed query keys từ tRPC (`trpc.session.list.queryKey()`, `trpc.session.byId.queryKey({ sessionId })`) thay cho SWR Key Factory thủ công.
   - Tiêu chí DoD số 5: Đổi từ `State & SWR` sang `State & TanStack Query` (đọc dữ liệu server qua `useQuery` + `queryKeys` factory và `client/services/*`).
   - **Recipe 3:** Thay công thức SWR v2 bằng **Công thức Chuẩn TanStack Query v5 (`useQuery` / `useMutation` + `queryKeys` Factory) Tự Chứa**.
   - Cập nhật mô tả ngắn của `API-009`, `API-012`, `SEC-010`, `PERF-009` sang TanStack Query v5 (`QueryClient`, `queryKeys`, `queryClient.clear()`) trong khi giữ nguyên tên rule gốc `client-swr-dedup` ở dòng ánh xạ skill `vercel-react-best-practices`.
5. **[MODIFY] [client/docs/docs/01-foundations/state-management.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/01-foundations/state-management.md):**
   - Viết lại **Mục 2.1 (Lớp 1 — Server State Với TanStack Query v5 & `queryKeys` Factory)**:
     - Cách dùng `useQuery`, `useMutation`, `useQueryClient` kết hợp `queryKeys` factory và `client/services/*.service.ts`.
   - Viết lại **Mục 3 (Realtime Stream State — SSE `EventSource` & Đồng Bộ TanStack `QueryClient` Cache)**:
     - Ví dụ tự chứa minh họa `queryClient.setQueryData` khi nhận event tiến độ AI và `queryClient.invalidateQueries` khi báo cáo hoàn tất.
   - Viết lại **Mục 4.2 (Optimistic Updates & Chống Race Conditions Với TanStack Query v5)**:
     - Mẫu `onMutate` (cancel in-flight queries + snapshot + optimistic `setQueryData`), `onError` (rollback + Mantine `notifications.show`), `onSettled` (`invalidateQueries`).
6. **[MODIFY] [client/docs/docs/03-quality-and-security/api-contracts-and-resilience.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/03-quality-and-security/api-contracts-and-resilience.md):**
   - Cập nhật Sequence Diagram: `Mantine UI / tRPC Hook` → `Next.js BFF (/api/trpc/[trpc] via httpBatchLink)` → `tRPC Procedure (Strict Zod v4 Input + DTO Transform)` → `bffFetch (Cookie Forward + Per-Request 401 Silent Refresh Mutex + Set-Cookie + Idempotency-Key)` → `NestJS Backend (/api/v1)`.
   - Cập nhật nội dung chi tiết 12 quy chuẩn `API-001`..`API-012`:
     - `API-001`: End-to-End Contract-First với tRPC v11 `AppRouter` + Zod v4 schemas đối chiếu OpenAPI của `server/`.
     - `API-002`: Chuẩn hóa `ApiClientError` & tRPC `errorFormatter` (`shape.data.apiError`).
     - `API-003`: Tiếp nhận & chuyển tiếp `AbortSignal` tự động từ TanStack Query `queryFn` context xuống `trpc` link & `bffFetch`.
     - `API-004`: Tự động đính kèm `Idempotency-Key` cho mọi tRPC `mutation` tại `bffFetch` (và `media-client.ts`) cùng retry thích ứng trên `QueryClient`.
     - `API-007`: Cấm hardcode URL trong components; 100% JSON calls đi qua `trpc.<domain>.<proc>`, chỉ Binary/SSE đi qua `lib/media-client.ts` & `lib/sse-client.ts`.
     - `API-008`: Xác thực strict 100% `.input(zodSchema)` tại tRPC procedure; kết hợp `bffFetch<T>()` và Zod `.output()` / `.transform()` (với `.loose()`) cho các payload cần chuẩn hóa cấu trúc DTO.
     - `API-009`: Phân tầng `staleTime`, `gcTime`, và `refetchOnWindowFocus` trên TanStack Query theo độ biến động dữ liệu (5s cho phiên active, 60s cho danh mục SFIA/O\*NET/Rubric).
     - `API-012`: Khử trùng lặp request tự động qua TanStack Query Cache & tRPC HTTP Batch Link (`httpBatchLink`).
7. **[MODIFY] Các chuyên đề có tham chiếu liên đới:**
   - [01-foundations/coding-standards.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/01-foundations/coding-standards.md) (bảng điều hướng liên kết).
   - [02-ui-and-design-system/component-patterns.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/02-ui-and-design-system/component-patterns.md) (RSC/Client Container split với `useQuery` / `HydrateClient`).
   - [02-ui-and-design-system/view-transitions-and-motion.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/02-ui-and-design-system/view-transitions-and-motion.md) (`Suspense` + TanStack Query).
   - [03-quality-and-security/security-and-auth.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/03-quality-and-security/security-and-auth.md) (`SEC-008` BFF Refresh & `SEC-010` Session Purge gọi `queryClient.clear()`).
   - [03-quality-and-security/testing-and-qa.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/03-quality-and-security/testing-and-qa.md) (kiểm thử tRPC routers bằng `createCallerFactory` và component tests với `@test-utils`).
   - [04-performance-and-ops/performance-and-web-vitals.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/04-performance-and-ops/performance-and-web-vitals.md) (`PERF-009` độ hạt TanStack Query key & `select` option chống re-render).
     - Mẫu `onMutate` (`cancelQueries` + snapshot + `setQueryData`), `onError` (rollback + Mantine `notifications.show`), `onSettled` (`invalidateQueries`).
8. **[MODIFY] [client/docs/docs/03-quality-and-security/api-contracts-and-resilience.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/03-quality-and-security/api-contracts-and-resilience.md):**
   - Cập nhật Sequence Diagram và các quy chuẩn `API-003` (truyền `AbortSignal` từ TanStack Query `queryFn` xuống `services/*` & `apiClient`), `API-009` (`staleTime` & `gcTime` theo độ biến động dữ liệu), `API-012` (khử trùng lặp request tự động qua TanStack Query Cache & `queryKeys`).
9. **[MODIFY] Các chuyên đề có tham chiếu `useSWR` / `SWR`:**
   - [01-foundations/architecture-and-structure.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/01-foundations/architecture-and-structure.md) (bảng phân tách Server/Client Component và cây thư mục thêm `lib/query-client.tsx`).
   - [02-ui-and-design-system/component-patterns.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/02-ui-and-design-system/component-patterns.md) (Client Container dùng `useQuery` / `useMutation`).
   - [03-quality-and-security/security-and-auth.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/03-quality-and-security/security-and-auth.md) (`SEC-010` gọi `queryClient.clear()` khi logout hoặc `auth:session-expired`).
   - [04-performance-and-ops/performance-and-web-vitals.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/docs/docs/04-performance-and-ops/performance-and-web-vitals.md) (`PERF-009` độ hạt `queryKeys` & tùy chọn `select` chống re-render).

---

#### 1.3. Cập Nhật Linter Kiểm Toán Tài Liệu & Bộ Luật AI Agents

##### [MODIFY] [client/scripts/verify-docs-integrity.mjs](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/scripts/verify-docs-integrity.mjs)

- Mở rộng `ALLOWED_INTERNAL_ALIASES` (dòng 31) để cho phép các canonical BFF, testing và media/SSE entrypoints trong code block tài liệu:
- Mở rộng `ALLOWED_INTERNAL_ALIASES` để cho phép `@/lib/query-client` và `@/lib/api-client` trong các đoạn code mẫu tài liệu:
  ```js
  const ALLOWED_INTERNAL_ALIASES = new Set([
    "@/theme",
    "@test-utils",
    "@/trpc/client",
    "@/trpc/server",
    "@/trpc/query-client",
    "@/trpc/init",
    "@/trpc/bff-client",
    "@/trpc/routers/_app",
    "@/lib/api-client",
    "@/lib/media-client",
    "@/lib/sse-client",
    "@/hooks/useMediaMutations",
  ]);
    '@/theme',
    '@test-utils',
    '@/lib/query-client',
    '@/lib/api-client',
  ])
  ```
- Thêm `04-trpc-tanstack-query-guide.md` và `05-mantine-templates-catalog.md` vào mảng `TARGET_MANTINE_FILES` và `REQUIRED_KEYWORDS_BY_FILE`:
  - `'docs/mantine/04-trpc-tanstack-query-guide.md'`: `['tRPC', 'TanStack Query', 'useTRPC', 'queryOptions', 'mutationOptions', 'HydrateClient', 'superjson']`
  - `'docs/mantine/05-mantine-templates-catalog.md'`: `['AppShell', 'Stepper', 'Dropzone', 'Table.ScrollContainer', 'RingProgress', 'useTRPC']`
- Thêm `04-tanstack-query-guide.md` và `05-mantine-templates-catalog.md` vào `TARGET_MANTINE_FILES` và `REQUIRED_KEYWORDS_BY_FILE`:
  - `'docs/mantine/04-tanstack-query-guide.md'`: `['TanStack Query', 'useQuery', 'useMutation', 'QueryClient', 'queryKeys', 'AbortSignal']`
  - `'docs/mantine/05-mantine-templates-catalog.md'`: `['AppShell', 'Stepper', 'Dropzone', 'Table.ScrollContainer', 'RingProgress', 'useQuery']`
- Cập nhật `REQUIRED_KEYWORDS_BY_FILE` của:
  - `'docs/docs/01-foundations/state-management.md'`: Thay `'SWR'`, `'useSWR'`, `'Key Factory'` bằng `'TanStack Query'`, `'tRPC'`, `'QueryClient'`, `'useSearchParams'`, `'@mantine/hooks'`, `'Derived State'`, `'AbortController'`, `'EventSource'`.
  - `'docs/docs/03-quality-and-security/api-contracts-and-resilience.md'`: Thay `'SWR'` bằng `'tRPC'`, `'TanStack Query'`, `'Idempotency-Key'`, `'ApiClientError'`, `'AbortController'`, `'useNetwork'`, `'Target Standard'`.
  - `'docs/docs/01-foundations/state-management.md'`: Thay `'SWR'`, `'useSWR'` bằng `'TanStack Query'`, `'useQuery'`, `'QueryClient'`, `'queryKeys'`, `'useSearchParams'`, `'@mantine/hooks'`, `'Derived State'`, `'AbortController'`, `'EventSource'`.
  - `'docs/docs/03-quality-and-security/api-contracts-and-resilience.md'`: Thay `'SWR'` bằng `'TanStack Query'`, `'Idempotency-Key'`, `'ApiClientError'`, `'AbortController'`, `'useNetwork'`, `'Target Standard'`.
- Trong `SOFT_WARN_PHRASES` & `SOFT_WARN_EXCLUSION_RE`:
  - Gỡ bỏ cảnh báo cũ đối với `'TanStack Query'` (vì nay là chuẩn chính thức).
  - Thêm cảnh báo cho `'useSWR'` (`/\buseSWR\b/`) và `'SWR'` (`/\bSWR\b/`), đồng thời bổ sung `client-swr-dedup` vào `SOFT_WARN_EXCLUSION_RE` để không cảnh báo nhầm khi tài liệu dẫn chiếu tên rule gốc của skill `vercel-react-best-practices`.
  - Thêm cảnh báo cho `'useSWR'` (`/\buseSWR\b/`), đồng thời bổ sung `client-swr-dedup` vào `SOFT_WARN_EXCLUSION_RE`.

##### [MODIFY] [AGENTS.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/AGENTS.md), [.agents/AGENTS.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/.agents/AGENTS.md), [.claude/rules/ui-conventions.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/.claude/rules/ui-conventions.md), [client/README.md](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/README.md)

- Cập nhật danh mục công nghệ chuẩn: **Mantine UI v9 + Next.js 16 App Router + TanStack Query v5 + tRPC v11 + Zod v4**.
- Bổ sung quy tắc Data Fetching & BFF RPC bắt buộc cho AI Agents:
  - 100% JSON data fetching & mutations đi qua `client/trpc/` (`useTRPC`, `queryOptions`, `mutationOptions`, RSC `prefetch` + `<HydrateClient>`).
  - Không dùng `swr`, không gọi `fetch` trực tiếp trong `useEffect`, không tạo thêm REST service JSON rời rạc trong `client/services/`.
- Cập nhật danh mục công nghệ chuẩn: Thay `swr` (`^2.4.1`) bằng `@tanstack/react-query` (`^5`).
- Ghi rõ quy tắc Server State: Dùng `@tanstack/react-query` (`useQuery`, `useMutation`, `queryKeys` từ `@/lib/query-client`) kết hợp với `client/services/*.service.ts` và `client/lib/api-client.ts`.

> **Cổng nghiệm thu Chặng 1:** Chạy `npm run verify:docs` và `npm run format:check` tại `client/` đạt **0 errors, 0 warnings**.

---

### CHẶNG 2: Xây Dựng Hạ Tầng Core tRPC v11 BFF + TanStack Query v5 (`client/trpc/`)

### CHẶNG 2: Cài Đặt TanStack Query v5, Dựng `client/lib/query-client.tsx`, Nâng Cấp Core Hooks & Gỡ Bỏ Hoàn Toàn `swr`

Mục tiêu của Chặng 2 là cài đặt dependencies và dựng toàn bộ khung xương sống của tRPC v11 + TanStack Query v5, bao gồm `bffFetch` adapter (với Per-Request 401 Refresh Mutex), Route Handler `/api/trpc/[trpc]`, RSC Hydration helpers, Middleware bypass cho `/api`, RootLayout provider, `@test-utils` wrapper, Storybook decorator, và bộ unit test cho hạ tầng BFF.
Mục tiêu của Chặng 2 là đưa TanStack Query v5 vào vận hành thực tế trên `client/` với độ phức tạp tối thiểu (chỉ thêm 1 file `client/lib/query-client.tsx`), thay thế `useSWR` trong `useSessions.ts`, đồng bộ SSE cache trong `useSessionEvents.ts`, dọn cache khi đăng xuất trong `AuthProvider`, và gỡ bỏ hoàn toàn `swr` mà không làm gãy bất kỳ trang hay bài test hiện hữu nào.

#### 2.1. Cài Đặt Packages (`client/package.json`)

#### 2.1. Cập Nhật Dependencies (`client/package.json`)

- **Dependencies:** `@tanstack/react-query`, `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `superjson`, `server-only`, `client-only`.
- **DevDependencies:** `@tanstack/react-query-devtools`.
- **Cài đặt:** `@tanstack/react-query` (`^5.x`) vào `dependencies` và `@tanstack/react-query-devtools` (`^5.x`) vào `devDependencies`.
- **Gỡ bỏ:** `swr` khỏi `dependencies` (`npm uninstall swr`).

#### 2.2. Chi Tiết Các Tệp Hạ Tầng Trong `client/trpc/`, `client/app/api/trpc/` & `client/middleware/`

#### 2.2. Xây Dựng Hạ Tầng `client/lib/query-client.tsx` (1 File Duy Nhất)

##### [NEW] `client/trpc/query-client.ts`

##### [NEW] `client/lib/query-client.tsx`

- Hàm `makeQueryClient()` cấu hình:
  - `defaultOptions.queries.staleTime = 30 * 1000` (30 giây).
  - `defaultOptions.queries.retry`: Hàm retry thông minh (tối đa 2 lần cho lỗi mạng / `502` / `503` / `504`; trả về `false` ngay lập tức nếu lỗi là `400`, `401`, `403`, `404`, `409`, `422`, `429` hoặc mã lỗi `REPORT_NOT_READY`).
  - `defaultOptions.dehydrate`: Dùng `superjson.serialize` và `shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending'`.
  - `defaultOptions.hydrate`: Dùng `superjson.deserialize`.

1. **Hàm `makeQueryClient()` & Browser Singleton `getQueryClient()`:**
   - `defaultOptions.queries.staleTime = 30 * 1000` (30 giây).
   - `defaultOptions.queries.refetchOnWindowFocus = true`.
   - `defaultOptions.queries.retry`: Retry tối đa 2 lần cho lỗi mạng hoặc `502`/`503`/`504`; trả về `false` ngay lập tức nếu lỗi là `ApiClientError` có `statusCode` thuộc `400..499` hoặc `errorCode === 'REPORT_NOT_READY'`.
2. **Component `<QueryProvider>` (`'use client'`):**
   - Cung cấp `<QueryClientProvider client={queryClient}>` cho toàn bộ ứng dụng.
3. **Bộ `queryKeys` Factory Tập Trung (Bao phủ toàn bộ 10 miền nghiệp vụ):**
   - `queryKeys.auth`: `all: ['auth']`, `me: () => ['auth', 'me'] as const`
   - `queryKeys.users`: `all: ['users']`, `me: () => ['users', 'me'] as const`, `adminList: () => ['users', 'admin-list'] as const`, `adminDetail: (id: string) => ['users', 'admin-detail', id] as const`
   - `queryKeys.candidateProfile`: `all: ['candidate-profile']`, `detail: () => ['candidate-profile', 'detail'] as const`
   - `queryKeys.prep`: `all: ['prep']`, `savedJds: () => ['prep', 'saved-jds'] as const`
   - `queryKeys.rubrics`: `all: ['rubrics']`, `active: (contextPackId: string, sessionType?: string) => ['rubrics', 'active', contextPackId, sessionType ?? 'all'] as const`
   - `queryKeys.sessions`:
     - `all: ['sessions'] as const`
     - `list: () => ['sessions', 'list'] as const`
     - `detail: (sessionId: string) => ['sessions', 'detail', sessionId] as const`
     - `status: (sessionId: string) => ['sessions', 'status', sessionId] as const`
     - `questions: (sessionId: string) => ['sessions', 'questions', sessionId] as const`
     - `feedbackProgress: (sessionId: string) => ['sessions', 'feedback-progress', sessionId] as const`
     - `report: (sessionId: string) => ['sessions', 'report', sessionId] as const`
   - `queryKeys.onet`:
     - `all: ['onet'] as const`
     - `search: (query?: string, limit?: number) => ['onet', 'search', query ?? '', limit ?? 20] as const`
     - `tech: (socCode: string) => ['onet', 'tech', socCode] as const`
   - `queryKeys.onetAdmin`:
     - `all: ['onet-admin'] as const`
     - `summary: () => ['onet-admin', 'summary'] as const`
     - `majorGroups: () => ['onet-admin', 'major-groups'] as const`
     - `occupations: (filters?: Record<string, unknown>) => ['onet-admin', 'occupations', filters ?? {}] as const`
     - `topOccupations: (filters?: Record<string, unknown>) => ['onet-admin', 'top-occupations', filters ?? {}] as const`
     - `sfiaCoverage: (filters?: Record<string, unknown>) => ['onet-admin', 'sfia-coverage', filters ?? {}] as const`
     - `detail: (socCode: string) => ['onet-admin', 'detail', socCode] as const`
     - `alternateTitles: (socCode: string, page?: number, limit?: number, search?: string) => ['onet-admin', 'alternate-titles', socCode, page ?? 1, limit ?? 20, search ?? ''] as const`
     - `sfiaMappings: (socCode: string) => ['onet-admin', 'sfia-mappings', socCode] as const`
     - `sfiaLibrary: () => ['onet-admin', 'sfia-library'] as const`
   - `queryKeys.sfiaAdmin`:
     - `all: ['sfia-admin'] as const`
     - `categories: () => ['sfia-admin', 'categories'] as const`
     - `subcategories: (categoryCode?: string) => ['sfia-admin', 'subcategories', categoryCode ?? 'all'] as const`
     - `skills: (filters?: Record<string, unknown>) => ['sfia-admin', 'skills', filters ?? {}] as const`
     - `skillDetail: (skillCode: string) => ['sfia-admin', 'skill-detail', skillCode] as const`
     - `levels: () => ['sfia-admin', 'levels'] as const`
     - `attributes: () => ['sfia-admin', 'attributes'] as const`
     - `matrix: (categoryCode?: string) => ['sfia-admin', 'matrix', categoryCode ?? 'all'] as const`
     - `coverage: () => ['sfia-admin', 'coverage'] as const`

##### [NEW] `client/trpc/bff-client.ts`

#### 2.3. Tích Hợp Provider & Nâng Cấp Core Hooks / Services

- Tầng giao tiếp HTTP từ Next.js BFF sang NestJS (tái sử dụng `API_BASE_URL`, `ApiClientError`, `API_ERROR_MESSAGES` từ `@/lib/api-client`):
  - **Context Request/Response Bridge (`BFFRequestContext`):**
    - `reqHeaders: Headers` (lấy từ `FetchCreateContextFnOptions.req.headers` hoặc từ `await headers()` của `next/headers`).
    - `resHeaders: Headers` (tích lũy toàn bộ header `Set-Cookie` từ NestJS trả về).
    - `refreshPromise: Promise<boolean> | null` (**Per-Request 401 Refresh Mutex** đảm bảo chỉ gọi `/auth/refresh` tối đa 1 lần trong 1 batch request).
    - `cookieOverride: string | null` (lưu chuỗi header `cookie` đã hợp nhất sau khi Silent Refresh thành công để mọi procedure trong cùng batch dùng chung).
  - **Chuyển tiếp Cookie & Tracing Headers:**
    - Đọc `cookie` (ưu tiên `ctx.cookieOverride ?? ctx.reqHeaders.get('cookie')`), `x-request-id`, `x-correlation-id`, `accept-language`, `user-agent` từ `reqHeaders` gửi sang NestJS.
  - **Tự động đính kèm `Idempotency-Key`:**
    - Với mọi request `POST`, `PUT`, `PATCH`, `DELETE`, nếu caller không truyền `idempotencyKey`, tự động gắn `crypto.randomUUID()`.
  - **Xử lý `Set-Cookie` Passthrough (cho `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/refresh`, `/auth/change-password`):**
    - Mọi response từ NestJS có `response.headers.getSetCookie()` đều được append vào `ctx.resHeaders` (khử trùng lặp chuỗi cookie giống nhau) để Route Handler gắn về trình duyệt.
  - **Cơ chế Server-Side 401 Silent Refresh Có Mutex (`refreshPromise`):**
    - Khi request tới endpoint ngoài danh sách `AUTH_EXCLUDED_FROM_REFRESH` trả về `401`:
      1. Nếu `ctx.refreshPromise === null`, khởi tạo `ctx.refreshPromise` gọi `POST ${API_BASE_URL}/auth/refresh` với header `cookie` hiện tại:
         - Nếu `refreshResponse.ok`:
           - Lấy danh sách `newSetCookies = refreshResponse.headers.getSetCookie()`.
           - Append toàn bộ `newSetCookies` vào `ctx.resHeaders`.
           - Hợp nhất giá trị `name=value` của các cookie mới vào chuỗi `cookie` gốc và lưu vào `ctx.cookieOverride`, trả về `true`.
         - Nếu refresh thất bại:
           - Append các header xóa cookie (nếu có) vào `ctx.resHeaders`, trả về `false`.
      2. Mọi procedure gặp `401` trong cùng batch cùng `await ctx.refreshPromise`:
         - Nếu kết quả là `true`: Gọi lại request gốc 1 lần với `ctx.cookieOverride`.
         - Nếu kết quả là `false`: Ném lỗi `TRPCError({ code: 'UNAUTHORIZED', ... })` kèm `ApiClientError(API_ERROR_MESSAGES.UNAUTHORIZED, 401, 'UNAUTHORIZED')`.
  - **Chuẩn hóa Error Mapping (`throwBffTRPCError`):** - Đọc payload lỗi chuẩn của NestJS (`{ success: false, error: { code, message, details }, meta: { requestId, correlationId } }`). - Ánh xạ sang thông điệp tiếng Việt thân thiện từ bảng `API_ERROR_MESSAGES` (giữ tương thích 100% với `client/lib/api-client.ts`). - Khởi tạo `ApiClientError(message, statusCode, errorCode, details, requestId, correlationId, body)` và ném `new TRPCError({ code: mapHttpStatusToTrpcCode(statusCode), message, cause: apiClientError })`.
    | Tệp nguồn (`client/...`) | Thay đổi cụ thể |
    | :--- | :--- |
    | **[MODIFY] [client/app/layout.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/layout.tsx)** | Bọc `<QueryProvider>` bên ngoài `<AuthProvider>` để mọi hook và component trong ứng dụng truy cập được `QueryClient`. |
    | **[MODIFY] [client/test-utils/render.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/test-utils/render.tsx)** | Tạo instance `QueryClient` mới cho mỗi lần gọi `render()` (`defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } }`) và bọc `<QueryClientProvider>` quanh `<MantineProvider theme={theme} env="test">`. |
    | **[MODIFY] [client/.storybook/preview.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/.storybook/preview.tsx)** | Bọc `<QueryProvider>` trong decorator `withMantineProvider` để mọi Story sử dụng hooks TanStack Query đều render mượt mà. |
    | **[MODIFY] [client/lib/auth-context.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/lib/auth-context.tsx)** | Dùng `useQueryClient()` để gọi `queryClient.clear()` khi `logout()` hoặc khi nhận sự kiện `auth:session-expired` (đảm bảo quy tắc `SEC-010` xóa sạch dữ liệu nhạy cảm trong bộ nhớ cache). |
    | **[MODIFY] [client/hooks/useSessions.ts](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/hooks/useSessions.ts)** | Thay thế hoàn toàn `useSWR` bằng `useQuery({ queryKey: queryKeys.sessions.list(), queryFn: () => sessionService.getSessions() })`. Giữ nguyên interface trả về `{ sessions, isLoading, error, refetch, mutate }` (trong đó `mutate` là hàm gọi `queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all })`) để `app/(candidate)/sessions/page.tsx` tương thích 100%. |
    | **[MODIFY] [client/hooks/useSessionEvents.ts](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/hooks/useSessionEvents.ts)** | Tích hợp `useQueryClient()` để khi nhận sự kiện SSE (`feedback_progress`, `report_ready`, `question_ready`), ngoài việc gọi callbacks hiện tại còn tự động đồng bộ `queryClient.setQueryData` / `queryClient.invalidateQueries` cho `queryKeys.sessions.feedbackProgress(sessionId)`, `queryKeys.sessions.report(sessionId)`, `queryKeys.sessions.detail(sessionId)` và `queryKeys.sessions.list()`. |
    | **[MODIFY] [client/services/onet.service.ts](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/services/onet.service.ts)** | Bổ sung tham số tùy chọn `signal?: AbortSignal` vào `searchOccupations(query, limit, signal)` và `getOccupationTech(socCode, signal)` truyền xuống `apiClient.get(..., { signal })` để hỗ trợ hủy request tự động từ TanStack Query `queryFn`. |
    | **[MODIFY] [client/next.config.ts](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/next.config.ts) & [client/scripts/check-ui-rules.mjs](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/scripts/check-ui-rules.mjs)** | Thêm `'@tanstack/react-query'` vào `experimental.optimizePackageImports` trong `next.config.ts`; thêm `'hooks'` vào danh sách thư mục quét mặc định khi chạy `--all` trong `check-ui-rules.mjs`. |
    | **[NEW] `client/lib/__tests__/query-client.test.tsx`** | Unit test kiểm chứng `makeQueryClient` (smart retry bỏ qua lỗi 4xx & `REPORT_NOT_READY`), `queryKeys` factory, và hook `useSessions` chạy trên TanStack Query v5. |

##### [NEW] `client/trpc/init.ts`

> **Cổng nghiệm thu Chặng 2:** Chạy toàn bộ cổng kiểm định tại `client/` đạt Exit Code 0.

- Tách bạch rõ 2 hàm khởi tạo Context:
  - `export async function createTRPCContext(opts?: FetchCreateContextFnOptions): Promise<TRPCContext>`: Tạo instance `BFFRequestContext` mới (với `resHeaders = new Headers()`, `refreshPromise = null`, `cookieOverride = null`) cho mỗi HTTP request vào Route Handler.
  - `export const getServerTRPCContext = cache(() => createTRPCContext())`: Dùng riêng cho React Server Components (`client/trpc/server.tsx`).
- Khởi tạo `t = initTRPC.context<TRPCContext>().create({ transformer: superjson, errorFormatter({ shape, error }) { ... } })`:
  - Trong `errorFormatter`: Nếu `error.cause instanceof ApiClientError`, gán `apiError: { statusCode, errorCode, details, requestId, correlationId }` vào `shape.data`.
- Xuất khẩu `createTRPCRouter = t.router`, `createCallerFactory = t.createCallerFactory`, `baseProcedure = t.procedure`.

##### [NEW] `client/app/api/trpc/[trpc]/route.ts`

- Route Handler chuẩn Next.js 16 cho `GET` và `POST`:
  - Gọi `fetchRequestHandler({ endpoint: '/api/trpc', req, router: appRouter, createContext: (opts) => createTRPCContext(opts), responseMeta({ ctx }) { ... } })`.
  - Trong `responseMeta`: Lấy toàn bộ `ctx?.resHeaders.getSetCookie()`; nếu có phần tử, tạo `const headers = new Headers()` và `setCookies.forEach((c) => headers.append('set-cookie', c))`, trả về `{ headers }` để trình duyệt nhận đầy đủ mọi `HttpOnly` cookies.

##### [NEW] `client/trpc/client.tsx`

- Client Provider (`'use client'`):
  - Tạo `export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>()` từ `@trpc/tanstack-react-query`.
  - Component `<TRPCReactProvider>` quản lý browser `QueryClient` singleton và `trpcClient` sử dụng **`httpBatchLink`** (`httpBatchLink({ url: '/api/trpc', transformer: superjson, fetch(url, options) { return fetch(url, { ...options, credentials: 'include' }) } })`).
  - Lắng nghe lỗi `401 UNAUTHORIZED` trên `QueryCache` / `MutationCache` ở browser (trừ trường hợp query `auth.me` khởi tạo) để phát sự kiện `window.dispatchEvent(new CustomEvent('auth:session-expired'))` (giữ tương thích 100% với `AuthProvider`).

##### [NEW] `client/trpc/server.tsx`

- Server-only helper (`import 'server-only'`):
  - `export const getQueryClient = cache(makeQueryClient)`
  - `export const trpc = createTRPCOptionsProxy({ ctx: getServerTRPCContext, router: appRouter, queryClient: getQueryClient })`
  - `export const caller = appRouter.createCaller(getServerTRPCContext)`
  - Component `<HydrateClient>` và hàm `prefetch(queryOptions)`.

##### [MODIFY] [client/middleware/config.ts](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/middleware/config.ts)

- Bổ sung `'/api'` vào `MAINTENANCE_BYPASS_PREFIXES` (`['/maintenance', '/admin', '/api', '/_next', '/favicon']`) để `maintenanceGuard` không redirect các lời gọi BFF `/api/trpc/*` sang trang HTML `/maintenance`.

##### [MODIFY] [client/app/layout.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/layout.tsx), [client/test-utils/render.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/test-utils/render.tsx), [client/.storybook/preview.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/.storybook/preview.tsx)

- `client/app/layout.tsx`: Bọc `<TRPCReactProvider>` quanh `<AuthProvider>`.
- `client/test-utils/render.tsx`:
  - Mỗi lần gọi `render()` tạo 1 test `QueryClient` độc lập (`retry: false, gcTime: 0`) và 1 test `trpcClient`, bọc `<QueryClientProvider>` + `<TRPCProvider>` quanh `<MantineProvider theme={theme} env="test"><ModalsProvider>{children}</ModalsProvider></MantineProvider>`.
- `client/.storybook/preview.tsx`: Bọc `TRPCReactProvider` trong decorator `withMantineProvider`.

##### [NEW] `client/trpc/__tests__/bff-client.test.ts`

- Unit test toàn diện cho `bffFetch`:
  1. Chuyển tiếp `cookie` header từ request sang NestJS.
  2. Tự động gắn `Idempotency-Key` cho `POST`/`PATCH`/`DELETE` và không gắn cho `GET`.
  3. Khi gặp `401` trên `/sessions`, tự động gọi `/auth/refresh`, forward `Set-Cookie` vào `resHeaders`, và retry thành công.
  4. **Per-Request Refresh Mutex:** Khi 2 procedures trong cùng 1 `BFFRequestContext` đồng thời gặp `401`, chỉ gọi `/auth/refresh` đúng 1 lần duy nhất và cả 2 đều retry thành công với cookie mới.
  5. Khi `/auth/refresh` thất bại, ném `TRPCError(UNAUTHORIZED)` kèm `ApiClientError`.
  6. Ánh xạ chính xác payload lỗi `InterviewAIException` (`SESSION_LIMIT_EXCEEDED`, `VALIDATION_ERROR` kèm `details`, `requestId`, `correlationId`) sang `TRPCError`.

> **Cổng nghiệm thu Chặng 2:** Chạy `npm run typecheck && npm run lint && npm run test:unit && npm run build` tại `client/` đạt Exit Code 0.

---

### CHẶNG 3: Xây Dựng 10 Domain Routers, Zod v4 Schemas & Chuyển Đổi Tầng Dữ Liệu Cho Toàn Bộ Màn Hình/Hooks (Giữ Nguyên 100% JSX/UI)

Mục tiêu của Chặng 3 là xây dựng đủ 10 tRPC Domain Routers + 10 Zod v4 Schema files (kèm di chuyển toàn bộ domain types từ `client/services/*`), và thay thế toàn bộ lời gọi `useSWR` cùng `client/services/*` trong **29 files màn hình/components/hooks** và **11 files unit test** (tuyệt đối không thay đổi cấu trúc JSX/giao diện hiện tại).

#### 3.1. Đặc Tả Chi Tiết 10 Domain Routers, Zod v4 Schemas & Di Chuyển Domain Types (`client/trpc/schemas/` & `client/trpc/routers/`)

- **Quy tắc Input / Output & Types (Q12 & Q13):**
  - 100% procedures có tham số đầu vào sử dụng `.input(zodV4Schema)`.
  - Chiều đầu ra dùng `ctx.bffFetch<ResponseType>(path, options)` để giữ kiểu tĩnh chặt chẽ mà không làm gãy các mock payload rút gọn trong unit tests; riêng `onetAdmin.occupationDetail`, `onetAdmin.occupationSfiaMappings`, `onetAdmin.createSfiaMapping`, `onetAdmin.updateSfiaMapping`, `onetAdmin.resetSfiaMappings`, và `onetAdmin.sfiaLibrary` sử dụng hàm mapper/Zod transform (`mapRawSfiaMapping`, `mapRawSfiaLibrarySkill`) chuẩn hóa DTO.
  - Chuyển các types `OnetOccupation`, `OnetTech` từ `client/services/onet.service.ts` sang `client/trpc/schemas/onet.schema.ts` (và re-export tại `client/lib/types.ts`).
  - Chuyển các types `SfiaSkillFilters`, `SfiaMatrixDataResponse`, `CreateSfiaQuestionPayload` từ `client/services/sfia-admin.service.ts` sang `client/trpc/schemas/sfia-admin.schema.ts` (và re-export tại `client/lib/types.ts`).

|  STT   | Router (`client/trpc/routers/`)                          | Schema (`client/trpc/schemas/`) | Danh sách Procedures & Mapping Endpoint NestJS (`/api/v1/*`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| :----: | :------------------------------------------------------- | :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | `auth.router.ts` (`trpc.auth.*`)                         | `auth.schema.ts`                | • `me`: `query` → `GET /auth/me` (unwrap `res.data`, trả về `AuthUser \| null`)<br/>• `login`: `mutation(loginSchema)` → `POST /auth/login` (unwrap `res.data`)<br/>• `register`: `mutation(registerSchema)` → `POST /auth/register` (unwrap `res.data`)<br/>• `logout`: `mutation` → `POST /auth/logout` (bắt lỗi an toàn để luôn cho phép client dọn phiên)<br/>• `refresh`: `mutation` → `POST /auth/refresh` (unwrap `res.data`)<br/>• `changePassword`: `mutation(changePasswordSchema)` → `POST /auth/change-password` (unwrap `res.data`)<br/>• `requestPasswordReset`: `mutation(resetReqSchema)` → `POST /auth/password-reset/request`<br/>• `confirmPasswordReset`: `mutation(resetConfirmSchema)` → `POST /auth/password-reset/confirm` (unwrap `res.data`)<br/>• `requestEmailVerification`: `mutation` → `POST /auth/email-verification/request`<br/>• `confirmEmailVerification`: `mutation(verifyCodeSchema)` → `POST /auth/email-verification/confirm` (unwrap `res.data`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **2**  | `user.router.ts` (`trpc.user.*`)                         | `user.schema.ts`                | • `me`: `query` → `GET /users/me`<br/>• `updateMe`: `mutation(updateUserAccountSchema)` → `PATCH /users/me`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **3**  | `adminUser.router.ts` (`trpc.adminUser.*`)               | `admin-user.schema.ts`          | • `list`: `query` → `GET /users` (unwrap `res.data`)<br/>• `byId`: `query({ id })` → `GET /users/:id` (unwrap `res.data`)<br/>• `update`: `mutation({ id, role?, status? })` → `PATCH /users/:id` (unwrap `res.data`)<br/>• `delete`: `mutation({ id })` → `DELETE /users/:id`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **4**  | `candidateProfile.router.ts` (`trpc.candidateProfile.*`) | `candidate-profile.schema.ts`   | • `get`: `query` → `GET /candidate-profile`<br/>• `update`: `mutation(updateCandidateProfileSchema)` → `PATCH /candidate-profile`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **5**  | `prep.router.ts` (`trpc.prep.*`)                         | `prep.schema.ts`                | • `listSavedJds`: `query` → `GET /saved-job-descriptions` (unwrap `res.items ?? []`)<br/>• `saveJd`: `mutation(saveJobDescriptionSchema)` → `POST /saved-job-descriptions`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **6**  | `rubric.router.ts` (`trpc.rubric.*`)                     | `rubric.schema.ts`              | • `getActive`: `query({ contextPackId, sessionType })` → `GET /rubrics/:contextPackId?sessionType=...`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **7**  | `session.router.ts` (`trpc.session.*`)                   | `session.schema.ts`             | • `list`: `query` → `GET /sessions` (unwrap `res.sessions ?? []`)<br/>• `byId`: `query({ sessionId })` → `GET /sessions/:sessionId`<br/>• `status`: `query({ sessionId })` → `GET /sessions/:sessionId/status`<br/>• `questions`: `query({ sessionId })` → `GET /sessions/:sessionId/questions`<br/>• `feedbackProgress`: `query({ sessionId })` → `GET /sessions/:sessionId/feedback-progress`<br/>• `report`: `query({ sessionId })` → `GET /sessions/:sessionId/report`<br/>• `create`: `mutation(createSessionSchema)` → `POST /sessions`<br/>• `updateStatus`: `mutation({ sessionId, status, remainingSeconds?, autoSkipUnanswered? })` → `PATCH /sessions/:sessionId/status`<br/>• `submitTurn`: `mutation({ sessionId, ...turnPayload })` → `POST /sessions/:sessionId/turns`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **8**  | `onet.router.ts` (`trpc.onet.*`)                         | `onet.schema.ts`                | • `searchOccupations`: `query({ query?, limit? })` → `GET /onet/occupations` (chuyển tiếp `signal`)<br/>• `occupationTech`: `query({ socCode })` → `GET /onet/occupations/:socCode/tech`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **9**  | `onetAdmin.router.ts` (`trpc.onetAdmin.*`)               | `onet-admin.schema.ts`          | • `analyticsSummary`: `query` → `GET /onet/admin/analytics/summary`<br/>• `majorGroupsDistribution`: `query` → `GET /onet/admin/analytics/major-groups`<br/>• `majorGroups`: `query` → map từ `majorGroupsDistribution`<br/>• `searchOccupations`: `query({ groupCode?, mappedOnly?, search?, limit? })` → `GET /onet/admin/occupations`<br/>• `topOccupations`: `query({ limit?, sortBy?, search? })` → `GET /onet/admin/analytics/top-occupations`<br/>• `sfiaSkillCoverage`: `query({ limit?, category? })` → `GET /onet/admin/analytics/sfia-coverage`<br/>• `occupationDetail`: `query({ socCode })` → `GET /onet/admin/occupations/:socCode` (kèm transform `mapRawSfiaMapping`)<br/>• `alternateTitles`: `query({ socCode, page?, limit?, search? })` → `GET /onet/admin/occupations/:socCode/alternate-titles`<br/>• `occupationSfiaMappings`: `query({ socCode })` → `GET /onet/admin/occupations/:socCode/sfia-mappings`<br/>• `createSfiaMapping`: `mutation` → `POST /onet/admin/occupations/:socCode/sfia-mappings`<br/>• `updateSfiaMapping`: `mutation` → `PATCH /onet/admin/occupations/:socCode/sfia-mappings/:mappingId`<br/>• `deleteSfiaMapping`: `mutation` → `DELETE /onet/admin/occupations/:socCode/sfia-mappings/:mappingId`<br/>• `resetSfiaMappings`: `mutation` → `POST /onet/admin/occupations/:socCode/sfia-mappings/reset`<br/>• `sfiaLibrary`: `query` → `GET /onet/admin/sfia-library` (kèm transform `mapRawSfiaLibrarySkill`) |
| **10** | `sfiaAdmin.router.ts` (`trpc.sfiaAdmin.*`)               | `sfia-admin.schema.ts`          | • `categories`: `query` → `GET /admin/sfia/categories`<br/>• `subcategories`: `query({ categoryCode? })` → `GET /admin/sfia/subcategories`<br/>• `skills`: `query(sfiaSkillFiltersSchema)` → `GET /admin/sfia/skills`<br/>• `skillDetail`: `query({ skillCode })` → `GET /admin/sfia/skills/:code` (trả về `null` nếu `404`)<br/>• `createQuestion`: `mutation({ skillCode, ...payload })` → `POST /admin/sfia/skills/:code/questions`<br/>• `responsibilityLevels`: `query` → `GET /admin/sfia/levels`<br/>• `genericAttributes`: `query` → `GET /admin/sfia/generic-attributes`<br/>• `matrixData`: `query({ categoryCode? })` → `GET /admin/sfia/matrix`<br/>• `coverageStats`: `query` → `GET /admin/sfia/analytics/coverage`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

#### 3.2. Tách Tiện Ích Luồng Phi JSON (SSE & Media Binary) Sang `client/lib/` & `client/hooks/`

- **[NEW] `client/lib/sse-client.ts`:** Chứa hàm `createSessionEventSource(sessionId: string): EventSource` (tách từ `sessionService.createEventSource`, dùng `getApiBaseUrl()` từ `@/lib/api-client`).
- **[NEW] `client/lib/media-client.ts` & `client/hooks/useMediaMutations.ts`:**
  - Chuyển logic `transcribeAudio` (`FormData` qua `apiClient.postForm`) và `synthesizeSpeech` (`Blob` + in-memory cache `ttsAudioCache`, nâng cấp tích hợp 401 Silent Refresh + `Idempotency-Key` từ `@/lib/api-client`) từ `client/services/media.service.ts` sang `client/lib/media-client.ts`.
  - Cung cấp 2 TanStack Query hooks chuẩn trong `client/hooks/useMediaMutations.ts`:
    - `useTranscribeAudioMutation()` (`useMutation`)
    - `useSynthesizeSpeechMutation()` (`useMutation`)

#### 3.3. Bảng Ánh Xạ Chuyển Đổi Chi Tiết Từng File Màn Hình, Hook & Unit Test (Không Đụng Tới Giao Diện JSX)

Chia làm 3 đợt nhỏ để kiểm soát chất lượng chặt chẽ (tổng cộng **29 files code + 11 files unit test**):

##### Đợt 3A — Core Hooks, Auth & Candidate Sessions (10 files code + 2 files test)

| Tệp nguồn (`client/...`)                                                                                                                                                                   | Hiện trạng (`SWR` / `services/*`)                                                              | Thay đổi chính xác sang `tRPC v11 + TanStack Query v5`                                                                                                                                                                                                                                                                                                                    |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [lib/auth-context.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/lib/auth-context.tsx)                                                                                       | Gọi `authService.getMe()` và `authService.logout()`                                            | Dùng `trpcClient.auth.me.query()`, `trpcClient.auth.logout.mutate()` và gọi `queryClient.clear()` khi `logout` hoặc `auth:session-expired` (`SEC-010`).                                                                                                                                                                                                                   |
| [hooks/useSessions.ts](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/hooks/useSessions.ts)                                                                                       | `useSWR('/sessions', () => sessionService.getSessions())`                                      | Dùng `useTRPC()` + `useQuery(trpc.session.list.queryOptions())` và trả về `{ sessions, isLoading, error, refetch, invalidate, mutate }` (giữ alias `mutate` gọi `invalidate` để `sessions/page.tsx` không vỡ interface).                                                                                                                                                  |
| [hooks/useSessionEvents.ts](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/hooks/useSessionEvents.ts)                                                                             | `sessionService.createEventSource(sessionId)`                                                  | Dùng `createSessionEventSource(sessionId)` từ `@/lib/sse-client`, đồng thời dùng `useQueryClient()` + `useTRPC()` để `setQueryData` / `invalidateQueries` cho `trpc.session.status`, `trpc.session.feedbackProgress`, `trpc.session.report`, `trpc.session.byId`.                                                                                                         |
| [app/(auth)/login/LoginClient.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(auth)/login/LoginClient.tsx>)                                                             | `authService.login(data)`                                                                      | Dùng `useMutation(trpc.auth.login.mutationOptions())` (`loginMutation.mutateAsync(data)`).                                                                                                                                                                                                                                                                                |
| [app/(auth)/register/RegisterClient.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(auth)/register/RegisterClient.tsx>)                                                 | `authService.register(...)`                                                                    | Dùng `useMutation(trpc.auth.register.mutationOptions())`.                                                                                                                                                                                                                                                                                                                 |
| [app/(auth)/reset-password/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(auth)/reset-password/page.tsx>)                                                         | `authService.requestPasswordReset`, `authService.confirmPasswordReset`                         | Dùng `useMutation(trpc.auth.requestPasswordReset.mutationOptions())` và `useMutation(trpc.auth.confirmPasswordReset.mutationOptions())`.                                                                                                                                                                                                                                  |
| [components/profile/ChangePasswordGroup.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/profile/ChangePasswordGroup.tsx) (+ `.test.tsx`)                           | `authService.changePassword(...)`                                                              | Dùng `useMutation(trpc.auth.changePassword.mutationOptions())`; cập nhật `ChangePasswordGroup.test.tsx` sang `import { render, screen, userEvent } from '@test-utils'`.                                                                                                                                                                                                   |
| [app/(candidate)/sessions/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(candidate)/sessions/page.tsx>)                                                           | `useSessions()`                                                                                | Giữ nguyên JSX, hưởng lợi trực tiếp từ `useSessions()` đã chạy trên TanStack Query + `trpc.session.list`.                                                                                                                                                                                                                                                                 |
| [app/(candidate)/sessions/[sessionId]/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(candidate)/sessions/%5BsessionId%5D/page.tsx>)                               | `sessionService.getQuestions`, `getSession`, `createEventSource`, `updateStatus`, `submitTurn` | Bảo toàn 100% luồng state-machine: `init()` gọi `trpcClient.session.byId.query`, kiểm tra redirect `completing`/`completed`, chạy `pollQuestions()` 6 lần x 5s gọi `trpcClient.session.questions.query`, kết hợp `createSessionEventSource` và `useMutation` cho `trpc.session.updateStatus` & `trpc.session.submitTurn` (kèm `invalidateQueries`).                       |
| [app/(candidate)/sessions/[sessionId]/report/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(candidate)/sessions/%5BsessionId%5D/report/page.tsx>) (+ `.test.tsx`) | `sessionService.getSession`, `getReport`, `getFeedbackProgress`                                | Dùng `trpcClient.session.byId.query`, `trpcClient.session.report.query`, `trpcClient.session.feedbackProgress.query` (bảo toàn 100% logic bắt mã lỗi `REPORT_NOT_READY` để giữ màn hình thanh tiến độ `progressPercent` + SSE `useSessionEvents` + fallback polling 5s khi SSE đứt); cập nhật `report/page.test.tsx` sang `import { render, screen } from '@test-utils'`. |

##### Đợt 3B — Setup, JD Library, Profile, Resume & Media (9 files code + 6 files test)

| Tệp nguồn (`client/...`)                                                                                                                                         | Hiện trạng (`services/*`)                                                                                  | Thay đổi chính xác sang `tRPC v11 + TanStack Query v5`                                                                                                                                                                  |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [app/(candidate)/setup/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(candidate)/setup/page.tsx>)                                       | `prepService.getSavedJobDescriptions`, `saveJobDescription`, `sessionService.getSessions`, `createSession` | Dùng `trpcClient.prep.listSavedJds.query`, `trpcClient.session.list.query`, và mutations `trpc.prep.saveJd`, `trpc.session.create` (tự động invalidate `trpc.session.list` & `trpc.prep.listSavedJds`).                 |
| [components/setup/JdForm.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/setup/JdForm.tsx) (+ `.test.tsx`)                               | `onetService.searchOccupations`, `getOccupationTech`, `type OnetOccupation`, `type OnetTech`               | Dùng `trpcClient.onet.searchOccupations.query` và `trpcClient.onet.occupationTech.query`, import types từ `@/trpc/schemas/onet.schema`; cập nhật `JdForm.test.tsx` sang `import { render, screen } from '@test-utils'`. |
| [app/(candidate)/jd-library/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(candidate)/jd-library/page.tsx>) (+ `.test.tsx`)             | `prepService.getSavedJobDescriptions`                                                                      | Dùng `useQuery(trpc.prep.listSavedJds.queryOptions())`; cập nhật `jd-library/page.test.tsx` sang `import { render, screen } from '@test-utils'`.                                                                        |
| [app/(candidate)/profile/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(candidate)/profile/page.tsx>)                                   | `userService.getCurrentUser`, `updateCurrentUser`                                                          | Dùng `useQuery(trpc.user.me.queryOptions())` và `useMutation(trpc.user.updateMe.mutationOptions())`.                                                                                                                    |
| [app/(candidate)/resume/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(candidate)/resume/page.tsx>)                                     | `candidateProfileService.getProfile`, `updateProfile`                                                      | Dùng `useQuery(trpc.candidateProfile.get.queryOptions())` và `useMutation(trpc.candidateProfile.update.mutationOptions())`.                                                                                             |
| [components/resume/CareerInfoGroup.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/resume/CareerInfoGroup.tsx) (+ `.test.tsx`)           | `onetService.searchOccupations`, `type OnetOccupation`                                                     | Dùng `trpcClient.onet.searchOccupations.query`, import `type OnetOccupation` từ `@/trpc/schemas/onet.schema`; cập nhật `CareerInfoGroup.test.tsx` sang `import { render, screen } from '@test-utils'`.                  |
| [components/resume/TechnicalSkillsGroup.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/resume/TechnicalSkillsGroup.tsx) (+ `.test.tsx`) | `onetService.getOccupationTech`, `type OnetTech`                                                           | Dùng `trpcClient.onet.occupationTech.query`, import `type OnetTech` từ `@/trpc/schemas/onet.schema`; cập nhật `TechnicalSkillsGroup.test.tsx` sang `import { render, screen } from '@test-utils'`.                      |
| [components/interview/QuestionCard.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/interview/QuestionCard.tsx) (+ `.test.tsx`)           | `mediaService.synthesizeSpeech`                                                                            | Dùng `useSynthesizeSpeechMutation()` từ `@/hooks/useMediaMutations`; cập nhật `QuestionCard.test.tsx` sang `import { render, screen } from '@test-utils'` để có `QueryClientProvider`.                                  |
| [components/interview/VoiceRecorder.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/interview/VoiceRecorder.tsx) (+ `.test.tsx`)         | `mediaService.transcribeAudio`                                                                             | Dùng `useTranscribeAudioMutation()` từ `@/hooks/useMediaMutations`; cập nhật `VoiceRecorder.test.tsx` sang `import { render, screen, userEvent } from '@test-utils'` để có `QueryClientProvider`.                       |

##### Đợt 3C — Admin Dashboard, Users, O\*NET & SFIA 9 Knowledge Base (10 files code + 3 files test)

| Tệp nguồn (`client/...`)                                                                                                                                               | Hiện trạng (`services/*`)                                                                                             | Thay đổi chính xác sang `tRPC v11 + TanStack Query v5`                                                                                                                                                                                                 |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [app/(admin)/admin/dashboard/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(admin)/admin/dashboard/page.tsx>)                                 | `userManagementService.listUsers`                                                                                     | Dùng `useQuery(trpc.adminUser.list.queryOptions())`.                                                                                                                                                                                                   |
| [app/(admin)/admin/profile/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(admin)/admin/profile/page.tsx>)                                     | `userService.getCurrentUser`, `updateCurrentUser`                                                                     | Dùng `useQuery(trpc.user.me.queryOptions())` và `useMutation(trpc.user.updateMe.mutationOptions())`.                                                                                                                                                   |
| [app/(admin)/admin/users/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(admin)/admin/users/page.tsx>)                                         | `userManagementService.listUsers`, `updateUser`, `deleteUser`                                                         | Dùng `useQuery(trpc.adminUser.list.queryOptions())` và mutations `trpc.adminUser.update`, `trpc.adminUser.delete` (invalidate `trpc.adminUser.list`).                                                                                                  |
| [app/(admin)/admin/sfia/page.tsx](<file:///c:/Users/An/Documents/GR1/InterviewCoach/client/app/(admin)/admin/sfia/page.tsx>) (+ `.test.tsx`)                           | `sfiaAdminService.*` (8 methods)                                                                                      | Dùng `trpc.sfiaAdmin.*` (`categories`, `subcategories`, `skills`, `coverageStats`, `matrixData`, `responsibilityLevels`, `genericAttributes`, `skillDetail`); cập nhật `admin/sfia/page.test.tsx` sang `import { render, screen } from '@test-utils'`. |
| [components/sfia/SfiaCreateQuestionModal.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/sfia/SfiaCreateQuestionModal.tsx)                     | `sfiaAdminService.createQuestion`                                                                                     | Dùng `useMutation(trpc.sfiaAdmin.createQuestion.mutationOptions())` (invalidate `skillDetail`, `matrixData`, `coverageStats`).                                                                                                                         |
| [components/sfia/SfiaMatrixInspectionSheet.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/sfia/SfiaMatrixInspectionSheet.tsx) (+ `.test.tsx`) | `sfiaAdminService.getSkillDetail`                                                                                     | Dùng `trpc.sfiaAdmin.skillDetail`; cập nhật `SfiaMatrixInspectionSheet.test.tsx` sang `import { render, screen } from '@test-utils'`.                                                                                                                  |
| [components/sfia/sfia-admin.service.test.ts](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/sfia/sfia-admin.service.test.ts)                       | Unit test cho `sfiaAdminService`                                                                                      | Chuyển thành unit test cho `sfiaAdminRouter` qua `createCallerFactory` (`client/trpc/__tests__/sfia-admin.router.test.ts`) và xóa file test cũ tại `components/sfia/sfia-admin.service.test.ts`.                                                       |
| [components/onet/OnetAnalyticsView.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/onet/OnetAnalyticsView.tsx)                                 | `onetAdminService.getAnalyticsSummary`, `getMajorGroupsDistribution`, `getSfiaSkillCoverage`, `getTopOccupations`     | Dùng `trpc.onetAdmin.*` queries song song.                                                                                                                                                                                                             |
| [components/onet/OnetSidebar.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/onet/OnetSidebar.tsx)                                             | `onetAdminService.getMajorGroups`, `searchOccupations`                                                                | Dùng `trpc.onetAdmin.majorGroups` và `trpc.onetAdmin.searchOccupations`.                                                                                                                                                                               |
| [components/onet/OnetDetailShell.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/onet/OnetDetailShell.tsx)                                     | `onetAdminService.getOccupationDetail`                                                                                | Dùng `trpc.onetAdmin.occupationDetail`.                                                                                                                                                                                                                |
| [components/onet/OnetAlternateTitlesTab.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/onet/OnetAlternateTitlesTab.tsx)                       | `onetAdminService.getAlternateTitles`                                                                                 | Dùng `trpc.onetAdmin.alternateTitles` (kèm `keepPreviousData`).                                                                                                                                                                                        |
| [components/onet/OnetSfiaTab.tsx](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/components/onet/OnetSfiaTab.tsx)                                             | `onetAdminService.getSfiaLibrary`, `createSfiaMapping`, `updateSfiaMapping`, `deleteSfiaMapping`, `resetSfiaMappings` | Dùng `trpc.onetAdmin.sfiaLibrary` và 4 mutations `createSfiaMapping`, `updateSfiaMapping`, `deleteSfiaMapping`, `resetSfiaMappings`.                                                                                                                   |

> **Cổng nghiệm thu Chặng 3:** Chạy `npm run typecheck && npm run lint && npm run test:unit && npm run build` tại `client/` đạt Exit Code 0.

---

### CHẶNG 4: Dọn Dẹp Triệt Để Legacy (`swr`, `client/services/*`) & Kiểm Toán Cuối Cùng

Mục tiêu của Chặng 4 là gỡ bỏ hoàn toàn thư viện `swr` và toàn bộ 13 files trong thư mục `client/services/*` sau khi 100% màn hình và unit tests đã chuyển sang `client/trpc/*`, `client/lib/media-client.ts`, và `client/lib/sse-client.ts` (giữ lại `client/lib/api-client.ts` và `client/lib/__tests__/api-client.test.ts` làm hạ tầng low-level cho `ApiClientError`, `API_ERROR_MESSAGES`, `API_BASE_URL` và browser binary/FormData requests).

#### [DELETE] Xóa Toàn Bộ 13 Files Trong `client/services/`

- `client/services/admin.service.ts`
- `client/services/auth.service.ts`
- `client/services/candidate-profile.service.ts`
- `client/services/profile.service.ts`
- `client/services/prep.service.ts`
- `client/services/rubric.service.ts`
- `client/services/session.service.ts`
- `client/services/user.service.ts`
- `client/services/onet.service.ts` (types `OnetOccupation`, `OnetTech` đã chuyển sang `client/trpc/schemas/onet.schema.ts` & `client/lib/types.ts`)
- `client/services/onet-admin.service.ts`
- `client/services/sfia-admin.service.ts` (types `SfiaSkillFilters`, `SfiaMatrixDataResponse`, `CreateSfiaQuestionPayload` đã chuyển sang `client/trpc/schemas/sfia-admin.schema.ts` & `client/lib/types.ts`)
- `client/services/media.service.ts` (đã chuyển sang `client/lib/media-client.ts` + `client/hooks/useMediaMutations.ts`)
- `client/services/index.ts`

#### [MODIFY] [client/package.json](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/package.json), [client/next.config.ts](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/next.config.ts) & [client/scripts/check-ui-rules.mjs](file:///c:/Users/An/Documents/GR1/InterviewCoach/client/scripts/check-ui-rules.mjs)

- `client/package.json`: Gỡ bỏ `"swr": "^2.4.1"` và chạy `npm uninstall swr`.
- `client/next.config.ts`: Bổ sung `'@tanstack/react-query'` vào danh sách `experimental.optimizePackageImports`.
- `client/scripts/check-ui-rules.mjs`: Bổ sung `'trpc'` và `'hooks'` vào danh sách thư mục quét của `resolveTargetFiles` khi chạy `--all` (`for (const dir of ['app', 'components', 'hooks', 'trpc', 'test-utils'])`), đảm bảo mọi tệp trong `client/trpc/**` và `client/hooks/**` tuân thủ tuyệt đối quy chuẩn Zero-Hex.
- Kiểm tra không còn bất kỳ dòng `import ... from 'swr'` hay `import ... from '@/services'` nào trên toàn bộ `client/`.

---

## 4. Kế Hoạch Kiểm Chứng & Nghiệm Thu Từng Chặng (Verification Plan)

### 4.1. Cổng Kiểm Chứng Chặng 1 (Docs-First Gate)

```bash
cd client
npm run verify:docs      # Kiểm tra toàn vẹn 100% tài liệu (24 files Markdown, 131 Rule IDs, Code Block Zero-Hex Linter, Link & Anchor Integrity, 6-Part Anatomy)
npm run format:check     # Kiểm tra Prettier cho toàn bộ tài liệu Markdown và script
```

### 4.2. Cổng Kiểm Chứng Chặng 2, 3, 4 (Code & Quality Gates)

### 4.2. Cổng Kiểm Chứng Chặng 2 (Code & Quality Gate)

```bash
cd client
npm run typecheck        # tsc --noEmit (0 lỗi TypeScript)
npm run lint             # ESLint 9 (0 lỗi)
npm run format:check     # Prettier check (0 lỗi)
npm run stylelint        # Stylelint trên **/*.module.css (0 lỗi)
npm run ui:lint          # check-ui-rules.mjs (0 lỗi Zero-Hex & Mantine v9)
npm run test:unit        # Vitest 4 (--project unit) chạy toàn bộ unit tests (100% PASS)
npm run build            # Next.js 16 production build (Exit Code 0)
npm run verify:docs      # Đảm bảo tài liệu và codebase đồng bộ tuyệt đối (0 errors, 0 warnings)
```
