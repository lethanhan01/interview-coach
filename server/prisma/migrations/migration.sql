-- =============================================================================
-- InterviewCoach — Consolidated migration
-- Apply against a Supabase project that already has the base schema created
-- via `prisma db push`. Execute as a superuser or service role.
-- Fully idempotent (DROP IF EXISTS / IF NOT EXISTS / ON CONFLICT) — safe to
-- re-run after every push. Run via `npm run db:apply-sql`.
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();


-- -----------------------------------------------------------------------------
-- 2. RLS policies
-- -----------------------------------------------------------------------------

-- Supabase Storage: interview audio bucket for voice answers.
-- The bucket must exist before the browser can upload audio/webm blobs.
INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
VALUES (
  'interview-audio',
  'interview-audio',
  true,
  10485760,
  ARRAY['audio/webm', 'audio/mp4', 'audio/wav']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "public" = EXCLUDED."public",
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "interview_audio: authenticated upload" ON storage.objects;
CREATE POLICY "interview_audio: authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'interview-audio');

-- question_bank
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "question_bank: read all" ON question_bank;
CREATE POLICY "question_bank: read all"
  ON question_bank FOR SELECT
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "question_bank: admin insert" ON question_bank;
CREATE POLICY "question_bank: admin insert"
  ON question_bank FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "question_bank: admin update" ON question_bank;
CREATE POLICY "question_bank: admin update"
  ON question_bank FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "question_bank: admin delete" ON question_bank;
CREATE POLICY "question_bank: admin delete"
  ON question_bank FOR DELETE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users: read own" ON users;
CREATE POLICY "users: read own"
  ON users FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "users: update own" ON users;
CREATE POLICY "users: update own"
  ON users FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS "users: admin read all" ON users;
CREATE POLICY "users: admin read all"
  ON users FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "users: admin update status" ON users;
CREATE POLICY "users: admin update status"
  ON users FOR UPDATE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles: read own" ON user_profiles;
CREATE POLICY "user_profiles: read own"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_profiles: insert own" ON user_profiles;
CREATE POLICY "user_profiles: insert own"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_profiles: update own" ON user_profiles;
CREATE POLICY "user_profiles: update own"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- resumes (T12 / SR-02) — CV data tách khỏi user_profiles
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resumes: read own" ON resumes;
CREATE POLICY "resumes: read own"
  ON resumes FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "resumes: insert own" ON resumes;
CREATE POLICY "resumes: insert own"
  ON resumes FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "resumes: update own" ON resumes;
CREATE POLICY "resumes: update own"
  ON resumes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- interview_sessions
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interview_sessions: read own" ON interview_sessions;
CREATE POLICY "interview_sessions: read own"
  ON interview_sessions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "interview_sessions: insert own" ON interview_sessions;
CREATE POLICY "interview_sessions: insert own"
  ON interview_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "interview_sessions: update own" ON interview_sessions;
CREATE POLICY "interview_sessions: update own"
  ON interview_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- session_questions (candidate read-only; INSERT/UPDATE by service role only)
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_questions: read own" ON session_questions;
CREATE POLICY "session_questions: read own"
  ON session_questions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

-- user_answers
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_answers: read own" ON user_answers;
CREATE POLICY "user_answers: read own"
  ON user_answers FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_answers: insert own" ON user_answers;
CREATE POLICY "user_answers: insert own"
  ON user_answers FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

-- saved_job_descriptions
ALTER TABLE saved_job_descriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_job_descriptions: read own" ON saved_job_descriptions;
CREATE POLICY "saved_job_descriptions: read own"
  ON saved_job_descriptions FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "saved_job_descriptions: insert own" ON saved_job_descriptions;
CREATE POLICY "saved_job_descriptions: insert own"
  ON saved_job_descriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "saved_job_descriptions: update own" ON saved_job_descriptions;
CREATE POLICY "saved_job_descriptions: update own"
  ON saved_job_descriptions FOR UPDATE
  USING (user_id = auth.uid());

-- ai_feedbacks (candidate read only; INSERT by service role only)
ALTER TABLE ai_feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_feedbacks: read own" ON ai_feedbacks;
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

DROP POLICY IF EXISTS "annotated_segments: read own" ON annotated_segments;
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

-- ai_quality_log (admin read only; no candidate access)
ALTER TABLE ai_quality_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_quality_log: admin read" ON ai_quality_log;
CREATE POLICY "ai_quality_log: admin read"
  ON ai_quality_log FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');


-- -----------------------------------------------------------------------------
-- 3. Indexes
--    Partial indexes use raw SQL — Prisma @@index does not support WHERE clauses.
-- -----------------------------------------------------------------------------

-- Session lookup
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id
  ON interview_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at
  ON interview_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_created
  ON interview_sessions(user_id, created_at DESC);

-- Turn data
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id
  ON session_questions(session_id);

CREATE INDEX IF NOT EXISTS idx_user_answers_session_id
  ON user_answers(session_id);

CREATE INDEX IF NOT EXISTS idx_user_answers_question_id
  ON user_answers(question_id);

-- Feedback
CREATE INDEX IF NOT EXISTS idx_ai_feedbacks_user_answer_id
  ON ai_feedbacks(user_answer_id)
  WHERE user_answer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_annotated_segments_feedback_id
  ON annotated_segments(ai_feedback_id);

-- AntiRepeat & Question bank
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id_text
  ON session_questions(session_id, question_text);

CREATE INDEX IF NOT EXISTS idx_question_bank_session_type_difficulty
  ON question_bank(session_type, difficulty)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_question_bank_context_pack
  ON question_bank(context_pack_id)
  WHERE deleted_at IS NULL;

-- Audit log
CREATE INDEX IF NOT EXISTS idx_ai_quality_log_created_at
  ON ai_quality_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_quality_log_job_type_created
  ON ai_quality_log(job_type, created_at DESC);

-- saved_job_descriptions
CREATE INDEX IF NOT EXISTS idx_saved_job_descriptions_user_updated
  ON saved_job_descriptions(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_job_descriptions_user_company_title
  ON saved_job_descriptions(user_id, company_name, job_title);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_saved_jd
  ON interview_sessions(saved_job_description_id);


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
-- Normalize legacy session_type before §7 CHECK (behavioral interview = hr).
UPDATE interview_sessions SET session_type = 'hr' WHERE session_type = 'behavioral';
UPDATE question_bank      SET context_pack_id = 'VN'      WHERE context_pack_id = 'vn';
UPDATE question_bank      SET context_pack_id = 'Western' WHERE context_pack_id = 'western';
DELETE FROM context_packs WHERE id IN ('vn', 'western');

COMMIT;


-- -----------------------------------------------------------------------------
-- 5. (removed in T12 / SR-02) — portfolio columns moved out of user_profiles
--    into the `resumes` table. CV fields (education, work_experience, projects,
--    technical_skills, certifications, awards) now live in resumes.parsed_json.
--    See §8 for resumes RLS and the T12 data-migration note.
-- -----------------------------------------------------------------------------


-- -----------------------------------------------------------------------------
-- 6. user_answers: idempotency constraint
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'user_answers'::regclass
      AND conname = 'user_answers_session_id_question_id_key'
  ) THEN
    ALTER TABLE user_answers
      ADD CONSTRAINT user_answers_session_id_question_id_key
      UNIQUE (session_id, question_id);
  END IF;
END
$$;


-- -----------------------------------------------------------------------------
-- 7. CHECK constraints (enum-like columns)
--    Prisma cannot express CHECK — apply here after every `prisma db push`.
--    DROP IF EXISTS + ADD = idempotent, safe to re-run. See ADR-008.
--    Scope limited to columns with a stable, verified value set:
--      - interview_sessions.session_type (matches CreateSessionDto + seed)
--      - users.role                      (candidate = default, admin = RLS policies)
--    Deliberately excluded (volatile / single-value sets, high drift risk):
--      users.status, interview_sessions.status — enforced at application layer.
-- -----------------------------------------------------------------------------

ALTER TABLE interview_sessions
  DROP CONSTRAINT IF EXISTS chk_interview_sessions_session_type;
ALTER TABLE interview_sessions
  ADD CONSTRAINT chk_interview_sessions_session_type
  CHECK (session_type IN ('hr', 'technical', 'mixed'));

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users
  ADD CONSTRAINT chk_users_role
  CHECK (role IN ('candidate', 'admin'));


-- -----------------------------------------------------------------------------
-- 8. T12 / SR-02: backfill resumes from user_profiles JSONB columns.
--    Run order matters — the db push workflow drops the 6 old CV columns:
--      1. Make the `resumes` table exist alongside the old columns. Easiest:
--         create it manually with the DDL Prisma would generate, OR keep the
--         old columns in schema for one push, then remove them on the next.
--      2. Run THIS block while BOTH `resumes` and the old user_profiles columns
--         exist — it copies CV data into resumes.parsed_json.
--      3. Then `prisma db push --accept-data-loss` drops the 6 old columns.
--    Idempotent: skips users that already have an active resume; the outer IF
--    makes it a no-op once the old columns are gone.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
      AND column_name = 'education'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'resumes'
  ) THEN
    INSERT INTO resumes (user_id, parser_version, active, parsed_json)
    SELECT up.user_id, 'manual', true,
      jsonb_strip_nulls(jsonb_build_object(
        'education',       up.education,
        'workExperience',  up.work_experience,
        'projects',        up.projects,
        'technicalSkills', up.technical_skills,
        'certifications',  up.certifications,
        'awards',          up.awards
      ))
    FROM user_profiles up
    WHERE NOT EXISTS (
      SELECT 1 FROM resumes r WHERE r.user_id = up.user_id AND r.active
    )
    AND (up.education IS NOT NULL OR up.work_experience IS NOT NULL
      OR up.projects IS NOT NULL OR up.technical_skills IS NOT NULL
      OR up.certifications IS NOT NULL OR up.awards IS NOT NULL);
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 9. T13 / SR-07: session_reports table
--    Normalized report storage — 4 report types per session as separate rows.
--    Replaces 6 JSON columns on interview_sessions (dropped via prisma db push).
--    Idempotent: CREATE TABLE IF NOT EXISTS + guarded backfill + DROP POLICY IF EXISTS.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "session_reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_id" UUID NOT NULL,
  "report_type" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "content_json" JSONB NOT NULL,
  "generated_by_model" TEXT,
  "prompt_version" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "session_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "session_reports_session_id_fkey" FOREIGN KEY ("session_id")
    REFERENCES "interview_sessions"("id") ON DELETE CASCADE,
  CONSTRAINT "session_reports_session_id_report_type_version_key"
    UNIQUE ("session_id", "report_type", "version")
);

