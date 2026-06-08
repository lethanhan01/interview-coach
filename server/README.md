<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>

# InterviewCoach Backend

Backend NestJS cho InterviewCoach. API mặc định chạy tại:

```text
http://localhost:3000/api/v1
```

Frontend local được phép truy cập từ:

```text
http://localhost:5173
```

## Yêu cầu

- Node.js và npm
- PostgreSQL/Supabase đã được cấu hình
- Docker Desktop để chạy backend/Redis bằng Docker Compose hoặc Redis local
- File `server/.env` có đầy đủ biến môi trường

## Cài đặt lần đầu

Chạy từ thư mục gốc của repository:

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Điền các biến bắt buộc trong `.env`:

```dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

DATABASE_URL=
DIRECT_URL=

OPENAI_API_KEY=

REDIS_HOST=localhost
REDIS_PORT=6379

PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Chế độ bỏ qua đăng nhập khi phát triển

Để frontend và backend bỏ qua Supabase Auth ở local:

```dotenv
AUTH_ENABLED=false
MOCK_USER_ID=<UUID-cua-user-co-san-trong-public.users>
```

`MOCK_USER_ID` bắt buộc phải là UUID của một user thực sự tồn tại trong database.
Không dùng các chuỗi như `dev-user-1`, vì cột `user_id` trong PostgreSQL có kiểu
`UUID`.

Trong production:

```dotenv
AUTH_ENABLED=true
```

## Chạy bằng Docker Compose

Mở Docker Desktop, rồi chạy từ thư mục gốc repository:

```powershell
docker compose up --build server
```

Lệnh này sẽ tự khởi động Redis nội bộ và backend NestJS. API vẫn được publish ra:

```text
http://localhost:3000/api/v1
```

Compose đọc biến môi trường từ `server/.env`, nhưng tự override `REDIS_HOST=redis`
cho backend trong Docker network. Vì vậy bạn vẫn có thể giữ `REDIS_HOST=localhost`
trong `.env` để chạy backend trực tiếp bằng npm.

Dừng server Docker:

```powershell
docker compose down
```

## Khởi động Redis

Chỉ cần phần này khi bạn chạy backend trực tiếp bằng `npm run start:dev`.
Backend sử dụng Redis cho BullMQ và SSE. Hãy mở Docker Desktop trước, sau đó chạy:

```powershell
docker start interviewcoach-redis
```

Nếu container chưa tồn tại:

```powershell
docker run --name interviewcoach-redis -p 6379:6379 -d redis:7-alpine
```

Kiểm tra Redis:

```powershell
docker ps --filter "name=interviewcoach-redis"
Test-NetConnection localhost -Port 6379
```

`TcpTestSucceeded` phải là `True`.

## Dừng process backend cũ

Trước khi chạy backend, dừng toàn bộ process đang giữ port `3000`:

```powershell
$backendPids = @(
  Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
)

foreach ($backendPid in $backendPids) {
  Stop-Process -Id $backendPid -Force
}
```

Xác nhận port đã trống:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
```

Không có output nghĩa là port đã trống.

Không nên dùng:

```powershell
Stop-Process -Name node -Force
```

Lệnh trên sẽ dừng tất cả ứng dụng Node.js, bao gồm cả frontend đang chạy trên
port `5173`.

## Chạy backend

### Cách nhanh bằng Docker

Mở PowerShell tại thư mục gốc repository:

```powershell
docker compose up --build server
```

### Chạy trực tiếp bằng npm

#### Quy trình đầy đủ cho local development

Mở PowerShell tại thư mục gốc repository:

```powershell
cd server
```

1. Dừng backend cũ:

```powershell
$backendPids = @(
  Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
)

foreach ($backendPid in $backendPids) {
  Stop-Process -Id $backendPid -Force
}
```

2. Khởi động Redis:

```powershell
docker start interviewcoach-redis
```

Nếu Docker báo không tìm thấy container:

```powershell
docker run --name interviewcoach-redis -p 6379:6379 -d redis:7-alpine
```

3. Kiểm tra Prisma:

```powershell
npx prisma validate
```

4. Chạy backend ở watch mode:

```powershell
npm run start:dev
```

Đây là lệnh khuyến nghị khi phát triển. NestJS sẽ tự compile lại khi source code
thay đổi.

Khi thành công, terminal hiển thị:

```text
Nest application successfully started
```

#### Chạy không có watch mode

```powershell
npm start
```

#### Chạy production build

```powershell
npm run build
npm run start:prod
```

## Kiểm tra backend

Kiểm tra port:

```powershell
Test-NetConnection localhost -Port 3000
```

Kiểm tra API root:

```powershell
Invoke-WebRequest http://localhost:3000/api/v1
```

Kiểm tra danh sách session trong local auth bypass:

```powershell
Invoke-RestMethod `
  -Uri http://localhost:3000/api/v1/sessions `
  -Headers @{ Authorization = "Bearer dev-mock-token" }
```

## Dừng backend

Nếu backend đang chạy trực tiếp trong terminal, nhấn:

```text
Ctrl+C
```

Nếu terminal đã đóng nhưng process vẫn còn:

```powershell
$backendPids = @(
  Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
)

foreach ($backendPid in $backendPids) {
  Stop-Process -Id $backendPid -Force
}
```

## Lỗi thường gặp

### `EADDRINUSE: address already in use :::3000`

Đã có process khác sử dụng port `3000`.

Xem PID:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

Dừng process:

```powershell
Stop-Process -Id <PID> -Force
```

Sau đó chạy lại:

```powershell
npm run start:dev
```

Nếu đang chạy bằng Docker Compose:

```powershell
docker compose up --build server
```

### `ECONNREFUSED 127.0.0.1:6379`

Redis chưa chạy khi backend được chạy trực tiếp bằng npm. Mở Docker Desktop rồi chạy:

```powershell
docker start interviewcoach-redis
```

Nếu chạy bằng Docker Compose, Redis được bật tự động:

```powershell
docker compose up --build server
```

### API trả `401 Unauthorized`

Kiểm tra cặp cấu hình local:

```dotenv
AUTH_ENABLED=false
MOCK_USER_ID=<UUID-hop-le>
```

Sau khi sửa `.env`, phải dừng và chạy lại backend.

### Prisma báo UUID không hợp lệ

Ví dụ:

```text
invalid input syntax for type uuid
```

`MOCK_USER_ID` không phải UUID hợp lệ hoặc không khớp user trong database.

## Kiểm tra chất lượng

```powershell
# Unit tests
npm test

# Toàn bộ test chạy tuần tự
npm test -- --runInBand

# Build
npm run build

# Validate Prisma schema
npx prisma validate
```

## Scripts

| Lệnh | Mục đích |
| --- | --- |
| `npm run start:dev` | Chạy development với watch mode |
| `npm start` | Chạy development không có watch mode |
| `npm run build` | Compile source vào `dist/` |
| `npm run start:prod` | Chạy production build từ `dist/` |
| `npm test` | Chạy unit tests |
| `npm run test:e2e` | Chạy end-to-end tests |
| `npm run test:cov` | Chạy tests và xuất coverage |
| `npm run lint` | Chạy ESLint và tự sửa lỗi có thể sửa |
| `npm run seed` | Seed dữ liệu mẫu |
