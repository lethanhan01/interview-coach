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
-- 2. Retired tables
-- -----------------------------------------------------------------------------

-- AI quality logging is deferred; remove the unused empty audit table from the
-- current schema. Recreate it in a future migration if observability is added.
DROP TABLE IF EXISTS ai_quality_log;

-- Question usage was write-only audit data. Remove it until repeat avoidance
-- becomes real product behavior backed by selection logic.
DROP TABLE IF EXISTS question_usage;

ALTER TABLE question_bank
  DROP COLUMN IF EXISTS subcategory,
  DROP COLUMN IF EXISTS applicable_roles,
  DROP COLUMN IF EXISTS applicable_levels,
  DROP COLUMN IF EXISTS tags;

ALTER TABLE users
  DROP COLUMN IF EXISTS profile_completed,
  DROP COLUMN IF EXISTS last_login_at,
  DROP COLUMN IF EXISTS deleted_at;

ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS years_experience,
  DROP COLUMN IF EXISTS default_language,
  DROP COLUMN IF EXISTS tts_enabled,
  DROP COLUMN IF EXISTS deleted_at;

ALTER TABLE resumes
  DROP COLUMN IF EXISTS file_url,
  DROP COLUMN IF EXISTS original_filename,
  DROP COLUMN IF EXISTS parsed_text,
  DROP COLUMN IF EXISTS language,
  DROP COLUMN IF EXISTS parser_version;

ALTER TABLE interview_sessions
  DROP COLUMN IF EXISTS jd_source,
  DROP COLUMN IF EXISTS jd_url,
  DROP COLUMN IF EXISTS difficulty,
  DROP COLUMN IF EXISTS persona,
  DROP COLUMN IF EXISTS mode,
  DROP COLUMN IF EXISTS show_prep_card,
  DROP COLUMN IF EXISTS opening_transcript;

ALTER TABLE saved_job_descriptions
  ADD COLUMN IF NOT EXISTS level TEXT;


-- -----------------------------------------------------------------------------
-- 3. RLS policies
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

-- -----------------------------------------------------------------------------
-- 4. Indexes
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

-- saved_job_descriptions
CREATE INDEX IF NOT EXISTS idx_saved_job_descriptions_user_updated
  ON saved_job_descriptions(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_job_descriptions_user_company_title
  ON saved_job_descriptions(user_id, company_name, job_title);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_saved_jd
  ON interview_sessions(saved_job_description_id);

-- resumes
CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_one_active_per_user
  ON resumes(user_id)
  WHERE active = true;


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
  name = EXCLUDED.name;

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
-- 4b. Normalized rubric versions
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RubricVersionStatus') THEN
    CREATE TYPE "RubricVersionStatus" AS ENUM ('draft', 'active', 'archived');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS rubric_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_pack_id TEXT NOT NULL REFERENCES context_packs(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  status "RubricVersionStatus" NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ(6),
  CONSTRAINT rubric_versions_context_pack_version_key UNIQUE (context_pack_id, version)
);

CREATE TABLE IF NOT EXISTS rubric_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_version_id UUID NOT NULL REFERENCES rubric_versions(id) ON DELETE CASCADE,
  category_key TEXT NOT NULL,
  label TEXT NOT NULL,
  weight DOUBLE PRECISION NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT rubric_categories_version_category_key UNIQUE (rubric_version_id, category_key)
);

