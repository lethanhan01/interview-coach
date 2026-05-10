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

15 tables, chia 4 nhóm theo dependency layer:

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
| `rewrite_answers` | Rewrite attempts (max 5 per answer, NFR P-21). FK → user_answers. |
| `ai_feedbacks` | Surgical feedback output. FK nullable: hoặc user_answer_id hoặc rewrite_answer_id. |
| `annotated_segments` | Từng đoạn highlight trong transcript (good/warning/critical). FK → ai_feedbacks. |

### Layer 4 — Features & Audit
| Table | Mô tả |
| ----- | ----- |
| `reverse_questions` | Câu hỏi ngược (UC-12), max 3 per session. FK → interview_sessions. |
| `progress_snapshots` | Snapshot điểm competency sau mỗi session (UC-13 dashboard). FK → users, sessions. |
| `placement_test_answers` | Bài test định vị (UC-11). FK → users. |
| `ai_quality_log` | Audit log các AI calls — không có FK (intentional, tránh cascade delete xóa audit trail). |

### Dependency Order cho Migration

```
context_packs → question_bank
             → users → user_profiles
                     → interview_sessions → session_questions → user_answers → follow_up_questions
                                                                             → rewrite_answers → ai_feedbacks → annotated_segments
                                                                             → ai_feedbacks
                                         → reverse_questions
                                         → progress_snapshots
             → placement_test_answers
ai_quality_log (độc lập)
```

Migration phải tạo tables theo thứ tự: `context_packs` → `question_bank` → `users` →
`user_profiles` → `interview_sessions` → `session_questions` → `user_answers` →
`rewrite_answers` → `ai_feedbacks` → `annotated_segments` → `follow_up_questions` →
`reverse_questions` → `progress_snapshots` → `placement_test_answers` → `ai_quality_log`.

`rewrite_answers` phải đứng trước `ai_feedbacks` vì `ai_feedbacks` có FK tới cả
`user_answers` và `rewrite_answers`.
