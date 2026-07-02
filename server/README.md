# InterviewCoach — Backend

NestJS 11, TypeScript 5.7, Prisma, BullMQ, Redis, Supabase (PostgreSQL + Auth).

API: `http://localhost:3000/api/v1`  
Health check: `http://localhost:3000/health`

---

## Yêu cầu

- Node.js >= 20
- Docker Desktop (để chạy Redis)
- Tài khoản Supabase với PostgreSQL đã cấu hình
- OpenAI API key

---

## Cài đặt lần đầu

Từ thư mục `server/`:

```powershell
npm install
Copy-Item .env.example .env
```

Mở `.env` và điền các biến bắt buộc:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

DATABASE_URL=
DIRECT_URL=

OPENAI_API_KEY=
```

Giữ nguyên các giá trị mặc định nếu không đổi port:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## Chạy local

Mở Docker Desktop, sau đó từ thư mục `server/`:

```powershell
npm run infra:up
npm run start:dev
```

Hoặc dùng lệnh gộp:

```powershell
npm run dev:local
```

Khi thấy `Nest application successfully started` trong log, server đã sẵn sàng.

Kiểm tra:

```powershell
npm run verify:runtime
```

Lệnh này gọi `GET /api/v1` và `GET /health`. Nếu DB hoặc Redis chưa sẵn sàng, `/health` trả `status: "degraded"` và lệnh verify sẽ fail.

---

## Bỏ qua đăng nhập khi dev local

Thêm vào `.env`:

```env
AUTH_ENABLED=false
MOCK_USER_ID=<UUID-của-user-có-sẵn-trong-public.users>
```

`MOCK_USER_ID` phải là UUID thật trong database, không được bịa.

Khi bật, `JwtAuthGuard` và `SseTokenGuard` inject mock user thay vì verify JWT — không gọi Supabase.

> **Không bật trong production.** Set `AUTH_ENABLED=true` hoặc xóa var trước khi deploy.

---

## Các lệnh thường dùng

| Lệnh | Mục đích |
|------|----------|
| `npm run start:dev` | Chạy NestJS watch mode |
| `npm run dev:local` | `infra:up` + `start:dev` gộp |
| `npm run infra:up` | Bật Redis bằng Docker Compose |
| `npm run infra:down` | Tắt Redis |
| `npm run verify:runtime` | Kiểm tra `/api/v1` và `/health` |
| `npm run test` | Chạy unit tests |
| `npm run test:cov` | Unit tests + coverage report |
| `npm run test:e2e` | E2E tests |
| `npm run build` | Compile sang `dist/` |
| `npm run start:prod` | Chạy production build |
| `npm run lint` | ESLint --fix |
| `npm run format` | Prettier --write |
| `npm run prisma:generate` | Tạo lại Prisma Client |
| `npm run db:validate` | Validate Prisma schema |
| `npm run db:verify:pre` | Kiểm tra anomaly trước khi siết constraint/index raw SQL |
| `npm run db:verify` | Kiểm tra RLS/policies/trigger/constraint/index sau khi apply raw SQL |
| `npm run db:prepare-db-push-raw-sql` | Tạm gỡ raw constraint mà Prisma `db push` không quản lý, trước khi apply lại bằng `db:apply-sql` |
| `npm run db:sync:full` | Flow đầy đủ: validate → verify pre → generate → prepare → db push → apply raw SQL → verify |
| `npm run seed` | Seed dữ liệu mẫu (question bank, ...) |

---

## Đồng bộ database schema (`db:sync:full`)

> **Không chạy thường xuyên.** Lệnh này thay đổi schema database thật — chỉ chạy khi có lý do cụ thể.

Chạy khi:
- Vừa thay đổi `prisma/schema.prisma`
- Database local thiếu constraint, trigger, RLS policy, index hoặc column mới
- Cần chuẩn bị unique constraint cho `user_answers`
- Cần apply lại raw SQL trong `prisma/migrations/migration.sql` sau `prisma db push`

```powershell
npm run db:sync:full
```

Lệnh thực hiện: `db:validate` → `db:verify:pre` → `prisma generate` → `db:prepare-user-answer-unique` → `db:prepare-db-push-raw-sql` → `prisma db push` → `db:apply-sql` → `db:verify`.

`db:verify:pre` phải pass trước khi apply constraint mới. Các anomaly chặn migration gồm answer lệch session-question, session trỏ saved JD khác user, nhiều active resume cùng user, orphan soft refs trong `question_usage`, và dữ liệu vi phạm CHECK/range.

Với production hoặc dữ liệu quan trọng, chạy thêm bài test copy trước khi sync:

```powershell
npm run db:test-user-answer-migration
npm run db:sync:full
```

Script test tạo schema tạm, sao chép dữ liệu thật, kiểm tra dedupe và constraint, rồi xóa schema tạm.

`npm run db:sync` trỏ thẳng tới `db:sync:full` để tránh quên raw SQL. Nếu cần debug riêng phần Prisma, dùng `npm run db:sync:prisma`, nhưng phải chạy `npm run db:apply-sql && npm run db:verify` ngay sau đó.

---

## Chạy production build

```powershell
npm run build
npm run start:prod
```

`npm run build` tự chạy `prisma generate` trước khi compile. Entrypoint production: `server/dist/main.js`.

Kiểm tra sau khi start:

```powershell
npm run verify:runtime
```

---

## Docker Compose

`docker-compose.yml` trong thư mục `server/` hiện chỉ dùng để chạy Redis. Backend NestJS chạy bằng npm trực tiếp.

> **Không chạy** `docker compose up --build server` — file Compose này không khai báo service `server`.

---

## Dừng server

Dừng NestJS: `Ctrl+C` trong terminal đang chạy.

Dừng Redis:

```powershell
npm run infra:down
```

Port 3000 bị chiếm:

```powershell
# Xem process nào giữ port
Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess

# Dừng process (thay <PID> bằng số thực tế)
Stop-Process -Id <PID> -Force
```

---

## Lỗi thường gặp

**`ECONNREFUSED 127.0.0.1:6379`**

Redis chưa chạy. Kiểm tra Docker Desktop đã mở, rồi chạy `npm run infra:up`.

**`/health` trả `degraded`**

```powershell
Invoke-RestMethod http://localhost:3000/health
```

- `services.db.status = "down"`: kiểm tra `DATABASE_URL`, kết nối Supabase, rồi thử `npm run db:validate`.
- `services.redis.status = "down"`: kiểm tra Docker Desktop và chạy `npm run infra:up`.

**`401 Unauthorized`**

Nếu đang dev local, kiểm tra `AUTH_ENABLED=false` và `MOCK_USER_ID` đã điền. Sau khi sửa `.env`, khởi động lại server.

**Prisma lỗi missing column hoặc stale field**

```powershell
npm run prisma:generate
npm run build
```

Nếu database thật chưa đồng bộ schema, chạy `npm run db:sync` (đọc phần cảnh báo ở trên trước).
