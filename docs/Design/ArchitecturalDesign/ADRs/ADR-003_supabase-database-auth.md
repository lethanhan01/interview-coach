# ADR-003: Supabase as Database and Auth Provider

| Thuộc tính | Giá trị |
| --- | --- |
| **ID** | ADR-003 |
| **Ngày** | 09/05/2026 |
| **Trạng thái** | Accepted |
| **Tác giả** | Lê Thành An |

## Status

Accepted

## Context

InterviewAI cần các thành phần infrastructure sau:

- PostgreSQL database cho session data, question bank, transcript, rubric scores, user profiles
- Google OAuth 2.0 (S-14: bắt buộc, không có email/password login)
- Row-Level Security (RLS): mỗi user chỉ truy cập được data của mình — enforce tại DB layer để application bug không dẫn đến data leak
- File storage cho CV upload (UC-03 input: `jd_source`, `cv_file`)
- JWT lifecycle management: issue, refresh, revoke (SAD §6)

Các lựa chọn được cân nhắc:

- Supabase: managed PostgreSQL + Auth (OAuth providers out of box) + RLS + Storage + Realtime — hosted SaaS
- Self-hosted PostgreSQL + Auth0/Clerk (auth SaaS) + AWS S3/Cloudflare R2 (storage)
- Self-hosted PostgreSQL + tự implement OAuth flow + tự implement storage

## Decision

**Chọn Supabase.**

Lý do:

1. **Auth với Google OAuth sẵn có**: cấu hình Google OAuth Provider trong Supabase Dashboard, không cần implement OAuth flow. JWT issue và refresh token rotation do Supabase Auth xử lý — SAD §6 JWT lifecycle requirement được fulfill mà không viết custom logic.

2. **RLS tại DB layer**: Supabase PostgreSQL hỗ trợ RLS với `auth.uid()` function — policies như `user_id = auth.uid()` enforce tại database, không phụ thuộc application code. Data leak cần bypass cả RLS lẫn application layer.

3. **Storage với cùng RLS policies**: CV file upload vào Supabase Storage, access control dùng cùng auth context — không cần setup S3 riêng với IAM policies riêng cho prototype.

4. **NextAuth Supabase adapter**: tích hợp sạch với ADR-001 (Next.js App Router + NextAuth.js) — session sync giữa NextAuth và Supabase Auth qua adapter.

5. **Free tier đủ cho prototype**: 500MB database, 1GB storage, 50,000 monthly active users — đủ cho development và early testing.

6. **Supabase CLI + migrations**: local dev environment với `supabase start`, migration files track được trong git — không cần quản lý PostgreSQL server thủ công.

Tại sao không self-hosted PostgreSQL + Auth0:

- Auth0 free tier giới hạn 7,500 MAU — đủ cho prototype nhưng tạo dependency thêm 1 SaaS ngoài
- RLS vẫn phải implement thủ công trong PostgreSQL — không lợi gì về effort
- Auth0 + S3 + PostgreSQL = 3 systems riêng biệt cần configure, monitor, secure

Tại sao không tự implement OAuth flow:

- OAuth 2.0 + PKCE + token rotation + refresh token blacklist = ~2 tuần dev
- Prototype scope không justify effort này khi Supabase cho kết quả tương đương trong 1 ngày

## Consequences

**Positive:**

- Google OAuth hoạt động trong 1 ngày (Dashboard config + environment variables)
- RLS policies enforce tại DB layer — defense in depth với application-level checks
- Supabase CLI local dev — database schema version-controlled, reproducible environment
- Storage RLS consistent với DB RLS — không có gap giữa file access và data access

**Negative:**

- Vendor lock-in: migrate khỏi Supabase cần export PostgreSQL dump + rewrite auth flow (JWT claims format khác nhau) + rewrite storage URLs. Acceptable cho prototype; review lại trước khi scale đến production level.
- Supabase free tier connection limit: 60 concurrent connections — đủ cho prototype, cần Supabase Connection Pooler (PgBouncer) khi scale
- Supabase Realtime (websocket subscriptions) không dùng trong InterviewAI v1 — feature thừa, không ảnh hưởng
- Regional latency: Supabase region gần nhất cho VN là Singapore — ~20-40ms thêm so với self-hosted trong VN (không vi phạm P-02 < 300ms CRUD)
