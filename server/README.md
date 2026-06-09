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

Backend NestJS cho InterviewCoach.

- API local: `http://localhost:3000/api/v1`
- Frontend local: `http://localhost:5173`

## 1. Chuẩn bị lần đầu

Cần có:

- Node.js và npm
- Docker Desktop
- PostgreSQL/Supabase đã cấu hình

Từ thư mục gốc repository, chạy:

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Mở `server/.env` và điền các biến còn trống:

```dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

DATABASE_URL=
DIRECT_URL=

OPENAI_API_KEY=
```

Giữ nguyên các giá trị local này nếu không có nhu cầu đổi port:

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

## 2. Chạy backend bằng Docker Compose

Đây là cách gọn nhất vì Docker Compose tự chạy Redis kèm backend.

Mở Docker Desktop, sau đó chạy từ thư mục gốc repository:

```powershell
docker compose up --build server
```

Khi thấy log `Nest application successfully started`, backend đã chạy tại:

```text
http://localhost:3000/api/v1
```

Dừng backend:

```powershell
docker compose down
```

## 3. Chạy backend trực tiếp bằng npm

Dùng cách này khi muốn backend tự reload khi sửa code.

Mở Docker Desktop và bật Redis:

```powershell
docker start interviewcoach-redis
```

Nếu Redis container chưa tồn tại:

```powershell
docker run --name interviewcoach-redis -p 6379:6379 -d redis:7-alpine
```

Chạy backend:

```powershell
cd server
npm run start:dev
```

Các lệnh `start`, `start:dev`, và `start:debug` tự chạy `npm run db:sync`
trước khi khởi động Nest. Bước này generate Prisma Client và đồng bộ các thay đổi
schema an toàn vào database; thay đổi có nguy cơ mất dữ liệu sẽ bị Prisma chặn.

Khi thấy log `Nest application successfully started`, backend đã sẵn sàng.

Dừng backend đang chạy trong terminal:

```text
Ctrl+C
```

## 4. Kiểm tra nhanh

Kiểm tra port:

```powershell
Test-NetConnection localhost -Port 3000
```

Gọi API root:

```powershell
Invoke-WebRequest http://localhost:3000/api/v1
```

## 5. Lỗi thường gặp

### Port 3000 đang bị chiếm

Xem process đang dùng port:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

Dừng process đó:

```powershell
Stop-Process -Id <PID> -Force
```

Sau đó chạy lại backend.

### Redis chưa chạy

Nếu chạy bằng npm và gặp lỗi `ECONNREFUSED 127.0.0.1:6379`, bật Redis:

```powershell
docker start interviewcoach-redis
```

Nếu chạy bằng Docker Compose, Redis được bật tự động.

### API trả `401 Unauthorized`

Nếu đang phát triển local và muốn bỏ qua đăng nhập, kiểm tra lại:

```dotenv
AUTH_ENABLED=false
MOCK_USER_ID=<UUID-hop-le>
```

Sau khi sửa `.env`, dừng backend rồi chạy lại.

## 6. Lệnh hữu ích

```powershell
npm test
npm run build
npx prisma validate
```
