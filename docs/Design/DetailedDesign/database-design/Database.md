# Database — Current State Snapshot

> Source of truth: `server/prisma/schema.prisma` + raw SQL in `server/prisma/migrations/migration.sql`. Last reviewed: 2026-07-03.
> Design docs (01–08) phản ánh intent thiết kế ban đầu; file này phản ánh trạng thái thực tế đã được apply lên DB.

**Engine:** PostgreSQL 15 via Supabase  
**ORM:** Prisma 5 (`previewFeatures: ["partialIndexes"]`)  
**Migration tool:** `prisma db push` — không có migration SQL files (xem D2)  
**Tables in schema:** 12

---

## Deviations from Design Docs

| # | Điểm khác biệt | Design doc nói | Schema thực tế |
|---|---------------|----------------|----------------|
| D1 | `session_type` enum | `hr_behavioral \| technical \| mixed` | `hr \| technical \| mixed` |
| D2 | Migration tool | `prisma migrate dev` (tạo migration files) | `prisma db push` + `db:apply-sql` qua `db:sync:full` |
| D3 | `question_usage` table | Không có trong thiết kế gốc | Retired — từng chỉ ghi audit, chưa có repeat-avoidance runtime |
| D4 | `question_bank` fields | 9 data columns | 9 data columns — giữ runtime fields + `estimated_time_min`, `translations`, `content_json`; bỏ metadata filter chưa dùng |
| D5 | `user_profiles` fields | 13 columns | 10 columns — giữ profile phỏng vấn đang dùng; CV structured đã tách sang `resumes.parsed_json` |
| D6 | `reverse_questions` | MVP (Layer 4) | Chưa implement — không có trong schema.prisma |
| D7 | Partial indexes | Raw SQL files riêng | Prisma schema cho một số partial index; raw SQL cho `resumes(user_id) WHERE active = true` |
| D8 | `QuestionUsage` indexes | `sort: Desc` trong plan | Retired cùng `question_usage` |
| D9 | Report JSON columns | 6 JSONB columns trên `interview_sessions` | Đã tách sang `session_reports` ở T13 |

---

## Relations Overview

```
context_packs ──< question_bank ──< session_questions >── interview_sessions ──< session_reports
                                                                 │
                                                     user_answers ──── ai_feedbacks ──< annotated_segments

users ──── user_profiles
  └──< resumes
  └──< interview_sessions
  └──< saved_job_descriptions
```

Prisma relation fields (không phải DB columns):

| Từ | Đến | Cardinality | onDelete |
|----|-----|-------------|----------|
| ContextPack | QuestionBank[] | 1:n | default (Restrict) |
| ContextPack | InterviewSession[] | 1:n | default |
| QuestionBank | SessionQuestion[] | 1:n | SET NULL (FK nullable) |
| User | UserProfile? | 1:1 | Cascade |
| User | Resume[] | 1:n | Cascade |
| User | InterviewSession[] | 1:n | Cascade |
| User | SavedJobDescription[] | 1:n | Cascade |
| SavedJobDescription | InterviewSession[] | 1:n | SetNull |
| InterviewSession | SessionReport[] | 1:n | Cascade |
| InterviewSession | SessionQuestion[] | 1:n | Cascade |
| InterviewSession | UserAnswer[] | 1:n | Cascade |
| SessionQuestion | UserAnswer[] | 1:n | Cascade |
| UserAnswer | AiFeedback? | 1:1 | Cascade |
| UserAnswer | FollowUpQuestion? | 1:1 | Cascade |
| AiFeedback | AnnotatedSegment[] | 1:n | Cascade |

---

## Tables

Format: `Column — Type — Default — Nullable — Notes`

### context_packs
Prisma model: `ContextPack`

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | TEXT PK | — | NO | Enum values: `'vn'`, `'western'` |
| name | TEXT | — | NO | |
| rubric_json | JSONB | — | NO | Competency rubric per pack |
| scoring_weights | JSONB | — | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

