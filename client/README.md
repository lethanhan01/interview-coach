# InterviewCoach — Frontend

**Next.js 16 (App Router), React 19, TypeScript 5, Mantine UI v9 (`^9.8.2`, Zero-Hex Semantic-Only, bao gồm `@mantine/charts` & `@mantine/dates`), `@mantine/form` + Zod v4, `@tabler/icons-react`, TanStack Query v5.**

Toàn bộ giao diện `client/` tuân thủ 100% chuẩn **Mantine UI v9 Zero-Hex Semantic-Only** với CSS Cascade Layers (`@layer mantine, components;` trong `app/globals.css`).

Ứng dụng chạy cục bộ ở `http://localhost:5173`.

---

## Yêu cầu

- Node.js >= 20
- `npm`
- Backend NestJS đang chạy ở `http://localhost:3000` (xem [server/README.md](../server/README.md))

---

## Cài đặt lần đầu

Từ thư mục `client/`:

```bash
npm install
```

Tạo `.env.local` và điền biến môi trường bắt buộc (frontend sẽ fail-fast khi khởi động hoặc build nếu thiếu biến này):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

---

## Chạy dev

```bash
npm run dev
```

- App chạy ở `http://localhost:5173`.
- Chạy song song Next.js + Storybook (`http://localhost:6006`): `npm run dev:all`.

---

## Deploy lên Vercel

Khi import repository trên Vercel:

- Root Directory: `client`
- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: để trống, Vercel tự nhận `.next`

File [vercel.json](./vercel.json) trong thư mục này đã khai báo sẵn cấu hình deploy frontend độc lập với backend.

Thêm biến môi trường sau trong Vercel Project Settings:

```env
NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>/api/v1
```

---

## Các lệnh thường dùng

