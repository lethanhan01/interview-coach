# InterviewCoach — Frontend

**Next.js 16 (App Router), React 19, TypeScript 5, Mantine UI v9 (`^9.8.2`, Zero-Hex Semantic-Only), `@mantine/form` + Zod v4, `@tabler/icons-react`, SWR.**

> **Ghi chú chuyển tiếp**: Tailwind CSS v4 và một số component legacy vẫn đang tồn tại song song qua CSS Cascade Layers (`@layer theme, base, mantine, components, utilities;` trong `app/globals.css`) trong giai đoạn chuẩn hóa sang Mantine v9. Mọi UI mới và màn hình cập nhật đều tuân thủ 100% chuẩn Mantine v9.

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

## Cấu trúc thư mục

```text
client/
├── app/
│   ├── (public)/          — Trang đích công khai (Landing)
│   ├── (auth)/            — Đăng nhập, đăng ký, đặt lại mật khẩu (login, register, reset-password)
│   ├── (candidate)/       — Luồng ứng viên: setup, sessions/[sessionId], jd-library, resume, profile
│   ├── (admin)/admin/     — Trang quản trị: dashboard, users, sfia, onet, profile
│   ├── (common)/          — Trang trạng thái hệ thống: offline, maintenance, unauthorized, unauthenticated, too-many-requests, coming-soon
│   ├── layout.tsx         — RootLayout (ColorSchemeScript, MantineProvider, Notifications, ModalsProvider)
│   ├── globals.css        — Khai báo @layer + @mantine/*/styles.layer.css (+ CSS chuyển tiếp)
│   ├── error.tsx          — Route Error Boundary
│   └── global-error.tsx   — Global Error Boundary
├── components/            — Shared & domain UI components (interview, report, auth, patterns, ...)
├── hooks/                 — Custom hooks (useAuth, useSessions, useSessionEvents, useCountdown)
├── services/              — API service layer theo domain (*.service.ts)
├── lib/                   — API client, auth context, date-time helpers, shared types
├── middleware/            — Auth & routing middleware helpers
├── test-utils/            — Custom render bọc MantineProvider env="test" + ModalsProvider
├── stories/               — Storybook foundations & component stories
├── e2e/                   — Playwright E2E test suites
├── scripts/               — Static UI rules linter (check-ui-rules.mjs), docs verifier
├── docs/
│   ├── docs/              — Master Hub & 17 chuyên đề quy chuẩn kiến trúc Frontend
│   └── mantine/           — Cẩm nang thực hành Mantine UI v9 (Zero-Hex, Forms, Hooks, Testing)
├── theme.ts               — Mantine v9 theme (RSC-safe, Zero-Hex, 5 semantic roles)
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
- **Quản lý State phân tầng** — **SWR** cho server state, **React Context** cho auth session, **Next.js URL params** cho filter/navigation, và `useState` + **`@mantine/hooks`** cho local UI state.
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
