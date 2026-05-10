# DB Design — Indexes, RLS Policies & Check Constraints

## 1. Indexes

Tất cả indexes đặt sau DDL tables trong migration. Naming convention: `idx_<table>_<columns>`.

### 1.1 Session lookup

```sql
-- List sessions per user (UC-08 history, GET /sessions)
CREATE INDEX idx_interview_sessions_user_id
  ON interview_sessions(user_id);

-- Sort by newest (default order trong GET /sessions)
CREATE INDEX idx_interview_sessions_created_at
  ON interview_sessions(created_at DESC);

-- S-12: đếm sessions trong 24h per user — composite tránh index scan đôi
CREATE INDEX idx_interview_sessions_user_created
  ON interview_sessions(user_id, created_at DESC);
```

### 1.2 Turn data

```sql
-- Lấy questions của một session (GET /sessions/:id)
CREATE INDEX idx_session_questions_session_id
  ON session_questions(session_id);

-- Lấy answers của một session (ComprehensiveReportProcessor đọc toàn bộ session)
CREATE INDEX idx_user_answers_session_id
  ON user_answers(session_id);

-- Lấy answer theo question (FeedbackProcessor, GET /turns/:turnId)
CREATE INDEX idx_user_answers_question_id
  ON user_answers(question_id);
```

### 1.3 Feedback

```sql
-- Partial index: chỉ index rows có original answer feedback
CREATE INDEX idx_ai_feedbacks_user_answer_id
  ON ai_feedbacks(user_answer_id)
  WHERE user_answer_id IS NOT NULL;

-- Partial index: chỉ index rows có rewrite feedback
CREATE INDEX idx_ai_feedbacks_rewrite_answer_id
  ON ai_feedbacks(rewrite_answer_id)
  WHERE rewrite_answer_id IS NOT NULL;

-- Lấy segments của một feedback (GET /feedback, Surgical Review render)
CREATE INDEX idx_annotated_segments_feedback_id
  ON annotated_segments(ai_feedback_id);
```

Partial index trên `ai_feedbacks` tránh index bloat từ NULL values — mỗi row chỉ vào đúng
một trong hai indexes.

### 1.4 Rewrite

```sql
-- Lấy tất cả rewrite attempts của một answer (GET /rewrites)
CREATE INDEX idx_rewrite_answers_user_answer_id
  ON rewrite_answers(user_answer_id);
```

### 1.5 Progress dashboard

```sql
-- UC-13: trend chart, streak calculation
CREATE INDEX idx_progress_snapshots_user_id
  ON progress_snapshots(user_id);

CREATE INDEX idx_progress_snapshots_user_created
  ON progress_snapshots(user_id, created_at DESC);
```

### 1.6 AntiRepeat & Question bank

```sql
-- AntiRepeat: JOIN session_questions với interview_sessions WHERE user_id = ?
-- Index trên session_id đủ — interview_sessions đã có idx_interview_sessions_user_id
CREATE INDEX idx_session_questions_session_id_text
  ON session_questions(session_id, question_text);

-- Seed fallback filter: QuestionGenerationProcessor SELECT WHERE session_type AND difficulty
CREATE INDEX idx_question_bank_session_type_difficulty
  ON question_bank(session_type, difficulty)
  WHERE deleted_at IS NULL;

-- Filter thêm theo context pack
CREATE INDEX idx_question_bank_context_pack
  ON question_bank(context_pack_id)
  WHERE deleted_at IS NULL;
```

### 1.7 Audit log

```sql
-- Admin dashboard: filter by job_type và time range
CREATE INDEX idx_ai_quality_log_created_at
  ON ai_quality_log(created_at DESC);

CREATE INDEX idx_ai_quality_log_job_type_created
  ON ai_quality_log(job_type, created_at DESC);
```

### Tóm tắt indexes

| Index | Table | Columns | Lý do |
| ----- | ----- | ------- | ----- |
| idx_interview_sessions_user_id | interview_sessions | user_id | UC-08 history list |
| idx_interview_sessions_created_at | interview_sessions | created_at DESC | Default sort |
| idx_interview_sessions_user_created | interview_sessions | (user_id, created_at DESC) | S-12 24h count |
| idx_session_questions_session_id | session_questions | session_id | Load session plan |
| idx_user_answers_session_id | user_answers | session_id | Report processor |
| idx_user_answers_question_id | user_answers | question_id | Per-turn lookup |
| idx_ai_feedbacks_user_answer_id | ai_feedbacks | user_answer_id (partial) | Original feedback |
| idx_ai_feedbacks_rewrite_answer_id | ai_feedbacks | rewrite_answer_id (partial) | Rewrite feedback |
| idx_annotated_segments_feedback_id | annotated_segments | ai_feedback_id | Surgical review render |
| idx_rewrite_answers_user_answer_id | rewrite_answers | user_answer_id | Rewrite history |
| idx_progress_snapshots_user_id | progress_snapshots | user_id | Dashboard |
| idx_progress_snapshots_user_created | progress_snapshots | (user_id, created_at DESC) | Trend chart |
| idx_session_questions_session_id_text | session_questions | (session_id, question_text) | AntiRepeat check |
| idx_question_bank_session_type_difficulty | question_bank | (session_type, difficulty) | Seed fallback filter |
| idx_question_bank_context_pack | question_bank | context_pack_id | Pack filter |
| idx_ai_quality_log_created_at | ai_quality_log | created_at DESC | Admin monitoring |
| idx_ai_quality_log_job_type_created | ai_quality_log | (job_type, created_at DESC) | Per-job SLO |

---

## 2. Row-Level Security (RLS) Policies

