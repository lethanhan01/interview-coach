# InterviewCoach — Backend

NestJS 11, TypeScript 5.7, Prisma, BullMQ, Redis, Supabase (PostgreSQL + Auth).

API: `http://localhost:3000/api/v1`  
Health check: `http://localhost:3000/health`

Swagger/OpenAPI (development and staging): `http://localhost:3000/api/docs`  
OpenAPI JSON: `http://localhost:3000/api/docs-json`

Mở Swagger cùng origin backend, gọi `POST /auth/login` hoặc `POST /auth/register` trước; cookie JWT HttpOnly sẽ được browser tự gửi cho các endpoint cần xác thực. Swagger bị tắt khi `NODE_ENV=production`. Endpoint SSE nên kiểm thử bằng `EventSource` hoặc `curl`.

---

## Kiến trúc 3 Tầng & Bounded Contexts (3-Layer Architecture)

Backend được tổ chức theo mô hình **3 Tầng Rõ Ràng (Core - Infrastructure - Modules)** kết hợp **Bounded Contexts** chuẩn hóa theo vòng đời phỏng vấn:

```text
server/src/
├── core/                                      ──► [TẦNG 1: NỀN TẢNG CHUNG - ZERO BUSINESS LOGIC]
│   ├── common/                                (Filters, Interceptors, Guards, Middleware, Constants, Swagger)
│   ├── config/                                (Environment Validation, Global Config)
│   ├── runtime/                               (HTTP Server vs Background Worker Roles)
│   ├── types/                                 (Global Domain Types & Enums)
│   └── test-utils/                            (Shared Test Fixtures & Mocks)
│
├── infrastructure/                            ──► [TẦNG 2: HẠ TẦNG KỸ THUẬT - PORTS & ADAPTERS]
│   ├── database/prisma/                       (Prisma ORM, Connection Resilience, Base Repositories)
│   ├── ai/                                    (OpenAI Gateway, Prompt Builders, Zod Schema Validators)
│   ├── storage/                               (IPrivateMediaStorageAdapter, SupabaseMediaAdapter)
│   ├── workflow/                              (Transactional Outbox Engine, BullMQ Dispatcher)
│   └── realtime/                              (WebSocket / SSE Gateway)
│
├── modules/                                   ──► [TẦNG 3: NGHIỆP VỤ ỨNG DỤNG - BOUNDED CONTEXTS]
│   ├── auth/                                  (Authentication, JWT, Password Hashing, Guards)
│   ├── user/                                  (User Profiles, Account Management)
│   ├── admin/                                 (System Ops, Metrics, Operational Dashboards)
│   ├── health/                                (Liveness & Readiness Probes)
│   ├── media/                                 (Private Audio Storage, Whisper STT, Voice Metrics)
│   │
│   ├── interview-prep/                        ──► [Context 1: Chuẩn bị & Tài nguyên Phỏng vấn (Trước)]
│   │   ├── question-generation/               (AI Dynamic Question Generator & BullMQ Processor)
│   │   ├── question-bank/                     (Curated Question Bank & Catalog)
│   │   ├── question-criteria/                 (Assessment Rubric Criteria & Benchmarks)
│   │   └── job-description/                   (Saved JD CRUD & Resume Context Parsing)
│   │
│   ├── interview-live/                        ──► [Context 2: Tiến trình Phỏng vấn Trực tiếp (Trong)]
│   │   ├── session/                           (Session Lifecycle, Mode Strategies: HR / Technical)
│   │   └── turn/                              (Turn Management, Intake Handlers: Text / Voice)
│   │
│   └── interview-assessment/                  ──► [Context 3: Đánh giá, Phản hồi & Báo cáo (Sau)]
│       ├── evaluation/                        (Turn Evaluation, Rubric Scoring, Feedback Sanitizer)
│       └── report/                            (Comprehensive Session Report, Radar Scoring Matrix)
│
├── architecture/                              ──► [KIỂM SOÁT RANH GIỚI TỰ ĐỘNG]
│   └── feature-boundaries.spec.ts             (Automated Boundary Enforcer)
│
├── app.module.ts                              ──► [ROOT MODULE KẾT NỐI RÚT GỌN]
└── main.ts
```

