-- =============================================================================
-- InterviewCoach — Consolidated migration
-- Apply once against a Supabase project that already has the base schema
-- created via `prisma db push`. Execute as a superuser or service role.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Auth sync trigger
--    Sync Supabase auth.users → public.users on INSERT
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();


-- -----------------------------------------------------------------------------
-- 2. RLS policies
-- -----------------------------------------------------------------------------

-- question_bank
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

-- users
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

-- user_profiles
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

-- interview_sessions
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

-- session_questions (candidate read-only; INSERT/UPDATE by service role only)
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_questions: read own"
  ON session_questions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

-- user_answers
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

-- follow_up_questions
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

-- ai_feedbacks (candidate read only; INSERT by service role only)
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

-- annotated_segments (candidate read only; INSERT by service role only)
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

-- reverse_questions
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

-- ai_quality_log (admin read only; no candidate access)
ALTER TABLE ai_quality_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_quality_log: admin read"
  ON ai_quality_log FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- -----------------------------------------------------------------------------
-- 3. Indexes
--    Partial indexes use raw SQL — Prisma @@index does not support WHERE clauses.
-- -----------------------------------------------------------------------------

-- Session lookup
CREATE INDEX idx_interview_sessions_user_id
  ON interview_sessions(user_id);

CREATE INDEX idx_interview_sessions_created_at
  ON interview_sessions(created_at DESC);

CREATE INDEX idx_interview_sessions_user_created
  ON interview_sessions(user_id, created_at DESC);

-- Turn data
CREATE INDEX idx_session_questions_session_id
  ON session_questions(session_id);

CREATE INDEX idx_user_answers_session_id
  ON user_answers(session_id);

CREATE INDEX idx_user_answers_question_id
  ON user_answers(question_id);

-- Feedback
CREATE INDEX idx_ai_feedbacks_user_answer_id
  ON ai_feedbacks(user_answer_id)
  WHERE user_answer_id IS NOT NULL;

CREATE INDEX idx_annotated_segments_feedback_id
  ON annotated_segments(ai_feedback_id);

-- AntiRepeat & Question bank
CREATE INDEX idx_session_questions_session_id_text
  ON session_questions(session_id, question_text);

CREATE INDEX idx_question_bank_session_type_difficulty
  ON question_bank(session_type, difficulty)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_question_bank_context_pack
  ON question_bank(context_pack_id)
  WHERE deleted_at IS NULL;

-- Audit log
CREATE INDEX idx_ai_quality_log_created_at
  ON ai_quality_log(created_at DESC);

CREATE INDEX idx_ai_quality_log_job_type_created
  ON ai_quality_log(job_type, created_at DESC);


-- -----------------------------------------------------------------------------
-- 4. Seed: context_packs
-- -----------------------------------------------------------------------------

BEGIN;

INSERT INTO context_packs (id, name, rubric_json, scoring_weights) VALUES
(
  'VN',
  'Vietnam Context Pack',
  '{
    "behavioral": {
      "D1": { "name": "Giao tiếp & Trình bày",       "weight": 0.20 },
      "D2": { "name": "Tư duy & Giải quyết vấn đề",  "weight": 0.20 },
      "D3": { "name": "Làm việc nhóm",                "weight": 0.15 },
      "D4": { "name": "Thái độ & Động lực",           "weight": 0.20 },
      "D5": { "name": "Phù hợp văn hóa",              "weight": 0.15 },
      "D6": { "name": "Tự nhận thức",                 "weight": 0.10 }
    },
    "technical": {
      "TD1": { "name": "Kiến thức nền tảng",          "weight": 0.25 },
      "TD2": { "name": "Khả năng áp dụng thực tế",   "weight": 0.25 },
      "TD3": { "name": "Tư duy hệ thống",             "weight": 0.20 },
      "TD4": { "name": "Code quality & Best practices","weight": 0.20 },
      "TD5": { "name": "Debug & Problem-solving",     "weight": 0.10 }
    }
  }',
  '{
    "behavioral_weight": 0.50,
    "technical_weight":  0.50
  }'
),
(
  'Western',
  'Western Context Pack',
  '{
    "behavioral": {
      "D1": { "name": "Communication & Presentation",  "weight": 0.20 },
      "D2": { "name": "Critical Thinking",             "weight": 0.20 },
      "D3": { "name": "Collaboration & Teamwork",      "weight": 0.15 },
      "D4": { "name": "Leadership & Initiative",       "weight": 0.20 },
      "D5": { "name": "Culture Fit & Values",          "weight": 0.15 },
      "D6": { "name": "Self-Awareness & Growth",       "weight": 0.10 }
    },
    "technical": {
      "TD1": { "name": "Foundational Knowledge",       "weight": 0.20 },
      "TD2": { "name": "Practical Application",        "weight": 0.25 },
      "TD3": { "name": "Systems Thinking",             "weight": 0.20 },
      "TD4": { "name": "Code Quality & Best Practices","weight": 0.20 },
      "TD5": { "name": "Debug & Problem-solving",      "weight": 0.15 }
    }
  }',
  '{
    "behavioral_weight": 0.45,
    "technical_weight":  0.55
  }'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  rubric_json = EXCLUDED.rubric_json,
  scoring_weights = EXCLUDED.scoring_weights;

-- Normalize IDs created before standardization
UPDATE interview_sessions SET context_pack_id = 'VN'      WHERE context_pack_id = 'vn';
UPDATE interview_sessions SET context_pack_id = 'Western' WHERE context_pack_id = 'western';
UPDATE question_bank      SET context_pack_id = 'VN'      WHERE context_pack_id = 'vn';
UPDATE question_bank      SET context_pack_id = 'Western' WHERE context_pack_id = 'western';
DELETE FROM context_packs WHERE id IN ('vn', 'western');

COMMIT;


-- -----------------------------------------------------------------------------
-- 5. user_profiles: add portfolio columns
-- -----------------------------------------------------------------------------

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS technical_skills JSONB,
  ADD COLUMN IF NOT EXISTS certifications JSONB,
  ADD COLUMN IF NOT EXISTS awards JSONB;


-- -----------------------------------------------------------------------------
-- 6. user_answers: idempotency constraint
--    This must be prepared before prisma db push.
-- -----------------------------------------------------------------------------

-- Run `npm run db:prepare-user-answer-unique` before `prisma db push`.
-- The preparation migration preserves feedback, annotations, and follow-ups
-- while consolidating duplicate answers.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'user_answers'::regclass
      AND conname = 'user_answers_session_id_question_id_key'
  ) THEN
    RAISE EXCEPTION
      'Run npm run db:prepare-user-answer-unique before applying this migration';
  END IF;
END
$$;
