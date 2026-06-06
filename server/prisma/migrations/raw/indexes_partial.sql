-- Indexes for InterviewCoach MVP
-- Applied manually via Supabase Dashboard SQL editor or migration tool.
-- Partial indexes MUST be raw SQL — Prisma @@index does not support WHERE clauses.
-- Source: docs/Design/DetailedDesign/database-design/07_constraints.md

-- ─── Session lookup ───────────────────────────────────────────────────────────

CREATE INDEX idx_interview_sessions_user_id
  ON interview_sessions(user_id);

CREATE INDEX idx_interview_sessions_created_at
  ON interview_sessions(created_at DESC);

-- Composite: S-12 24h session count per user
CREATE INDEX idx_interview_sessions_user_created
  ON interview_sessions(user_id, created_at DESC);

-- ─── Turn data ────────────────────────────────────────────────────────────────

CREATE INDEX idx_session_questions_session_id
  ON session_questions(session_id);

CREATE INDEX idx_user_answers_session_id
  ON user_answers(session_id);

CREATE INDEX idx_user_answers_question_id
  ON user_answers(question_id);

-- ─── Feedback ─────────────────────────────────────────────────────────────────

-- Partial index: only original-answer feedbacks (v1.1 adds rewrite variant)
CREATE INDEX idx_ai_feedbacks_user_answer_id
  ON ai_feedbacks(user_answer_id)
  WHERE user_answer_id IS NOT NULL;

CREATE INDEX idx_annotated_segments_feedback_id
  ON annotated_segments(ai_feedback_id);

-- ─── AntiRepeat & Question bank ───────────────────────────────────────────────

-- Composite for AntiRepeat join
CREATE INDEX idx_session_questions_session_id_text
  ON session_questions(session_id, question_text);

-- Seed fallback filter (partial: active rows only)
CREATE INDEX idx_question_bank_session_type_difficulty
  ON question_bank(session_type, difficulty)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_question_bank_context_pack
  ON question_bank(context_pack_id)
  WHERE deleted_at IS NULL;

-- ─── Audit log ────────────────────────────────────────────────────────────────

CREATE INDEX idx_ai_quality_log_created_at
  ON ai_quality_log(created_at DESC);

CREATE INDEX idx_ai_quality_log_job_type_created
  ON ai_quality_log(job_type, created_at DESC);