Indexes: none.  
Seed: 2 rows (`vn`, `western`) — FK target, phải có trước mọi table khác.

---

### question_bank
Prisma model: `QuestionBank`  
Fallback questions khi AI generation fail. Soft-delete via `deleted_at`.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| content | TEXT | — | NO | Câu hỏi chính (ngôn ngữ mặc định) |
| session_type | TEXT | — | NO | `'hr' \| 'technical' \| 'mixed'` — *D1* |
| difficulty | INT | — | NO | Scale 1–5 |
| context_pack_id | TEXT FK | — | NO | → context_packs.id |
| competency_domain | TEXT | — | NO | `D1`–`D6` (HR), `TD1`–`TD5` (Technical) |
| estimated_time_min | INT | — | YES | *D4 — mới* |
| translations | JSONB | — | YES | *D4 — mới* — `{ vi?: string, en?: string }` |
| content_json | JSONB | — | YES | *D4 — mới* — seed provenance/source tracking |
| deleted_at | TIMESTAMPTZ | — | YES | Soft delete |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | Auto-update via Prisma `@updatedAt` |

Indexes (partial — `WHERE deleted_at IS NULL`):
- `idx_question_bank_context_pack` on `(context_pack_id)`
- `idx_question_bank_session_type_difficulty` on `(session_type, difficulty)`

Seed target: 120 rows (sau T4) — phân bố 6 pairs `(session_type × context_pack)` × 20.

### users
Prisma model: `User`  
Extension của Supabase `auth.users`. `id` lấy từ Supabase Auth UUID — không tự generate.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | — | NO | = auth.users.id |
| email | TEXT UNIQUE | — | NO | |
| role | TEXT | 'candidate' | NO | |
| status | TEXT | 'active' | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | Auto-update |

Indexes: none explicit (PK + UNIQUE email đủ dùng).  
Populate: trigger `handle_new_auth_user()` INSERT khi Supabase Auth tạo user mới.

---

### user_profiles
Prisma model: `UserProfile`  
One-to-one với users. Field CV structured đã tách sang `resumes.parsed_json`; các field profile dự phòng/write-only đã retired.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| user_id | UUID UNIQUE FK | — | NO | → users.id ON DELETE CASCADE |
| full_name | TEXT | — | YES | |
| target_position | TEXT | — | YES | |
| target_role_category | TEXT | — | YES | |
| target_level | TEXT | — | YES | |
| preferred_tech_stack | TEXT | — | YES | |
| personality | TEXT | — | YES | *Ngoài design docs* |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | Auto-update |

---

### resumes
Prisma model: `Resume`  
Structured CV/profile evidence tách khỏi `user_profiles`. API profile hiện vẫn giữ contract phẳng: service merge resume active vào response profile và tách các field CV khi update.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| user_id | UUID FK | — | NO | → users.id ON DELETE CASCADE |
| parsed_json | JSONB | — | YES | `education`, `workExperience`, `projects`, `technicalSkills`, `certifications`, `awards` |
| active | BOOLEAN | true | NO | Resume đang dùng |
| created_at | TIMESTAMPTZ | now() | NO | |

Indexes:
- `resumes_user_id_active_idx` on `(user_id, active)`
- `idx_resumes_one_active_per_user` partial unique on `(user_id)` WHERE `active = true`

---

