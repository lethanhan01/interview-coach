# InterviewCoach — Frontend

Next.js 16 (App Router), React 19, Tailwind CSS v4, Supabase Auth.

Chạy ở `http://localhost:5173`.

---

## Yêu cầu

- Node.js >= 20
- Backend đang chạy ở `http://localhost:3000` (xem [server/README.md](../server/README.md))

---

## Cài đặt lần đầu

Từ thư mục `client/`:

```bash
npm install
cp .env.example .env.local
```

Mở `.env.local` và điền:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

---

## Bỏ qua đăng nhập khi dev local

Thêm vào `.env.local`:

```env
NEXT_PUBLIC_SKIP_AUTH=true
```

Khi bật, middleware bỏ qua Supabase session check và `api-client.ts` gửi `Authorization: Bearer dev-mock-token` thay vì fetch JWT thật.

> **Lưu ý:** Phía backend cũng phải bật `AUTH_ENABLED=false` với `MOCK_USER_ID` hợp lệ để hai bên khớp nhau.

> **Không bật trong production.** Xóa hoặc set `NEXT_PUBLIC_SKIP_AUTH=false` trước khi deploy.

---

## Chạy dev

```bash
npm run dev
```

App chạy ở `http://localhost:5173`.

---

## Deploy lên Vercel

Khi import repository trên Vercel:

- Root Directory: `client`
- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: để trống, Vercel tự nhận `.next`

File `vercel.json` trong thư mục này đã khai báo sẵn các lệnh trên để deploy frontend độc lập với backend.

Thêm các biến môi trường sau trong Vercel Project Settings:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>/api/v1
NEXT_PUBLIC_SKIP_AUTH=false
```

Nếu deploy theo chế độ MVP bỏ qua đăng nhập, chỉ đặt `NEXT_PUBLIC_SKIP_AUTH=true` khi backend production cũng được cấu hình tương ứng để chấp nhận mock token.

---

## Các lệnh thường dùng

| Lệnh | Mục đích |
|------|----------|
| `npm run dev` | Chạy dev server (port 5173) |
| `npm run build` | Build production |
| `npm run lint` | Chạy ESLint |
| `npm run test:e2e` | Chạy Playwright E2E tests |
| `npm run test:e2e:ui` | Playwright với giao diện tương tác |

---

## Cấu trúc thư mục

```
app/
  (auth)/login/        — Trang đăng nhập
  (auth)/callback/     — Supabase Auth callback
  (app)/sessions/      — Danh sách phiên, interview, report
  (app)/setup/         — Tạo phiên mới
  (app)/profile/       — Hồ sơ người dùng
components/
  interview/           — Giao diện phỏng vấn (audio, chat, controls)
  report/              — Hiển thị report (heatmap, feedback, summary)
lib/
  api-client.ts        — HTTP client gọi NestJS backend
  supabase.ts          — Browser Supabase client
  supabase-server.ts   — Server Supabase client (Server Components)
  types.ts             — Shared TypeScript types
middleware.ts          — Route protection (redirect về /login nếu chưa đăng nhập)
```

---

## Quy ước quan trọng

- App Router only — không dùng `pages/` directory.
- Server Components là mặc định. Chỉ thêm `'use client'` khi cần tương tác hoặc browser API.
- Không gọi Supabase DB trực tiếp từ client — toàn bộ data đi qua NestJS backend.
- State management: React hooks thuần, không dùng Redux hay Zustand.

---

## Lỗi thường gặp

**`401 Unauthorized` khi gọi API**

Kiểm tra `NEXT_PUBLIC_SKIP_AUTH=true` đã bật và backend đang chạy với `AUTH_ENABLED=false`.

**Trang trắng hoặc redirect loop về `/login`**

Kiểm tra `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` đã điền đúng trong `.env.local`.

**Port 5173 bị chiếm**

```bash
# Xem process nào đang giữ port
netstat -ano | findstr :5173

# Dừng process (thay <PID> bằng số thực tế)
taskkill /PID <PID> /F
```
