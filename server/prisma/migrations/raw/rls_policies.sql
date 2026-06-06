-- RLS Policies for InterviewCoach MVP
-- Applied manually via Supabase Dashboard SQL editor or migration tool.
-- Source: docs/Design/DetailedDesign/database-design/07_constraints.md
--
-- context_packs: no RLS — public read-only
-- ai_quality_log: admin read only

-- ─── question_bank ────────────────────────────────────────────────────────────

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
  ON question_bank FOR DELETE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- ─── users ────────────────────────────────────────────────────────────────────

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

-- ─── user_profiles ────────────────────────────────────────────────────────────

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

-- ─── interview_sessions ───────────────────────────────────────────────────────

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

-- ─── session_questions ────────────────────────────────────────────────────────
-- Candidate read-only; INSERT/UPDATE by service role only.

ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_questions: read own"
  ON session_questions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

-- ─── user_answers ─────────────────────────────────────────────────────────────

ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_answers: read own"
  ON user_answers FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "user_answers: insert own"
  ON user_answers FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

-- ─── follow_up_questions ──────────────────────────────────────────────────────

ALTER TABLE follow_up_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follow_up_questions: read own"
  ON follow_up_questions FOR SELECT
  USING (
    user_answer_id IN (
      SELECT ua.id FROM user_answers ua
      JOIN interview_sessions s ON ua.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "follow_up_questions: insert own"
  ON follow_up_questions FOR INSERT
  WITH CHECK (
    user_answer_id IN (
      SELECT ua.id FROM user_answers ua
      JOIN interview_sessions s ON ua.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- ─── ai_feedbacks ─────────────────────────────────────────────────────────────
-- Candidate read only; INSERT by service role only.

ALTER TABLE ai_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_feedbacks: read own"
  ON ai_feedbacks FOR SELECT
  USING (
    user_answer_id IN (
      SELECT ua.id FROM user_answers ua
      JOIN interview_sessions s ON ua.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- ─── annotated_segments ───────────────────────────────────────────────────────
-- Candidate read only; INSERT by service role only.

ALTER TABLE annotated_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "annotated_segments: read own"
  ON annotated_segments FOR SELECT
  USING (
    ai_feedback_id IN (
      SELECT f.id FROM ai_feedbacks f
      JOIN user_answers ua ON f.user_answer_id = ua.id
      JOIN interview_sessions s ON ua.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- ─── reverse_questions ────────────────────────────────────────────────────────

ALTER TABLE reverse_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reverse_questions: read own"
  ON reverse_questions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "reverse_questions: insert own"
  ON reverse_questions FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

-- ─── ai_quality_log ───────────────────────────────────────────────────────────
-- Admin read only; no candidate access.

ALTER TABLE ai_quality_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_quality_log: admin read"
  ON ai_quality_log FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
