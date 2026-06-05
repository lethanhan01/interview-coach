# DB Design — Overview & Conventions

## 1. Tech Stack

| Thành phần | Chi tiết |
| ---------- | -------- |
| Engine | PostgreSQL 15 (managed bởi Supabase) |
| Auth | Supabase Auth — Google OAuth 2.0, JWT (access: 1h, refresh: 7d) |
| RLS | Row-Level Security qua `auth.uid()` — enforce tại DB layer |
| Storage | Supabase Storage — CV PDFs, audio files (không lưu binary trong DB) |
| Realtime | Không dùng trong v1 — SSE qua Redis pub/sub (xem ADR-006) |
| pgvector | Không có column vector trong v1 — defer sang v2 (OQ-4 resolved) |

BullMQ processors dùng Supabase **service role key** — bypass RLS hoàn toàn. Đây là intentional:
processors cần ghi vào row của bất kỳ user nào sau khi job queue chạy xong.

## 2. Conventions

### Naming
- Table: `snake_case`, số nhiều (`users`, `interview_sessions`)
- Column: `snake_case`
- Index: `idx_<table>_<column(s)>`
- Constraint: `chk_<table>_<description>`, `fk_<table>_<column>`
- Policy: `"<table>: <action> <scope>"` (e.g., `"sessions: read own"`)

### Data Types
| Loại | Type dùng | Lý do |
| ---- | --------- | ----- |
| Primary key | `UUID DEFAULT gen_random_uuid()` | Supabase default, không lộ sequence |
| Timestamp | `TIMESTAMPTZ NOT NULL DEFAULT now()` | Timezone-aware |
| JSON | `JSONB` | Indexable, compact, hỗ trợ operators |
| Boolean | `BOOLEAN NOT NULL DEFAULT false` | Không để NULL boolean |
| Enum-like | `TEXT CHECK (col IN (...))` | Không dùng PostgreSQL `CREATE TYPE` — dễ migrate hơn khi thêm giá trị |
| Array | `TEXT[]` | Chỉ dùng cho flat string arrays (tags, roles) |

### Patterns
- **Soft delete**: `deleted_at TIMESTAMPTZ NULL` — áp dụng cho `users`, `user_profiles`,
  `question_bank`. Các transactional tables không soft delete.
- **FK on delete**: `ON DELETE CASCADE` cho child records (answers, feedbacks, segments).
  `ON DELETE SET NULL` cho optional lookup FK (session_questions → question_bank).
- **`updated_at`**: chỉ đặt trên tables có UPDATE operations thực sự (users, profiles, sessions,
  answers). Tables append-only (feedbacks, segments, logs) không có `updated_at`.
- **Service role writes**: tất cả INSERT từ BullMQ processors không đi qua RLS. Client-facing
  API endpoints đi qua supabase-js với user JWT — RLS áp dụng đầy đủ.

## 3. Table Inventory

**MVP v1:** 12 tables. 3 tables deferred sang v1.1: `rewrite_answers` (UC-07), `progress_snapshots` (UC-13), `placement_test_answers` (UC-11).

12 MVP tables, chia 4 nhóm theo dependency layer:

### Layer 0 — Lookup (không có FK đến table khác)
| Table | Mô tả |
| ----- | ----- |
| `context_packs` | 2 rows: `vn`, `western`. Chứa rubric JSON và scoring weights. |
| `question_bank` | Câu hỏi seed cho AntiRepeatService fallback. FK → context_packs. |

### Layer 1 — Auth & Profile
| Table | Mô tả |
| ----- | ----- |
| `users` | Extension của `auth.users` (Supabase). Lưu role, status, profile_completed. |
| `user_profiles` | Thông tin profile: target role, level, tech stack, CV. One-to-one với users. |

### Layer 2 — Session
| Table | Mô tả |
| ----- | ----- |
| `interview_sessions` | Session configuration + kết quả tổng hợp (report JSON columns). FK → users, context_packs. |
| `session_questions` | Danh sách câu hỏi trong session (LLM-generated hoặc seed). FK → interview_sessions, question_bank (nullable). |

### Layer 3 — Answer & Feedback
| Table | Mô tả |
| ----- | ----- |
| `user_answers` | Câu trả lời per turn — voice (transcript + audio URL) hoặc text. FK → session_questions. |
| `follow_up_questions` | Follow-up được FollowUpProcessor tạo ra. FK → user_answers. |
| `rewrite_answers` | **(v1.1 — UC-07)** Rewrite attempts. FK → user_answers. |
| `ai_feedbacks` | Surgical feedback output. MVP: `user_answer_id NOT NULL`. v1.1: thêm `rewrite_answer_id` nullable. |
| `annotated_segments` | Từng đoạn highlight trong transcript (good/warning/critical). FK → ai_feedbacks. |