### interview_sessions
Prisma model: `InterviewSession`  
Session config + lifecycle state. Report payload đã tách sang `session_reports` ở T13; `interview_sessions` chỉ giữ `overall_score` và `completed_at` cho lookup nhanh.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| user_id | UUID FK | — | NO | → users.id ON DELETE CASCADE |
| saved_job_description_id | UUID FK | — | YES | → saved_job_descriptions.id ON DELETE SET NULL; trigger đảm bảo JD cùng `user_id` |
| job_description | TEXT | — | NO | |
| job_title | TEXT | — | YES | |
| session_type | TEXT | — | NO | `'hr' \| 'technical' \| 'mixed'` |
| num_questions | INT | 5 | NO | |
| duration_min | INT | 30 | NO | |
| language | TEXT | 'vi' | NO | |
| context_pack_id | TEXT FK | — | NO | → context_packs.id |
| status | TEXT | 'generating' | NO | CHECK ∈ `{generating, active, paused, canceled, completing, completed, error}` |
| overall_score | INT | — | YES | CHECK NULL hoặc 0–100 |
| completed_at | TIMESTAMPTZ | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | Auto-update |

Indexes:
- `idx_interview_sessions_created_at` on `(created_at DESC)`
- `idx_interview_sessions_saved_jd` on `(saved_job_description_id)`
- `idx_interview_sessions_user_created` on `(user_id, created_at DESC)`
- `idx_interview_sessions_user_id` on `(user_id)`

---

### session_reports
Prisma model: `SessionReport`  
Normalized report storage. Comprehensive report processor writes one row per report part and version; report service reads these rows and assembles the API response.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| session_id | UUID FK | — | NO | → interview_sessions.id ON DELETE CASCADE |
| report_type | TEXT | — | NO | CHECK ∈ `{executive_summary, comm_analysis, competency_heatmap, action_plan, skipped_answers}` |
| version | INT | 1 | NO | |
| content_json | JSONB | — | NO | Payload của report part |
| generated_by_model | TEXT | — | YES | Reserved for model attribution |
| prompt_version | TEXT | — | YES | Reserved for prompt versioning |
| created_at | TIMESTAMPTZ | now() | NO | |

Unique: `(session_id, report_type, version)`.  
Indexes:
- `session_reports_session_id_idx` on `(session_id)`

---

### session_questions
Prisma model: `SessionQuestion`  
Câu hỏi per session. `question_bank_id` nullable — AI-generated questions không link về bank.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| session_id | UUID FK | — | NO | → interview_sessions.id ON DELETE CASCADE |
| question_bank_id | UUID FK | — | YES | → question_bank.id ON DELETE SET NULL |
| question_text | TEXT | — | NO | |
| order_index | INT | — | NO | UNIQUE per session |
| question_category | TEXT | — | NO | |
| competency_domain | TEXT | — | NO | |
| rubric_json | JSONB | — | NO | |
| estimated_time_min | INT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

Unique: `(session_id, order_index)`.  
Indexes:
- `idx_session_questions_session_id` on `(session_id)`
- `idx_session_questions_session_id_text` on `(session_id, question_text)`

---

### user_answers
Prisma model: `UserAnswer`  
Câu trả lời per turn — voice (transcript + audio URL) hoặc text. Append-only về business logic nhưng có `updated_at` (Prisma `@updatedAt`).

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| session_id | UUID FK | — | NO | → interview_sessions.id ON DELETE CASCADE |
| question_id | UUID FK | — | NO | → session_questions.id ON DELETE CASCADE; composite FK `(question_id, session_id)` đảm bảo question cùng session |
| answer_mode | TEXT | — | NO | CHECK ∈ `{voice, text}` |
| answer_text | TEXT | — | NO | Transcript hoặc direct text |
| audio_file_url | TEXT | — | YES | |
| audio_duration_seconds | INT | — | YES | |
| audio_size_bytes | INT | — | YES | |
| skipped | BOOLEAN | false | NO | |
| voice_metrics_json | JSONB | — | YES | |
| transcription_status | TEXT | — | YES | CHECK NULL hoặc ∈ `{pending, done, failed}` |
| feedback_generated | BOOLEAN | false | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | Auto-update |

Unique: `(session_id, question_id)`. DB cũng có unique `(session_questions.id, session_questions.session_id)` để hỗ trợ composite FK.  
Indexes:
- `idx_user_answers_question_id` on `(question_id)`
- `idx_user_answers_session_id` on `(session_id)`