### Path Aliases được hỗ trợ:
- `@core/*` $\rightarrow$ `src/core/*`
- `@infra/*` $\rightarrow$ `src/infrastructure/*`
- `@modules/*` $\rightarrow$ `src/modules/*`
- `@/*` $\rightarrow$ `src/*`

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
SUPABASE_SERVICE_ROLE_KEY=
AUTH_JWT_SECRET=<at-least-32-random-characters>
AUTH_COOKIE_NAME=interviewcoach_auth
AUTH_COOKIE_MAX_AGE=86400
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
PASSWORD_RESET_OTP_TTL_MINUTES=30

DATABASE_URL=
DIRECT_URL=
DB_TIMEZONE=Asia/Ho_Chi_Minh
PRISMA_CONNECTION_TIMEOUT_MS=30000
PRISMA_CONNECT_RETRIES=3

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

`start:dev` là lệnh chuẩn cho môi trường local: Nest theo dõi thay đổi trong `src/` và tự biên dịch lại. Không chạy trực tiếp `node dist/main` hoặc `npm run start:prod` song song với lệnh này. Watch mode có thể xoá và tạo lại `dist/` trong lúc biên dịch, khiến tiến trình đang đọc artifact trong `dist/` lỗi tạm thời `Cannot find module './app.module'`.

Kiểm tra:

```powershell
npm run verify:runtime
```

Lệnh này gọi `GET /api/v1` và `GET /health`. Nếu DB hoặc Redis chưa sẵn sàng, `/health` trả `status: "degraded"` và lệnh verify sẽ fail.

---

## Xác thực local

Đăng ký và đăng nhập đi qua backend; cookie JWT được đặt HttpOnly.

---

## Các lệnh thường dùng

| Lệnh                                 | Mục đích                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `npm run start:dev`                  | Chạy NestJS watch mode                                                                           |
| `npm run dev:local`                  | `infra:up` + `start:dev` gộp                                                                     |
| `npm run infra:up`                   | Bật Redis bằng Docker Compose                                                                    |
| `npm run infra:down`                 | Tắt Redis                                                                                        |
| `npm run verify:runtime`             | Kiểm tra `/api/v1` và `/health`                                                                  |
| `npm run test`                       | Chạy unit tests                                                                                  |
| `npm run test:cov`                   | Unit tests + coverage report                                                                     |
| `npm run test:e2e`                   | E2E tests                                                                                        |
| `npm run build`                      | Compile sang `dist/`                                                                             |
| `npm run start:prod`                 | Chạy artifact production đã build; không dùng đồng thời với build hoặc watch mode                |
| `npm run lint`                       | ESLint --fix                                                                                     |
| `npm run format`                     | Prettier --write                                                                                 |
| `npm run prisma:generate`            | Tạo lại Prisma Client                                                                            |
| `npm run db:validate`                | Validate Prisma schema                                                                           |
| `npm run db:verify:pre`              | Kiểm tra anomaly trước khi siết constraint/index raw SQL                                         |
| `npm run db:verify`                  | Kiểm tra RLS/policies/trigger/constraint/index sau khi apply raw SQL                             |
| `npm run db:prepare-db-push-raw-sql` | Tạm gỡ raw constraint mà Prisma `db push` không quản lý, trước khi apply lại bằng `db:apply-sql` |
| `npm run db:sync:full`               | Flow đầy đủ: validate → verify pre → generate → prepare → db push → apply raw SQL → verify       |

---

## Đồng bộ database schema

> Production safety: `db:sync*` and `db:apply-sql` are blocked when `NODE_ENV=production`. Use reviewed migrations and a backup/PITR runbook instead.

## Emergency write freeze

