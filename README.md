# InterviewCoach

Ứng dụng luyện phỏng vấn AI dành cho sinh viên CNTT Việt Nam. Người dùng paste Job Description, trả lời câu hỏi bằng giọng nói hoặc text, nhận phản hồi chi tiết từ AI kèm highlight từng đoạn cụ thể.

## Cấu trúc repo

```
client/   — Next.js 16 frontend (App Router, React 19, Tailwind v4)
server/   — NestJS 11 backend (TypeScript, BullMQ, Prisma, Redis)
docs/     — Tài liệu thiết kế (SAD, HLD, ADR, DB design, API design)
```

## Hướng dẫn chạy

- Frontend: [client/README.md](client/README.md)
- Backend: [server/README.md](server/README.md)

## Yêu cầu chung

- Node.js >= 20
- npm >= 10
- Docker Desktop (để chạy Redis)
- Tài khoản Supabase (PostgreSQL + Auth)
- OpenAI API key

## Thứ tự khởi động

1. Chạy Redis: `npm run infra:up` (từ `server/`)
2. Khởi động backend: `npm run start:dev` (từ `server/`)
3. Khởi động frontend: `npm run dev` (từ `client/`)

Backend: `http://localhost:3000/api/v1`  
Frontend: `http://localhost:5173`
