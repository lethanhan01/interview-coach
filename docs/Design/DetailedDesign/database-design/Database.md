# Database — Current State Snapshot

> Source of truth: `server/prisma/schema.prisma`. Last sync: 2026-06-27.
> Design docs (01–08) phản ánh intent thiết kế ban đầu; file này phản ánh trạng thái thực tế đã được apply lên DB.

**Engine:** PostgreSQL 15 via Supabase  
**ORM:** Prisma 5 (`previewFeatures: ["partialIndexes"]`)  
**Migration tool:** `prisma db push` — không có migration SQL files (xem D2)  
**Tables in schema:** 15

---

## Deviations from Design Docs

| # | Điểm khác biệt | Design doc nói | Schema thực tế |
|---|---------------|----------------|----------------|
| D1 | `session_type` enum | `hr_behavioral \| technical \| mixed` | `hr \| technical \| mixed` |
| D2 | Migration tool | `prisma migrate dev` (tạo migration files) | `prisma db push` (không có SQL migration files) |
| D3 | `question_usage` table | Không có trong thiết kế gốc | Đã tạo (T2/T3) — usage tracking cho question_bank |
| D4 | `question_bank` fields | 9 data columns | 13 data columns — thêm: `tags`, `estimated_time_min`, `translations`, `content_json` |
| D5 | `user_profiles` fields | 13 columns | 14 columns — giữ profile phỏng vấn; 5 PII fields đã bỏ ở T10, 6 CV fields đã tách sang `resumes` ở T12 |
| D6 | `reverse_questions` | MVP (Layer 4) | Chưa implement — không có trong schema.prisma |
| D7 | Partial indexes | Raw SQL files riêng | Inline trong schema.prisma qua `where: raw(...)` (Prisma 5 GA) |
| D8 | `QuestionUsage` indexes | `sort: Desc` trong plan | Đã bỏ `sort: Desc` — Prisma IDE extension báo lỗi |
| D9 | Report JSON columns | 6 JSONB columns trên `interview_sessions` | Đã tách sang `session_reports` ở T13 |

---

## Relations Overview

```
context_packs ──< question_bank ──< session_questions >── interview_sessions ──< session_reports
                        │                                        │
                        └──< question_usage             user_answers ──── ai_feedbacks ──< annotated_segments
                                                              │
                                                    follow_up_questions

users ──── user_profiles
  └──< resumes
  └──< interview_sessions
  └──< saved_job_descriptions

ai_quality_log  (không có FK — độc lập)
```

Prisma relation fields (không phải DB columns):

| Từ | Đến | Cardinality | onDelete |
|----|-----|-------------|----------|
| ContextPack | QuestionBank[] | 1:n | default (Restrict) |
| ContextPack | InterviewSession[] | 1:n | default |
| QuestionBank | SessionQuestion[] | 1:n | SET NULL (FK nullable) |
| QuestionBank | QuestionUsage[] | 1:n | Cascade |
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
| subcategory | TEXT | — | NO | Ví dụ: `teamwork`, `data_structures` |
| competency_domain | TEXT | — | NO | `D1`–`D6` (HR), `TD1`–`TD5` (Technical) |
| applicable_roles | TEXT[] | '{}' | NO | |
| applicable_levels | TEXT[] | '{}' | NO | |
| tags | TEXT[] | '{}' | NO | *D4 — mới* |
| estimated_time_min | INT | — | YES | *D4 — mới* |
| translations | JSONB | — | YES | *D4 — mới* — `{ vi?: string, en?: string }` |
| content_json | JSONB | — | YES | *D4 — mới* — structured version |
| deleted_at | TIMESTAMPTZ | — | YES | Soft delete |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | Auto-update via Prisma `@updatedAt` |

Indexes (partial — `WHERE deleted_at IS NULL`):
- `idx_question_bank_context_pack` on `(context_pack_id)`
- `idx_question_bank_session_type_difficulty` on `(session_type, difficulty)`

Seed target: 120 rows (sau T4) — phân bố 6 pairs `(session_type × context_pack)` × 20.

---