Set `MAINTENANCE_MODE=true` and `WORKERS_ENABLED=false` in the deployed backend environment, then redeploy. Maintenance mode blocks all non-GET/HEAD/OPTIONS API requests with `503 MAINTENANCE_MODE`; disabling workers prevents BullMQ processors from claiming queued jobs after restart. Health checks and read-only investigation remain available. This does not prevent direct database access or Supabase Dashboard changes.

## Recovery comparison

After Supabase restores PITR into a temporary project, set `RECOVERY_DATABASE_URL` to that project's direct Postgres URL and run `npm run recovery:inventory`. The command opens both databases in `READ ONLY` transactions and emits row-count manifests only; it never imports, updates, or deletes data.

> **Không chạy thường xuyên.** Lệnh này thay đổi schema database thật — chỉ chạy khi có lý do cụ thể.

Chạy khi:

- Vừa thay đổi `prisma/schema.prisma`
- Database local thiếu constraint, trigger, RLS policy, index hoặc column mới
- Cần chuẩn bị unique constraint cho `user_answers`
- Cần apply lại raw SQL trong `prisma/migrations/migration.sql` sau `prisma db push`

Pha cleanup sau khi đã backup DB thật:

```powershell
npm run db:sync:full
```

Trước khi chạy pha cleanup, set `DB_BACKUP_CONFIRMED=true`.

Lệnh thực hiện: `db:validate` → `db:verify:pre` → `prisma generate` → `db:prepare-user-answer-unique` → `db:prepare-db-push-raw-sql` → `prisma db push` → `db:apply-sql` → `db:verify`.

`db:verify:pre` phải pass trước khi apply constraint mới. Các anomaly chặn migration gồm answer lệch session-question, session trỏ saved JD khác user, nhiều active resume cùng user, và dữ liệu vi phạm CHECK/range.

`npm run db:sync` trỏ thẳng tới `db:sync:full` để tránh quên raw SQL. Nếu cần debug riêng phần Prisma, dùng `npm run db:sync:prisma`, nhưng phải chạy `npm run db:apply-sql && npm run db:verify` ngay sau đó.

## Timezone database

Backend, seed và các script DB mở Postgres connection với `DB_TIMEZONE`, mặc định `Asia/Ho_Chi_Minh`. API vẫn trả ISO UTC và schema vẫn dùng `TIMESTAMPTZ`; không cộng/trừ dữ liệu cũ.

Nếu DB provider không cho phép đổi default timezone, app vẫn dùng timezone qua connection options; khi query thủ công có thể dùng `created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'` để xem giờ Việt Nam.

---

## Chạy production build

```powershell
npm run build
npm run start:prod
```

`npm run build` tự chạy `prisma generate` trước khi compile. Entrypoint production: `server/dist/main.js`.

Chỉ chạy `npm run start:prod` sau khi `npm run build` hoàn tất thành công, và không chạy `npm run build` hoặc `npm run start:dev` đồng thời trên cùng thư mục `dist/`. Nếu cần chuyển sang local development, dừng tiến trình production trước rồi dùng `npm run start:dev`.

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

**`Connection terminated due to connection timeout` khi backend khởi động**

Backend sẽ retry Prisma startup check và tiếp tục boot nếu lỗi là timeout kết nối tạm thời; `/health` sẽ báo `services.db.status = "down"` cho tới khi DB hồi phục. Nếu Supabase/connection pool thường xuyên cold-start chậm, tăng `PRISMA_CONNECTION_TIMEOUT_MS`, `PRISMA_TRANSACTION_TIMEOUT_MS`, hoặc `PRISMA_CONNECT_RETRIES` trong `.env`.

**`401 Unauthorized`**

Sau khi sửa cấu hình xác thực hoặc SMTP trong `.env`, khởi động lại server.

**Prisma lỗi missing column hoặc stale field**

```powershell
npm run prisma:generate
npm run build
```

Nếu database thật chưa đồng bộ schema, chạy `npm run db:sync` (đọc phần cảnh báo ở trên trước).