### Layer 4 — Features & Audit
| Table | Mô tả |
| ----- | ----- |
| `reverse_questions` | Câu hỏi ngược (UC-12), max 3 per session. FK → interview_sessions. |
| `progress_snapshots` | **(v1.1 — UC-13)** Snapshot điểm competency sau mỗi session. FK → users, sessions. |
| `placement_test_answers` | **(v1.1 — UC-11)** Bài test định vị. FK → users. |
| `ai_quality_log` | Audit log các AI calls — không có FK (intentional, tránh cascade delete xóa audit trail). |

### Dependency Order cho Migration (MVP — 12 tables)

```
context_packs → question_bank
             → users → user_profiles
                     → interview_sessions → session_questions → user_answers → follow_up_questions
                                                                             → ai_feedbacks → annotated_segments
                                         → reverse_questions
ai_quality_log (độc lập)
```

Migration MVP tạo tables theo thứ tự: `context_packs` → `question_bank` → `users` →
`user_profiles` → `interview_sessions` → `session_questions` → `user_answers` →
`ai_feedbacks` → `annotated_segments` → `follow_up_questions` → `reverse_questions` →
`ai_quality_log`.

v1.1 sẽ thêm: `rewrite_answers` (trước `ai_feedbacks`), `progress_snapshots`, `placement_test_answers`,
và ALTER TABLE `ai_feedbacks` để thêm `rewrite_answer_id` nullable FK.

## 4. Prisma ORM Integration

Backend (NestJS) dùng **Prisma ORM** để tương tác với PostgreSQL. Một số điểm quan trọng:

### Connection & Auth

- Prisma dùng **service role key** trong `DATABASE_URL` → bypass Supabase RLS hoàn toàn.
- RLS policies vẫn tồn tại trong DB như safety net cho client-side SDK calls, nhưng không được Prisma enforce.
- **NestJS JWT guard (`AuthGuard`)** là primary authorization layer — mọi request đi qua guard trước khi đến Prisma.

### Cross-Schema FK (auth.users)

- `users.id` phải match `auth.users.id` (Supabase Auth schema, khác PostgreSQL schema).
- Prisma **không model FK cross-schema** — không dùng `@relation` trỏ sang `auth.users`.
- FK tồn tại dưới dạng raw SQL trigger `handle_new_auth_user()`: khi user mới được tạo trong `auth.users`, trigger INSERT vào `public.users` tự động.
- Prisma model `User` không có field `authUser` — chỉ có `id` là UUID.

### Naming Convention

- Prisma model: `PascalCase` (e.g., `User`, `InterviewSession`)
- Prisma field: `camelCase` (e.g., `userId`, `createdAt`)
- DB column: `snake_case` via `@map("snake_case")`
- DB table: `snake_case` via `@@map("table_name")`

### Partial Indexes

Prisma 5.x không thể express `WHERE` clause trong `@@index()`. 5 partial indexes phải đặt trong raw SQL migration files tách biệt (`server/prisma/migrations/raw/`).

Chi tiết model definitions: [09_prisma_schema.md](./09_prisma_schema.md).

## 5. Migration Strategy

### Source of Truth

| Loại thay đổi | Tool | File location |
| --- | --- | --- |
| Table/column/relation/index (non-partial) | `prisma migrate dev` | `server/prisma/migrations/` |
| RLS policies | Raw SQL | `server/prisma/migrations/raw/rls_*.sql` |
| Triggers (e.g., `handle_new_auth_user`) | Raw SQL | `server/prisma/migrations/raw/triggers_*.sql` |
| Partial indexes (5 total) | Raw SQL | `server/prisma/migrations/raw/indexes_*.sql` |
| Seed data (context_packs, question_bank) | Raw SQL | `server/prisma/migrations/raw/seed_*.sql` |

### Apply Order

1. `prisma migrate deploy` — tạo tất cả tables, relations, standard indexes
2. Apply raw SQL files theo thứ tự: triggers → RLS → partial indexes → seed data
3. Verify: `prisma db pull` phải không sinh thêm migration mới (schema in sync)

### Rollback

- Prisma migration: `prisma migrate resolve --rolled-back <migration_name>`
- Raw SQL: mỗi file phải có comment `-- rollback:` ở đầu với câu lệnh reverse tương ứng