---

### follow_up_questions
Prisma model: `FollowUpQuestion`  
Một-một với user_answers. Tạo bởi FollowUpProcessor.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| user_answer_id | UUID UNIQUE FK | — | NO | → user_answers.id ON DELETE CASCADE |
| follow_up_text | TEXT | — | NO | |
| trigger_rule | TEXT | — | NO | |
| trigger_reason | TEXT | — | YES | |
| follow_up_answer_text | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

---

### ai_feedbacks
Prisma model: `AiFeedback`  
Surgical feedback output. Một-một với user_answers.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| user_answer_id | UUID UNIQUE FK | — | NO | → user_answers.id ON DELETE CASCADE |
| overall_score | INT | — | NO | CHECK 0–100 |
| model_answer | TEXT | — | NO | |
| key_takeaway | TEXT | — | NO | |
| prompt_version | TEXT | — | NO | |
| is_fallback | BOOLEAN | false | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

Partial index: `idx_ai_feedbacks_user_answer_id` on `(user_answer_id)` WHERE `user_answer_id IS NOT NULL`.

---

### annotated_segments
Prisma model: `AnnotatedSegment`  
Từng đoạn highlight trong transcript.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| ai_feedback_id | UUID FK | — | NO | → ai_feedbacks.id ON DELETE CASCADE |
| segment_text | TEXT | — | NO | |
| start_index | INT | — | NO | Char offset trong answer_text; CHECK ≥ 0 |
| end_index | INT | — | NO | CHECK `end_index >= start_index` |
| highlight_level | TEXT | — | NO | Pipeline hiện ghi `strength` hoặc `improvement`; chưa CHECK vì text hiển thị có thể đổi |
| annotation | TEXT | — | NO | |
| suggestion | TEXT | — | YES | |
| improved_version | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

Indexes:
- `idx_annotated_segments_feedback_id` on `(ai_feedback_id)`

---

## Deferred Tables (Not in Schema)

| Table | Prisma Model | Scope | Linked UC | Status |
|-------|-------------|-------|-----------|--------|
| `reverse_questions` | — | MVP *D6* | UC-12 | Chưa implement |
| `ai_quality_log` | — | Future observability | Monitoring | Defer — recreate when AI quality analytics is needed |
| `question_usage` | — | Future repeat avoidance | Question generation | Retired — recreate with read-path selection logic if needed |
| `rewrite_answers` | — | v1.1 | UC-07 | Defer |
| `progress_snapshots` | — | v1.1 | UC-13 | Defer |
| `placement_test_answers` | — | v1.1 | UC-11 | Defer |

`reverse_questions` là table duy nhất được thiết kế là MVP nhưng chưa có trong schema. `ai_quality_log` và `question_usage` từng là bảng audit dự kiến nhưng đã được loại khỏi schema hiện tại vì chưa có code runtime đọc tạo behavior người dùng.

---

## Constraints & Patterns Summary

| Pattern | Tables |
|---------|--------|
| Soft delete (`deleted_at`) | `question_bank`, `saved_job_descriptions` |
| Cascade delete | Tất cả child tables theo chuỗi answer → feedback → segments |
| `updated_at` (auto via `@updatedAt`) | `users`, `user_profiles`, `interview_sessions`, `question_bank`, `user_answers` |
| Partial indexes (`WHERE deleted_at IS NULL`) | `question_bank` (2 indexes) |
| Partial indexes | `ai_feedbacks(user_answer_id) WHERE user_answer_id IS NOT NULL`; `resumes(user_id) WHERE active = true` UNIQUE |
| Cross-row integrity outside Prisma schema | `user_answers(question_id, session_id)` composite FK; `interview_sessions.saved_job_description_id` same-user trigger |
| CHECK constraints (raw SQL, `migration.sql` §7) | role/status/type/range/score/audio/report/offset constraints — apply thủ công sau `db push` (ADR-008) |
