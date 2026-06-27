# InterviewCoach Backend

Backend NestJS cho InterviewCoach.

- API local: `http://localhost:3000/api/v1`
- Health check: `http://localhost:3000/health`
- Frontend local: `http://localhost:5173`

## Quy trình chạy server

Luồng chạy đã được tách thành 4 phần:

| Phần | Lệnh chính | Mục đích |
| --- | --- | --- |
| Infra local | `npm run infra:up` | Bật Redis bằng Docker Compose |
| DB/schema | `npm run db:sync` | Generate Prisma, chuẩn bị unique `user_answers`, rồi `prisma db push` |
| Server runtime | `npm run start:dev` | Chạy NestJS watch mode |
| Kiểm tra runtime | `npm run verify:runtime` | Gọi `/api/v1` và `/health` |

`start`, `start:dev`, `start:debug`, và `build` chỉ tự chạy
`npm run prisma:generate`. Các lệnh này không tự chạy `db:sync`.

## 1. Chuẩn bị lần đầu

Cần có:

- Node.js và npm
- Docker Desktop
- PostgreSQL/Supabase đã cấu hình

Từ thư mục `server`:

```powershell
npm install
Copy-Item .env.example .env
```

Mở `server/.env` và điền các biến bắt buộc:

```dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

DATABASE_URL=
DIRECT_URL=

OPENAI_API_KEY=
```

Giữ các giá trị local này nếu không cần đổi port:

```dotenv
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Nếu muốn bỏ qua đăng nhập Supabase khi phát triển local:

```dotenv
AUTH_ENABLED=false
MOCK_USER_ID=<UUID-cua-user-co-san-trong-public.users>
```

`MOCK_USER_ID` phải là UUID của một user thật trong database.

## 2. Chạy local bằng npm

Mở Docker Desktop, sau đó chạy từ thư mục `server`:

```powershell
npm run infra:up
npm run start:dev
```

Hoặc dùng một lệnh tiện ích:

```powershell
npm run dev:local
```

Khi thấy log `Nest application successfully started`, server đã listen trên
`http://localhost:3000`.

Mở terminal khác để kiểm tra:

```powershell
npm run verify:runtime
```

Lệnh verify gọi:

- `GET http://localhost:3000/api/v1`
- `GET http://localhost:3000/health`

`/health` kiểm tra app, Prisma/database, và Redis. Nếu DB hoặc Redis chưa sẵn
sàng, response sẽ có `status: "degraded"` và `verify:runtime` sẽ fail.

## 3. Khi nào chạy DB sync

Không chạy `db:sync` như một phần mặc định của `start:dev`.

Chỉ chạy khi cần đồng bộ schema/data, ví dụ:

- vừa thay đổi Prisma schema
- database local thiếu constraint hoặc column mới
- cần chạy bước chuẩn bị unique `user_answers`
- trước khi xác nhận migration production liên quan `user_answers`

Chạy từ thư mục `server`:

```powershell
npm run db:sync
```

Lệnh này thực hiện:

1. `prisma generate`
2. `npm run db:prepare-user-answer-unique`
3. `prisma db push`

Với production hoặc dữ liệu quan trọng, chạy kiểm thử migration trước:

```powershell
npm run db:test-user-answer-migration
npm run db:sync
```

Script test tạo schema tạm, sao chép dữ liệu thật của `user_answers`,
`ai_feedbacks`, `annotated_segments`, và `follow_up_questions`, sau đó kiểm tra
dedupe, quan hệ, và unique constraint. Schema tạm được xóa khi kết thúc.

## 4. Chạy production build

Từ thư mục `server`:

```powershell
npm run build
npm run start:prod
```

`npm run build` tự chạy `prisma generate` trước khi build Nest. Sau build,
entrypoint production phải nằm ở:

```text
server/dist/main.js
```

Kiểm tra runtime sau khi start:

```powershell
npm run verify:runtime
```

## 5. Docker Compose hiện tại

`compose.yaml` hiện được dùng để chạy Redis local. Backend NestJS chạy bằng npm
trong thư mục `server`.

Các lệnh npm đã bọc sẵn Compose file ở repo root:

```powershell
npm run infra:up
npm run infra:down
```

Không dùng `docker compose up --build server` ở trạng thái hiện tại, vì service
`server` đang bị tắt trong `compose.yaml`.

## 6. Dừng server

Dừng NestJS trong terminal đang chạy:

```text
Ctrl+C
```

Dừng Redis Compose:

```powershell
npm run infra:down
```

Nếu port `3000` đang bị chiếm, xem process:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

Dừng đúng process đang giữ port:

```powershell
Stop-Process -Id <PID> -Force
```

## 7. Lệnh hữu ích

```powershell
npm run db:validate
npm run prisma:generate
npm run build
npm test
npm run verify:runtime
```

## 8. Lỗi thường gặp

### Redis chưa chạy

Dấu hiệu thường gặp:

```text
ECONNREFUSED 127.0.0.1:6379
```

Xử lý:

```powershell
npm run infra:up
```

Nếu bạn đang có Redis container cũ tên `interviewcoach-redis`, hãy đảm bảo
không có container khác giữ port `6379` trước khi chạy Compose.

### `/health` trả `degraded`

Gọi trực tiếp để xem dependency nào lỗi:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

- `services.db.status = "down"`: kiểm tra `DATABASE_URL`, Supabase/PostgreSQL,
  Prisma schema, hoặc chạy `npm run db:validate`.
- `services.redis.status = "down"`: kiểm tra Docker Desktop và
  `npm run infra:up`.

### API trả `401 Unauthorized`

Nếu đang phát triển local và muốn bỏ qua đăng nhập, kiểm tra:

```dotenv
AUTH_ENABLED=false
MOCK_USER_ID=<UUID-hop-le>
```

Sau khi sửa `.env`, dừng server rồi chạy lại.

### Prisma Client lệch schema

Nếu gặp lỗi kiểu missing column hoặc stale field sau khi đổi schema:

```powershell
npm run prisma:generate
npm run build
```

Nếu database thật chưa đồng bộ schema, chạy `npm run db:sync` có chủ ý sau khi
đã đọc phần DB sync ở trên.