| Lệnh                      | Mục đích                                                               |
| ------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`             | Chạy Next.js dev server (port `5173`)                                  |
| `npm run build`           | Build production Next.js 16                                            |
| `npm run typecheck`       | Kiểm tra kiểu TypeScript (`tsc --noEmit`)                              |
| `npm run lint`            | Chạy ESLint 9                                                          |
| `npm run format:check`    | Kiểm tra format Prettier (`semi: false`, `singleQuote: true`)          |
| `npm run stylelint`       | Kiểm tra Stylelint trên `**/*.module.css`                              |
| `npm run ui:lint`         | Kiểm toán quy chuẩn Mantine v9 Zero-Hex (`scripts/check-ui-rules.mjs`) |
| `npm run test:unit`       | Chạy unit/component tests với Vitest 4 (`--project unit`, `jsdom`)     |
| `npm run test:storybook`  | Chạy Storybook tests với Vitest + Playwright browser                   |
| `npm run test:a11y`       | Chạy kiểm tra accessibility trên Storybook                             |
| `npm run test:visual`     | Chạy Playwright visual regression tests                                |
| `npm run test:e2e`        | Chạy Playwright E2E tests                                              |
| `npm run test:e2e:ui`     | Chạy Playwright E2E với giao diện tương tác                            |
| `npm run verify:docs`     | Kiểm tra tính toàn vẹn hệ thống tài liệu Frontend                      |
| `npm run storybook`       | Mở Storybook 10 dev server (port `6006`)                               |
| `npm run build-storybook` | Build tĩnh Storybook ra `storybook-static/`                            |

## Kiểm thử xác thực tích hợp

Đặt `E2E_TEST_EMAIL` và `E2E_TEST_PASSWORD` cho một tài khoản đã seed trong `public.users`, rồi chạy `npm run test:e2e`.

---

## Bản đồ đọc dự án trong 5 phút cho người mới

Để nắm nhanh luồng hoạt động của Frontend từ ngoài vào trong, đọc theo đúng thứ tự phụ thuộc một chiều sau:

1. **`app/`** — Next.js 16 App Router thuần routing (5 Route Groups: `(public)`, `(auth)`, `(candidate)`, `(admin)`, `(common)`); chỉ chứa `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` (chiến lược **Thin `app/`**, không đặt `_components/` trong `app/`).
2. **`providers/`** — Toàn bộ React Context & App-level Client Providers (`AppProviders`, `AuthProvider`, `QueryProvider`).
3. **`components/`** — Toàn bộ Shared & Domain UI Components dựng trên Mantine v9 (`layout`, `common`, `landing`, `auth`, `interview`, `interview-setup`, `jd-library`, `sessions`, `report`, `resume`, `profile`, `onet`, `sfia`).
4. **`styles/`** & **`theme.ts`** — SSOT Mantine v9 Theme (Zero-Hex, RSC-safe) và các shared semantic CSS Modules (`surfaces`, `interactions`, `typography`).
5. **`queries/`** — 100% Pure TS / RSC-safe TanStack Query v5 (`query-client.ts`, `keys.ts`, `*.queries.ts` theo từng miền, không barrel).
6. **`hooks/`** — Shared Cross-App Custom Hooks (`useSessionEvents`, `useCountdown`).
7. **`services/`** — Typed HTTP clients theo domain (`*.service.ts`).
8. **`types/`** & **`lib/`** — Pure TypeScript contracts (11 Bounded Contexts) và pure TS utilities (0 file `.tsx`).

---

## Cấu trúc thư mục

```text
client/
├── app/
│   ├── (public)/          — Trang đích công khai (Landing)
│   ├── (auth)/            — Đăng nhập, đăng ký, đặt lại mật khẩu (Thin routing: page.tsx & layout.tsx)
│   ├── (candidate)/       — Luồng ứng viên: setup, sessions/[sessionId], jd-library, resume, profile
│   ├── (admin)/admin/     — Trang quản trị: dashboard, users, sfia, onet, profile
│   ├── (common)/          — Trang trạng thái hệ thống: offline, maintenance, unauthorized, unauthenticated, too-many-requests, coming-soon
│   ├── layout.tsx         — RootLayout (ColorSchemeScript, MantineProvider, AppProviders, OfflineBanner)
│   ├── globals.css        — Khai báo @layer mantine, components + @mantine/*/styles.layer.css + View Transitions
│   ├── error.tsx          — Route Error Boundary
│   └── global-error.tsx   — Global Error Boundary
├── providers/             — App-level Client Providers (AppProviders, AuthProvider, QueryProvider) + __tests__/
├── styles/                — Shared Semantic CSS Modules (surfaces, interactions, typography) chuẩn Mantine v9 Zero-Hex
├── components/            — Toàn bộ UI components theo miền (admin, layout, common, landing, auth, interview, interview-setup, jd-library, sessions, report, resume, profile, onet, sfia)
├── queries/               — Pure TS / RSC-safe TanStack Query v5 (query-client.ts, keys.ts, *.queries.ts) + __tests__/
├── hooks/                 — Shared cross-app custom hooks (useSessionEvents, useCountdown)
├── services/              — API service layer theo domain (*.service.ts) + __tests__/
├── types/                 — Pure TypeScript Domain & API Contracts (11 Bounded Contexts)
├── lib/                   — 100% Pure TS Infrastructure (api-client, auth-redirect, date-time, form-errors, setup-helpers)
├── config/                — Static config (navigation.ts)
├── middleware/            — Auth & routing middleware helpers
├── test-utils/            — Custom render (@test-utils) + fixtures/report.fixture.ts
├── stories/               — Storybook foundations & component stories (layout/, common/, interview/, landing/, pages/, profile/, report/)
├── e2e/                   — Playwright E2E & visual test suites
├── scripts/               — Static UI rules linter (check-ui-rules.mjs), docs verifier
├── docs/
│   ├── docs/              — Master Hub & 16 chuyên đề quy chuẩn kiến trúc Frontend (4 miền)
│   └── mantine/           — Cẩm nang thực hành Mantine UI v9 (Zero-Hex, Forms, Hooks, Testing)
├── theme.ts               — Mantine v9 theme (RSC-safe, Zero-Hex, 5 semantic roles, focusClassName)
├── postcss.config.mjs     — postcss-preset-mantine + postcss-simple-vars (breakpoints xs..xl)
├── next.config.ts         — Env validation, optimizePackageImports, redirects
├── .stylelintrc.json      — Quy tắc Stylelint cho CSS Modules
└── proxy.ts               — Next.js Proxy cho auth & redirect
```

---

## Quy ước quan trọng

- **App Router only** — không dùng thư mục `pages/`.
- **Server Components mặc định** — chỉ thêm `'use client'` khi component cần tương tác, event handlers hoặc browser/Mantine client hooks; giữ `theme.ts` hoàn toàn RSC-safe.
- **Mantine-First & Zero-Hex** — dùng trực tiếp `@mantine/core`, `@mantine/hooks`, `@mantine/form` + Zod v4, `@tabler/icons-react`, và 5 vai trò màu ngữ nghĩa (`brand`, `success`, `warning`, `danger`, `neutral`, `c="dimmed"`).
- **Quản lý State phân tầng** — **TanStack Query v5 (`@tanstack/react-query`)** cho server state, **React Context** cho auth session, **Next.js URL params** cho filter/navigation, và `useState` + **`@mantine/hooks`** cho local UI state.
- **Tách biệt Backend** — không gọi Supabase DB trực tiếp từ client; toàn bộ dữ liệu đi qua NestJS backend qua lớp `services/`.

---

## Tài liệu quy chuẩn Frontend

- [Master Hub Quy chuẩn Kiến trúc Frontend (`docs/docs/README.md`)](./docs/docs/README.md)
- [Cẩm nang Mantine UI v9 (`docs/mantine/README.md`)](./docs/mantine/README.md)
- [Bộ luật AI Agents (`../AGENTS.md`)](../AGENTS.md)

---

## Lỗi thường gặp

**Không gọi được API**

Kiểm tra `NEXT_PUBLIC_API_BASE_URL` trong `.env.local` và xác nhận NestJS backend đang chạy đúng endpoint.

**Port 5173 bị chiếm**

```bash
# Xem process nào đang giữ port
netstat -ano | findstr :5173

# Dừng process (thay <PID> bằng số thực tế)
taskkill /PID <PID> /F
```