Supabase enforce RLS tại DB layer qua `auth.uid()`. Pattern áp dụng:
- **Candidate policies**: user chỉ đọc/ghi data của mình (`user_id = auth.uid()` hoặc sub-select)
- **Admin policies**: kiểm tra `role = 'admin'` qua sub-select từ `users`
- **Service role**: BullMQ processors dùng Supabase service role key — bypass RLS hoàn toàn

### 2.1 Lookup tables

```sql
-- context_packs: public read-only, không enable RLS
-- question_bank: candidate chỉ read (AntiRepeat), admin CRUD
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "question_bank: read all"
  ON question_bank FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "question_bank: admin insert"
  ON question_bank FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "question_bank: admin update"
  ON question_bank FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "question_bank: admin delete"
  ON question_bank FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

### 2.2 Auth tables

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: read own"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users: update own"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "users: admin read all"
  ON users FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "users: admin update status"
  ON users FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles: read own"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_profiles: insert own"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles: update own"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid());
```

### 2.3 Session tables

```sql
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interview_sessions: read own"
  ON interview_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "interview_sessions: insert own"
  ON interview_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "interview_sessions: update own"
  ON interview_sessions FOR UPDATE
  USING (user_id = auth.uid());

ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_questions: read own"
  ON session_questions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );
```

`session_questions` không có INSERT/UPDATE policy cho candidate — chỉ `QuestionGenerationProcessor`
(service role) ghi vào bảng này.

### 2.4 Answer & feedback tables

Pattern dùng sub-select qua `interview_sessions.user_id`. Áp dụng cho tất cả tables trong nhóm:

```sql
-- Macro pattern (lặp lại cho từng table):
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<table>: read own"
  ON <table> FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );
```

Tables áp dụng pattern này (SELECT only cho candidate — service role handles INSERT/UPDATE):

| Table | FK column dùng để trace | Candidate INSERT? |
| ----- | ----------------------- | ----------------- |
| `user_answers` | `session_id` | Có — via API endpoint |
| `follow_up_questions` | qua `user_answer_id` | Có — via API endpoint |
| `ai_feedbacks` | qua `user_answer_id` | Không — service role only |
| `annotated_segments` | qua `ai_feedback_id` | Không — service role only |
| `rewrite_answers` | qua `user_answer_id` | Có — via API endpoint |
| `reverse_questions` | `session_id` | Có — via API endpoint |
| `progress_snapshots` | `user_id` | Không — service role only |

`user_answers`, `follow_up_questions`, `rewrite_answers`, `reverse_questions` cần thêm INSERT policy:

```sql
CREATE POLICY "user_answers: insert own"
  ON user_answers FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );
```

### 2.5 Feature tables

```sql
ALTER TABLE placement_test_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "placement_test_answers: read own"
  ON placement_test_answers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "placement_test_answers: insert own"
  ON placement_test_answers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ai_quality_log: admin read only, no candidate access
ALTER TABLE ai_quality_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_quality_log: admin read"
  ON ai_quality_log FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

---

## 3. Check Constraints Summary

Danh sách tất cả CHECK constraints và NFR chúng enforce:

| Table | Constraint | Điều kiện | NFR/UC |
| ----- | ---------- | --------- | ------ |
| `context_packs` | inline | `id IN ('vn', 'western')` | — |
| `question_bank` | inline | `difficulty BETWEEN 1 AND 5` | — |
| `question_bank` | inline | `session_type IN (...)` | — |
| `interview_sessions` | inline | `char_length(job_description) BETWEEN 100 AND 5000` | AS-04, P-18 |
| `interview_sessions` | inline | `num_questions IN (3, 5, 7)` | P-20 |
| `interview_sessions` | inline | `status IN (...)` | — |
| `interview_sessions` | inline | `overall_score BETWEEN 0 AND 100` | — |
| `interview_sessions` | `chk_interview_sessions_jd_url` | `jd_source != 'url' OR jd_url IS NOT NULL` | UC-03 |
| `session_questions` | inline | `order_index >= 0` | — |
| `user_answers` | inline | `audio_duration_seconds BETWEEN 1 AND 300` | P-17 |
| `user_answers` | `chk_user_answers_voice_fields` | `answer_mode != 'voice' OR audio_file_url IS NOT NULL` | — |
| `rewrite_answers` | inline | `attempt_number BETWEEN 1 AND 5` | P-21 |
| `rewrite_answers` | `chk_rewrite_answers_voice_fields` | `rewrite_mode != 'voice' OR rewrite_audio_url IS NOT NULL` | — |
| `ai_feedbacks` | inline | `overall_score BETWEEN 0 AND 100` | — |
| `ai_feedbacks` | `chk_ai_feedbacks_source` | exactly one FK non-null | Design decision |
| `annotated_segments` | `chk_annotated_segments_end_index` | `end_index > start_index` | — |
| `annotated_segments` | `chk_annotated_segments_improved_version` | `highlight_level = 'good' OR improved_version IS NOT NULL` | SRS UC-06 |
| `reverse_questions` | inline | `char_length(question_text) <= 500` | UC-12 |
| `reverse_questions` | inline | `order_index BETWEEN 1 AND 3` | UC-12 max 3 |
| `progress_snapshots` | inline | `overall_score BETWEEN 0 AND 100` | — |
| `placement_test_answers` | inline | `question_number BETWEEN 1 AND 10` | UC-11 |
| `ai_quality_log` | inline | `latency_ms >= 0` | — |
| `ai_quality_log` | inline | `model IN ('gpt-4o', 'whisper-1')` | ADR-004 |

Constraints **không** ở DB layer (enforce tại API layer):
- S-12: max 10 sessions/24h per user — query + app logic
- P-16: audio max 25MB — validate tại upload endpoint
- CV max 5MB (P-19) — validate tại upload endpoint
- Skip chỉ từ Q2 trở đi — UC-04 business rule tại API layer