CREATE TABLE IF NOT EXISTS rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_version_id UUID NOT NULL REFERENCES rubric_versions(id) ON DELETE CASCADE,
  rubric_category_id UUID NOT NULL REFERENCES rubric_categories(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  weight DOUBLE PRECISION NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT rubric_criteria_version_code_key UNIQUE (rubric_version_id, code)
);

ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS rubric_version_id UUID REFERENCES rubric_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rubric_versions_context_pack
  ON rubric_versions(context_pack_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rubric_versions_one_active_per_context_pack
  ON rubric_versions(context_pack_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_rubric_categories_version
  ON rubric_categories(rubric_version_id);

CREATE INDEX IF NOT EXISTS idx_rubric_criteria_category
  ON rubric_criteria(rubric_category_id);

CREATE INDEX IF NOT EXISTS idx_rubric_criteria_version
  ON rubric_criteria(rubric_version_id);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_rubric_version
  ON interview_sessions(rubric_version_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rubric_categories_category_key'
  ) THEN
    ALTER TABLE rubric_categories
      ADD CONSTRAINT chk_rubric_categories_category_key CHECK (category_key IN ('behavioral', 'technical'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rubric_categories_weight'
  ) THEN
    ALTER TABLE rubric_categories
      ADD CONSTRAINT chk_rubric_categories_weight CHECK (weight >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rubric_categories_display_order'
  ) THEN
    ALTER TABLE rubric_categories
      ADD CONSTRAINT chk_rubric_categories_display_order CHECK (display_order >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rubric_criteria_weight'
  ) THEN
    ALTER TABLE rubric_criteria
      ADD CONSTRAINT chk_rubric_criteria_weight CHECK (weight >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rubric_criteria_display_order'
  ) THEN
    ALTER TABLE rubric_criteria
      ADD CONSTRAINT chk_rubric_criteria_display_order CHECK (display_order >= 0);
  END IF;
END $$;

INSERT INTO rubric_versions (context_pack_id, version, status, published_at)
SELECT 'VN', 'v1', 'active', now()
WHERE NOT EXISTS (
  SELECT 1 FROM rubric_versions WHERE context_pack_id = 'VN' AND status = 'active'
)
ON CONFLICT (context_pack_id, version) DO NOTHING;

UPDATE rubric_versions
SET status = 'active', published_at = COALESCE(published_at, now())
WHERE context_pack_id = 'VN'
  AND version = 'v1'
  AND NOT EXISTS (
    SELECT 1
    FROM rubric_versions rv
    WHERE rv.context_pack_id = 'VN'
      AND rv.status = 'active'
      AND rv.id <> rubric_versions.id
  );

INSERT INTO rubric_versions (context_pack_id, version, status, published_at)
SELECT 'Western', 'v1', 'active', now()
WHERE NOT EXISTS (
  SELECT 1 FROM rubric_versions WHERE context_pack_id = 'Western' AND status = 'active'
)
ON CONFLICT (context_pack_id, version) DO NOTHING;

UPDATE rubric_versions
SET status = 'active', published_at = COALESCE(published_at, now())
WHERE context_pack_id = 'Western'
  AND version = 'v1'
  AND NOT EXISTS (
    SELECT 1
    FROM rubric_versions rv
    WHERE rv.context_pack_id = 'Western'
      AND rv.status = 'active'
      AND rv.id <> rubric_versions.id
  );

WITH seeds(context_pack_id, category_key, label, weight, display_order) AS (
  VALUES
    ('VN', 'behavioral', 'Tiêu chí hành vi', 0.50, 1),
    ('VN', 'technical', 'Tiêu chí kỹ thuật', 0.50, 2),
    ('Western', 'behavioral', 'Tiêu chí hành vi', 0.45, 1),
    ('Western', 'technical', 'Tiêu chí kỹ thuật', 0.55, 2)
)
INSERT INTO rubric_categories (rubric_version_id, category_key, label, weight, display_order)
SELECT rv.id, seeds.category_key, seeds.label, seeds.weight, seeds.display_order
FROM seeds
JOIN rubric_versions rv
  ON rv.context_pack_id = seeds.context_pack_id
 AND rv.version = 'v1'
ON CONFLICT (rubric_version_id, category_key) DO NOTHING;

WITH seeds(context_pack_id, category_key, code, name, weight, display_order) AS (
  VALUES
    ('VN', 'behavioral', 'D1', 'Giao tiếp & Trình bày', 0.20, 1),
    ('VN', 'behavioral', 'D2', 'Tư duy & Giải quyết vấn đề', 0.20, 2),
    ('VN', 'behavioral', 'D3', 'Làm việc nhóm', 0.15, 3),
    ('VN', 'behavioral', 'D4', 'Thái độ & Động lực', 0.20, 4),
    ('VN', 'behavioral', 'D5', 'Phù hợp văn hóa', 0.15, 5),
    ('VN', 'behavioral', 'D6', 'Tự nhận thức', 0.10, 6),
    ('VN', 'technical', 'TD1', 'Kiến thức nền tảng', 0.25, 1),
    ('VN', 'technical', 'TD2', 'Khả năng áp dụng thực tế', 0.25, 2),
    ('VN', 'technical', 'TD3', 'Tư duy hệ thống', 0.20, 3),
    ('VN', 'technical', 'TD4', 'Code quality & Best practices', 0.20, 4),
    ('VN', 'technical', 'TD5', 'Debug & Problem-solving', 0.10, 5),
    ('Western', 'behavioral', 'D1', 'Communication & Presentation', 0.20, 1),
    ('Western', 'behavioral', 'D2', 'Critical Thinking', 0.20, 2),
    ('Western', 'behavioral', 'D3', 'Collaboration & Teamwork', 0.15, 3),
    ('Western', 'behavioral', 'D4', 'Leadership & Initiative', 0.20, 4),
    ('Western', 'behavioral', 'D5', 'Culture Fit & Values', 0.15, 5),
    ('Western', 'behavioral', 'D6', 'Self-Awareness & Growth', 0.10, 6),
    ('Western', 'technical', 'TD1', 'Foundational Knowledge', 0.20, 1),
    ('Western', 'technical', 'TD2', 'Practical Application', 0.25, 2),
    ('Western', 'technical', 'TD3', 'Systems Thinking', 0.20, 3),
    ('Western', 'technical', 'TD4', 'Code Quality & Best Practices', 0.20, 4),
    ('Western', 'technical', 'TD5', 'Debug & Problem-solving', 0.15, 5)
)
INSERT INTO rubric_criteria (
  rubric_version_id,
  rubric_category_id,
  code,
  name,
  weight,
  display_order,
  active
)
SELECT rv.id, rc.id, seeds.code, seeds.name, seeds.weight, seeds.display_order, true
FROM seeds
JOIN rubric_versions rv
  ON rv.context_pack_id = seeds.context_pack_id
 AND rv.version = 'v1'
JOIN rubric_categories rc
  ON rc.rubric_version_id = rv.id
 AND rc.category_key = seeds.category_key
ON CONFLICT (rubric_version_id, code) DO NOTHING;


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
    IF to_regclass('public.user_answers_session_id_question_id_key') IS NOT NULL THEN
      ALTER TABLE user_answers
        ADD CONSTRAINT user_answers_session_id_question_id_key
        UNIQUE USING INDEX user_answers_session_id_question_id_key;
    ELSE
      ALTER TABLE user_answers
        ADD CONSTRAINT user_answers_session_id_question_id_key
        UNIQUE (session_id, question_id);
    END IF;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'session_questions'::regclass
      AND conname = 'session_questions_id_session_id_key'
  ) THEN
    ALTER TABLE session_questions
      ADD CONSTRAINT session_questions_id_session_id_key
      UNIQUE (id, session_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'user_answers'::regclass
      AND conname = 'user_answers_question_session_match_fkey'
  ) THEN
    ALTER TABLE user_answers
      ADD CONSTRAINT user_answers_question_session_match_fkey
      FOREIGN KEY (question_id, session_id)
      REFERENCES session_questions(id, session_id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION enforce_session_saved_jd_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.saved_job_description_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM saved_job_descriptions sjd
    WHERE sjd.id = NEW.saved_job_description_id
      AND sjd.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION
      'interview_sessions.saved_job_description_id must reference a saved_job_descriptions row owned by the same user'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_interview_sessions_saved_jd_owner
  ON interview_sessions;
CREATE TRIGGER trg_interview_sessions_saved_jd_owner
  BEFORE INSERT OR UPDATE OF user_id, saved_job_description_id
  ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_session_saved_jd_owner();


-- -----------------------------------------------------------------------------
-- 7. CHECK constraints
--    Prisma cannot express CHECK — apply here after every `prisma db push`.
--    DROP IF EXISTS + ADD = idempotent, safe to re-run. See ADR-008.
--    Scope is limited to values/ranges currently written by code and seed data.
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

ALTER TABLE interview_sessions
  DROP CONSTRAINT IF EXISTS chk_interview_sessions_status;
ALTER TABLE interview_sessions
  ADD CONSTRAINT chk_interview_sessions_status
  CHECK (status IN (
    'generating',
    'active',
    'paused',
    'canceled',
    'completing',
    'completed',
    'error'
  ));

ALTER TABLE interview_sessions
  DROP CONSTRAINT IF EXISTS chk_interview_sessions_num_questions;
ALTER TABLE interview_sessions
  ADD CONSTRAINT chk_interview_sessions_num_questions
  CHECK (num_questions BETWEEN 3 AND 45);

ALTER TABLE interview_sessions
  DROP CONSTRAINT IF EXISTS chk_interview_sessions_duration_min;
ALTER TABLE interview_sessions
  ADD CONSTRAINT chk_interview_sessions_duration_min
  CHECK (duration_min > 0);

ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS remaining_seconds INTEGER;
ALTER TABLE interview_sessions
  DROP CONSTRAINT IF EXISTS chk_interview_sessions_remaining_seconds;
ALTER TABLE interview_sessions
  ADD CONSTRAINT chk_interview_sessions_remaining_seconds
  CHECK (remaining_seconds IS NULL OR remaining_seconds >= 0);

ALTER TABLE interview_sessions
  DROP CONSTRAINT IF EXISTS chk_interview_sessions_overall_score;
ALTER TABLE interview_sessions
  ADD CONSTRAINT chk_interview_sessions_overall_score
  CHECK (overall_score IS NULL OR overall_score BETWEEN 0 AND 100);

ALTER TABLE question_bank
  DROP CONSTRAINT IF EXISTS chk_question_bank_difficulty;
ALTER TABLE question_bank
  ADD CONSTRAINT chk_question_bank_difficulty
  CHECK (difficulty BETWEEN 1 AND 5);

ALTER TABLE question_bank
  DROP CONSTRAINT IF EXISTS chk_question_bank_estimated_time_min;
ALTER TABLE question_bank
  ADD CONSTRAINT chk_question_bank_estimated_time_min
  CHECK (estimated_time_min IS NULL OR estimated_time_min > 0);

ALTER TABLE user_answers
  DROP CONSTRAINT IF EXISTS chk_user_answers_answer_mode;
ALTER TABLE user_answers
  ADD CONSTRAINT chk_user_answers_answer_mode
  CHECK (answer_mode IN ('text', 'voice'));

ALTER TABLE user_answers
  DROP CONSTRAINT IF EXISTS chk_user_answers_transcription_status;
ALTER TABLE user_answers
  ADD CONSTRAINT chk_user_answers_transcription_status
  CHECK (
    transcription_status IS NULL
    OR transcription_status IN ('pending', 'done', 'failed')
  );

ALTER TABLE user_answers
  DROP CONSTRAINT IF EXISTS chk_user_answers_audio_duration_seconds;
ALTER TABLE user_answers
  ADD CONSTRAINT chk_user_answers_audio_duration_seconds
  CHECK (audio_duration_seconds IS NULL OR audio_duration_seconds >= 0);

ALTER TABLE user_answers
  DROP CONSTRAINT IF EXISTS chk_user_answers_audio_size_bytes;
ALTER TABLE user_answers
  ADD CONSTRAINT chk_user_answers_audio_size_bytes
  CHECK (audio_size_bytes IS NULL OR audio_size_bytes >= 0);

ALTER TABLE ai_feedbacks
  DROP CONSTRAINT IF EXISTS chk_ai_feedbacks_overall_score;
ALTER TABLE ai_feedbacks
  ADD CONSTRAINT chk_ai_feedbacks_overall_score
  CHECK (overall_score BETWEEN 0 AND 100);

ALTER TABLE annotated_segments
  DROP CONSTRAINT IF EXISTS chk_annotated_segments_offsets;
ALTER TABLE annotated_segments
  ADD CONSTRAINT chk_annotated_segments_offsets
  CHECK (start_index >= 0 AND end_index >= start_index);


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
    INSERT INTO resumes (user_id, active, parsed_json)
    SELECT up.user_id, true,
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

ALTER TABLE session_reports
  DROP CONSTRAINT IF EXISTS chk_session_reports_report_type;
ALTER TABLE session_reports
  ADD CONSTRAINT chk_session_reports_report_type
  CHECK (report_type IN (
    'executive_summary',
    'comm_analysis',
    'competency_heatmap',
    'action_plan',
    'skipped_answers'
  ));

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

-- Step 1: Create enum type (idempotent)
DO $$ BEGIN
  CREATE TYPE "QuestionSessionType" AS ENUM ('hr', 'technical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 11. Add multi-criteria competency metadata.
--     competency_domains is the only question scoring-domain source of truth.
-- =============================================================================

ALTER TABLE "question_bank"
  ADD COLUMN IF NOT EXISTS "competency_domains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'question_bank'
      AND column_name = 'competency_domain'
  ) THEN
    UPDATE "question_bank"
    SET "competency_domains" = ARRAY["competency_domain"]
    WHERE cardinality("competency_domains") = 0
      AND "competency_domain" IS NOT NULL;
  END IF;
END $$;

ALTER TABLE "question_bank"
  DROP COLUMN IF EXISTS "competency_domain";

DO $$ BEGIN
  ALTER TABLE "question_bank"
    ADD CONSTRAINT "question_bank_competency_domains_nonempty"
    CHECK (cardinality("competency_domains") > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "session_questions"
  ADD COLUMN IF NOT EXISTS "competency_domains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'session_questions'
      AND column_name = 'competency_domain'
  ) THEN
    UPDATE "session_questions"
    SET "competency_domains" = ARRAY["competency_domain"]
    WHERE cardinality("competency_domains") = 0
      AND "competency_domain" IS NOT NULL;
  END IF;
END $$;

ALTER TABLE "session_questions"
  DROP COLUMN IF EXISTS "competency_domain";

DO $$ BEGIN
  ALTER TABLE "session_questions"
    ADD CONSTRAINT "session_questions_competency_domains_nonempty"
    CHECK (cardinality("competency_domains") > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Convert any remaining 'mixed' values (idempotent via WHERE)
UPDATE question_bank
SET session_type = (CASE
  WHEN competency_domains[1] LIKE 'TD%' THEN 'technical'
  ELSE 'hr'
END)::"QuestionSessionType"
WHERE session_type::text = 'mixed';

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