### question_usage
Prisma model: `QuestionUsage`  
*D3 — không có trong design docs gốc.* Mỗi row = một lần question_bank row được chọn dùng trong session.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| question_bank_id | UUID FK | — | NO | → question_bank.id ON DELETE CASCADE |
| session_id | UUID | — | YES | Soft ref — không có FK constraint |
| user_id | UUID | — | NO | Không có FK constraint (intentional) |
| used_at | TIMESTAMPTZ | now() | NO | |

Indexes (sort: Desc bị bỏ — *D8*):
- `idx_question_usage_bank_used` on `(question_bank_id, used_at)`
- `idx_question_usage_user_used` on `(user_id, used_at)`

---

### users
Prisma model: `User`  
Extension của Supabase `auth.users`. `id` lấy từ Supabase Auth UUID — không tự generate.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | — | NO | = auth.users.id |
| email | TEXT UNIQUE | — | NO | |
| role | TEXT | 'candidate' | NO | |
| status | TEXT | 'active' | NO | |
| profile_completed | BOOLEAN | false | NO | |
| last_login_at | TIMESTAMPTZ | — | YES | |
| deleted_at | TIMESTAMPTZ | — | YES | Soft delete |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | Auto-update |

Indexes: none explicit (PK + UNIQUE email đủ dùng).  
Populate: trigger `handle_new_auth_user()` INSERT khi Supabase Auth tạo user mới.

---

### user_profiles
Prisma model: `UserProfile`  
One-to-one với users. *D5: 14 columns. 5 field PII thuần (date_of_birth, gender, phone, hometown, nationality) đã bỏ ở T10 (SR-03). 6 field CV structured đã tách sang `resumes.parsed_json` ở T12 (SR-02).*

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| user_id | UUID UNIQUE FK | — | NO | → users.id ON DELETE CASCADE |
| full_name | TEXT | — | YES | |
| target_position | TEXT | — | YES | |
| target_role_category | TEXT | — | YES | |
| target_level | TEXT | — | YES | |
| preferred_tech_stack | TEXT | — | YES | |
| years_experience | INT | 0 | NO | |
| default_language | TEXT | 'vi' | NO | |
| tts_enabled | BOOLEAN | false | NO | |
| personality | TEXT | — | YES | *Ngoài design docs* |
| deleted_at | TIMESTAMPTZ | — | YES | Soft delete |
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
| file_url | TEXT | — | YES | Reserved cho T12b upload |
| original_filename | TEXT | — | YES | Reserved cho T12b upload |
| parsed_text | TEXT | — | YES | Reserved cho parser |
| parsed_json | JSONB | — | YES | `education`, `workExperience`, `projects`, `technicalSkills`, `certifications`, `awards` |
| language | TEXT | 'vi' | NO | |
| parser_version | TEXT | — | YES | `manual` cho profile form hiện tại |
| active | BOOLEAN | true | NO | Resume đang dùng |
| created_at | TIMESTAMPTZ | now() | NO | |

Indexes:
- `resumes_user_id_active_idx` on `(user_id, active)`

---

### interview_sessions
Prisma model: `InterviewSession`  
Session config + lifecycle state. Report payload đã tách sang `session_reports` ở T13; `interview_sessions` chỉ giữ `overall_score` và `completed_at` cho lookup nhanh.

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| user_id | UUID FK | — | NO | → users.id ON DELETE CASCADE |
| saved_job_description_id | UUID FK | — | YES | → saved_job_descriptions.id ON DELETE SET NULL |
| job_description | TEXT | — | NO | |
| jd_source | TEXT | — | NO | |
| jd_url | TEXT | — | YES | |
| job_title | TEXT | — | YES | |
| session_type | TEXT | — | NO | `'hr' \| 'technical' \| 'mixed'` |
| num_questions | INT | 5 | NO | |
| difficulty | TEXT | 'medium' | NO | |
| persona | TEXT | 'neutral_tech_lead' | NO | |
| mode | TEXT | 'practice' | NO | |
| duration_min | INT | 30 | NO | |
| language | TEXT | 'vi' | NO | |
| context_pack_id | TEXT FK | — | NO | → context_packs.id |
| show_prep_card | BOOLEAN | false | NO | |
| status | TEXT | 'generating' | NO | |
| opening_transcript | TEXT | — | YES | |
| overall_score | INT | — | YES | |
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
| report_type | TEXT | — | NO | `executive_summary`, `comm_analysis`, `competency_heatmap`, `action_plan` |
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
| question_id | UUID FK | — | NO | → session_questions.id ON DELETE CASCADE |
| answer_mode | TEXT | — | NO | `'voice' \| 'text'` |
| answer_text | TEXT | — | NO | Transcript hoặc direct text |
| audio_file_url | TEXT | — | YES | |
| audio_duration_seconds | INT | — | YES | |
| audio_size_bytes | INT | — | YES | |
| skipped | BOOLEAN | false | NO | |
| voice_metrics_json | JSONB | — | YES | |
| transcription_status | TEXT | — | YES | Trạng thái STT (mới thêm) |
| feedback_generated | BOOLEAN | false | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | Auto-update |