CREATE INDEX IF NOT EXISTS "session_reports_session_id_idx"
  ON "session_reports"("session_id");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'interview_sessions'
      AND column_name = 'executive_summary_json'
  ) THEN
    INSERT INTO session_reports (session_id, report_type, version, content_json)
    SELECT id, 'executive_summary', 1, executive_summary_json
    FROM interview_sessions
    WHERE executive_summary_json IS NOT NULL
    ON CONFLICT (session_id, report_type, version)
      DO UPDATE SET content_json = EXCLUDED.content_json;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'interview_sessions'
      AND column_name = 'comm_analysis_json'
  ) THEN
    INSERT INTO session_reports (session_id, report_type, version, content_json)
    SELECT id, 'comm_analysis', 1, comm_analysis_json
    FROM interview_sessions
    WHERE comm_analysis_json IS NOT NULL
    ON CONFLICT (session_id, report_type, version)
      DO UPDATE SET content_json = EXCLUDED.content_json;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'interview_sessions'
      AND column_name = 'competency_heatmap_json'
  ) THEN
    INSERT INTO session_reports (session_id, report_type, version, content_json)
    SELECT id, 'competency_heatmap', 1, competency_heatmap_json
    FROM interview_sessions
    WHERE competency_heatmap_json IS NOT NULL
    ON CONFLICT (session_id, report_type, version)
      DO UPDATE SET content_json = EXCLUDED.content_json;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'interview_sessions'
      AND column_name = 'action_plan_json'
  ) THEN
    INSERT INTO session_reports (session_id, report_type, version, content_json)
    SELECT id, 'action_plan', 1, action_plan_json
    FROM interview_sessions
    WHERE action_plan_json IS NOT NULL
    ON CONFLICT (session_id, report_type, version)
      DO UPDATE SET content_json = EXCLUDED.content_json;
  END IF;
END
$$;

-- RLS
ALTER TABLE "session_reports" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own session reports" ON "session_reports";
CREATE POLICY "Users can read own session reports" ON "session_reports"
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );


-- =============================================================================
-- 10. Convert question_bank.session_type 'mixed' → 'hr' or 'technical',
--     then change column type to QuestionSessionType enum.
--     Idempotent: each step is guarded.
-- =============================================================================

-- Step 1: Convert any remaining 'mixed' values (idempotent via WHERE)
UPDATE question_bank
SET session_type = CASE
  WHEN competency_domain LIKE 'TD%' THEN 'technical'
  ELSE 'hr'
END
WHERE session_type = 'mixed';

-- Step 2: Create enum type (idempotent)
DO $$ BEGIN
  CREATE TYPE "QuestionSessionType" AS ENUM ('hr', 'technical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 3: Change column type to enum (idempotent — guard on current column type)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'question_bank'
      AND column_name = 'session_type'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "question_bank"
      ALTER COLUMN "session_type" TYPE "QuestionSessionType"
      USING "session_type"::"QuestionSessionType";
  END IF;
END $$;
