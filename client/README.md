# InterviewCoach — Frontend

Next.js 16 (App Router), React 19, Tailwind CSS v4.

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
```

Tạo `.env.local` và điền (frontend sẽ không khởi động nếu thiếu các biến này):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

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
NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>/api/v1
```

---

## Các lệnh thường dùng

| Lệnh | Mục đích |
|------|----------|
| `npm run dev` | Chạy dev server (port 5173) |
| `npm run build` | Build production |
| `npm run lint` | Chạy ESLint |
| `npm run test:e2e` | Chạy Playwright E2E tests |
| `npm run test:e2e:ui` | Playwright với giao diện tương tác |

## Kiểm thử xác thực tích hợp

Đặt `E2E_TEST_EMAIL` và `E2E_TEST_PASSWORD` cho một tài khoản đã seed trong `public.users`, rồi chạy Playwright.

---

## Cấu trúc thư mục

```
app/
  (auth)/login/        — Trang đăng nhập
  (app)/sessions/      — Danh sách phiên, interview, report
  (app)/setup/         — Tạo phiên mới
  (app)/profile/       — Hồ sơ người dùng
components/
  interview/           — Giao diện phỏng vấn (audio, chat, controls)
  report/              — Hiển thị report (heatmap, feedback, summary)
lib/
  api-client.ts        — HTTP client gọi NestJS backend
  types.ts             — Shared TypeScript types
proxy.ts               — Next.js Proxy cho auth và redirect
```

---

## Quy ước quan trọng

- App Router only — không dùng `pages/` directory.
- Server Components là mặc định. Chỉ thêm `'use client'` khi cần tương tác hoặc browser API.
- Không gọi Supabase DB trực tiếp từ client — toàn bộ data đi qua NestJS backend.
- State management: React hooks thuần, không dùng Redux hay Zustand.

---

## Lỗi thường gặp

**Không gọi được API**

Kiểm tra `NEXT_PUBLIC_API_BASE_URL` trong `.env.local` và backend đang chạy đúng endpoint.

**Port 5173 bị chiếm**

```bash
# Xem process nào đang giữ port
netstat -ano | findstr :5173

# Dừng process (thay <PID> bằng số thực tế)
taskkill /PID <PID> /F
```