Unique: `(session_id, question_id)`.  
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
| overall_score | INT | — | NO | |
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
| start_index | INT | — | NO | Char offset trong answer_text |
| end_index | INT | — | NO | |
| highlight_level | TEXT | — | NO | `'good' \| 'warning' \| 'critical'` |
| annotation | TEXT | — | NO | |
| suggestion | TEXT | — | YES | |
| improved_version | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

Indexes:
- `idx_annotated_segments_feedback_id` on `(ai_feedback_id)`

---

### ai_quality_log
Prisma model: `AiQualityLog`  
Audit log cho mọi AI API call từ BullMQ processors. Không có FK — intentional (audit trail không bị cascade delete).

| Column | DB Type | Default | Nullable | Notes |
|--------|---------|---------|----------|-------|
| id | UUID PK | gen_random_uuid() | NO | |
| session_id | UUID | — | YES | Soft ref — không có FK constraint |
| job_type | TEXT | — | NO | |
| prompt_version | TEXT | — | NO | |
| model | TEXT | — | NO | |
| input_tokens | INT | — | YES | NULL nếu call failed |
| output_tokens | INT | — | YES | NULL nếu call failed |
| latency_ms | INT | — | NO | |
| is_fallback | BOOLEAN | false | NO | |
| error_code | TEXT | — | YES | |
| created_at | TIMESTAMPTZ | now() | NO | |

Indexes (có `sort: Desc` — pre-existing, khác với QuestionUsage *D8*):
- `idx_ai_quality_log_created_at` on `(created_at DESC)`
- `idx_ai_quality_log_job_type_created` on `(job_type, created_at DESC)`

---

## Deferred Tables (Not in Schema)

| Table | Prisma Model | Scope | Linked UC | Status |
|-------|-------------|-------|-----------|--------|
| `reverse_questions` | — | MVP *D6* | UC-12 | Chưa implement |
| `rewrite_answers` | — | v1.1 | UC-07 | Defer |
| `progress_snapshots` | — | v1.1 | UC-13 | Defer |
| `placement_test_answers` | — | v1.1 | UC-11 | Defer |

`reverse_questions` là table duy nhất được thiết kế là MVP nhưng chưa có trong schema.

---

## Constraints & Patterns Summary

| Pattern | Tables |
|---------|--------|
| Soft delete (`deleted_at`) | `users`, `user_profiles`, `question_bank` |
| Cascade delete | Tất cả child tables theo chuỗi answer → feedback → segments |
| No FK (intentional) | `ai_quality_log.session_id`, `question_usage.user_id`, `question_usage.session_id` |
| `updated_at` (auto via `@updatedAt`) | `users`, `user_profiles`, `interview_sessions`, `question_bank`, `user_answers` |
| Partial indexes (`WHERE deleted_at IS NULL`) | `question_bank` (2 indexes) |
| Partial index (`WHERE col IS NOT NULL`) | `ai_feedbacks` (1 index) |
| CHECK constraints (raw SQL, `migration.sql` §7) | `interview_sessions.session_type` ∈ `{hr,technical,mixed}`; `users.role` ∈ `{candidate,admin}` — Prisma không express CHECK, apply thủ công sau `db push` (ADR-008) |
| Enforce ở application layer (không CHECK) | `users.status`, `interview_sessions.status` — tập giá trị biến động/đơn trị, validate qua DTO + `ValidationPipe` |
