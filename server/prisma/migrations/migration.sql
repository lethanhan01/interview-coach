-- =============================================================================
-- Workflow outbox: additive durable commands for post-commit queue work.
-- Dispatcher/cutover follows in RF-009; this table is retained on rollback.
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflow_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ(6),
  error_summary TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_outbox_due
  ON workflow_outbox(state, available_at);
CREATE INDEX IF NOT EXISTS idx_workflow_outbox_aggregate
  ON workflow_outbox(aggregate_id);

-- =============================================================================
-- InterviewCoach — Consolidated migration
-- Apply against a Supabase project that already has the base schema created
-- via `prisma db push`. Execute as a superuser or service role.
-- Fully idempotent (DROP IF EXISTS / IF NOT EXISTS / ON CONFLICT) — safe to
-- re-run after every push. Run via `npm run db:apply-sql`.
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- 2. Retired tables & column adjustments
-- -----------------------------------------------------------------------------

-- AI quality logging is deferred; remove the unused empty audit table from the
-- current schema. Recreate it in a future migration if observability is added.
DROP TABLE IF EXISTS ai_quality_log;

-- Question usage was write-only audit data. Remove it until repeat avoidance
-- becomes real product behavior backed by selection logic.
DROP TABLE IF EXISTS question_usage;

-- Structured CV data now lives directly on user_profiles JSONB columns.
DROP TABLE IF EXISTS resumes;

ALTER TABLE question_bank
  DROP COLUMN IF EXISTS subcategory,
  DROP COLUMN IF EXISTS applicable_roles,
  DROP COLUMN IF EXISTS applicable_levels,
  DROP COLUMN IF EXISTS tags;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('candidate', 'admin');
  END IF;
END $$;

ALTER TABLE users
  DROP COLUMN IF EXISTS profile_completed,
  DROP COLUMN IF EXISTS last_login_at,
  DROP COLUMN IF EXISTS deleted_at,
  DROP COLUMN IF EXISTS password_updated_at,
  DROP COLUMN IF EXISTS password_reset_token_hash,
  DROP COLUMN IF EXISTS password_reset_expires_at;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users
  ADD CONSTRAINT chk_users_role
  CHECK (role::text IN ('candidate', 'admin'));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE password_hash IS NULL) THEN
    ALTER TABLE public.users ALTER COLUMN password_hash SET NOT NULL;
  END IF;
END $$;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS chk_users_candidate_names;

ALTER TABLE public.users
  ADD CONSTRAINT chk_users_candidate_names
  CHECK (
    role::text <> 'candidate'
    OR (
      first_name IS NOT NULL AND btrim(first_name) <> ''
      AND last_name IS NOT NULL AND btrim(last_name) <> ''
    )
  );

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS education JSONB,
  ADD COLUMN IF NOT EXISTS work_experience JSONB,
  ADD COLUMN IF NOT EXISTS projects JSONB,
  ADD COLUMN IF NOT EXISTS technical_skills JSONB,
  ADD COLUMN IF NOT EXISTS certifications JSONB,
  ADD COLUMN IF NOT EXISTS awards JSONB,
  DROP COLUMN IF EXISTS target_position,
  DROP COLUMN IF EXISTS target_role_category,
  DROP COLUMN IF EXISTS target_level,
  DROP COLUMN IF EXISTS years_experience,
  DROP COLUMN IF EXISTS default_language,
  DROP COLUMN IF EXISTS tts_enabled,
  DROP COLUMN IF EXISTS preferred_tech_stack,
  DROP COLUMN IF EXISTS deleted_at;

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

-- interview_sessions
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interview_sessions: read own" ON interview_sessions;
CREATE POLICY "interview_sessions: read own"
  ON interview_sessions FOR SELECT
  USING (
    saved_job_description_id IN (
      SELECT id FROM saved_job_descriptions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "interview_sessions: insert own" ON interview_sessions;
CREATE POLICY "interview_sessions: insert own"
  ON interview_sessions FOR INSERT
  WITH CHECK (
    saved_job_description_id IN (
      SELECT id FROM saved_job_descriptions WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "interview_sessions: update own" ON interview_sessions;
CREATE POLICY "interview_sessions: update own"
  ON interview_sessions FOR UPDATE
  USING (
    saved_job_description_id IN (
      SELECT id FROM saved_job_descriptions WHERE user_id = auth.uid()
    )
  );

-- session_questions (candidate read-only; INSERT/UPDATE by service role only)
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_questions: read own" ON session_questions;
CREATE POLICY "session_questions: read own"
  ON session_questions FOR SELECT
  USING (
    session_id IN (
      SELECT s.id FROM interview_sessions s
      JOIN saved_job_descriptions sjd ON sjd.id = s.saved_job_description_id
      WHERE sjd.user_id = auth.uid()
    )
  );

-- user_answers
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_answers: read own" ON user_answers;
CREATE POLICY "user_answers: read own"
  ON user_answers FOR SELECT
  USING (
    question_id IN (
      SELECT sq.id FROM session_questions sq
      JOIN interview_sessions s ON s.id = sq.session_id
      JOIN saved_job_descriptions sjd ON sjd.id = s.saved_job_description_id
      WHERE sjd.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_answers: insert own" ON user_answers;
CREATE POLICY "user_answers: insert own"
  ON user_answers FOR INSERT
  WITH CHECK (
    question_id IN (
      SELECT sq.id FROM session_questions sq
      JOIN interview_sessions s ON s.id = sq.session_id
      JOIN saved_job_descriptions sjd ON sjd.id = s.saved_job_description_id
      WHERE sjd.user_id = auth.uid()
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
      JOIN session_questions sq ON sq.id = ua.question_id
      JOIN interview_sessions s ON s.id = sq.session_id
      JOIN saved_job_descriptions sjd ON sjd.id = s.saved_job_description_id
      WHERE sjd.user_id = auth.uid()
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
      JOIN session_questions sq ON sq.id = ua.question_id
      JOIN interview_sessions s ON s.id = sq.session_id
      JOIN saved_job_descriptions sjd ON sjd.id = s.saved_job_description_id
      WHERE sjd.user_id = auth.uid()
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

-- -----------------------------------------------------------------------------
-- 4. Context constants and current rubric tables
-- -----------------------------------------------------------------------------

BEGIN;

-- Normalize IDs created before standardization.
UPDATE interview_sessions SET context_pack_id = 'VN'      WHERE context_pack_id = 'vn';
UPDATE interview_sessions SET context_pack_id = 'Western' WHERE context_pack_id = 'western';
UPDATE question_bank      SET context_pack_id = 'VN'      WHERE context_pack_id = 'vn';
UPDATE question_bank      SET context_pack_id = 'Western' WHERE context_pack_id = 'western';

-- Normalize legacy session_type before §7 CHECK (behavioral interview = hr).
UPDATE interview_sessions SET session_type = 'hr' WHERE session_type = 'behavioral';

DO $$
DECLARE
  invalid_contexts INTEGER;
BEGIN
  SELECT count(*) INTO invalid_contexts
  FROM (
    SELECT context_pack_id FROM interview_sessions
    UNION ALL
    SELECT context_pack_id FROM question_bank
  ) contexts
  WHERE context_pack_id NOT IN ('VN', 'Western');

  IF to_regclass('public.rubric_versions') IS NOT NULL THEN
    SELECT invalid_contexts + count(*) INTO invalid_contexts
    FROM rubric_versions
    WHERE context_pack_id NOT IN ('VN', 'Western');
  END IF;

  IF invalid_contexts > 0 THEN
    RAISE EXCEPTION 'Cannot version rubric context packs: found % invalid context_pack_id values', invalid_contexts;
  END IF;

END $$;

COMMIT;

CREATE TABLE IF NOT EXISTS rubric_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_pack_id TEXT NOT NULL,
  version_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  checksum TEXT,
  published_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT chk_rubric_versions_context_pack CHECK (context_pack_id IN ('VN', 'Western')),
  CONSTRAINT chk_rubric_versions_status CHECK (status IN ('active', 'archived')),
  CONSTRAINT rubric_versions_context_version_key UNIQUE (context_pack_id, version_key)
);

CREATE INDEX IF NOT EXISTS idx_rubric_versions_context_pack
  ON rubric_versions(context_pack_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rubric_versions_one_active_per_context_pack
  ON rubric_versions(context_pack_id)
  WHERE status = 'active';

ALTER TABLE rubric_categories
  ADD COLUMN IF NOT EXISTS rubric_version_id UUID;

ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS rubric_version_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rubric_categories'
      AND column_name = 'context_pack_id'
  ) THEN
    INSERT INTO rubric_versions (context_pack_id, version_key, status, checksum)
    SELECT context_pack_id, 'v1', 'active', md5(context_pack_id || ':v1')
    FROM (
      SELECT DISTINCT context_pack_id
      FROM rubric_categories
      WHERE context_pack_id IN ('VN', 'Western')
    ) contexts
    ON CONFLICT (context_pack_id, version_key) DO UPDATE
      SET status = 'active',
          checksum = COALESCE(rubric_versions.checksum, EXCLUDED.checksum);

    UPDATE rubric_categories rc
    SET rubric_version_id = rv.id
    FROM rubric_versions rv
    WHERE rc.context_pack_id = rv.context_pack_id
      AND rv.status = 'active'
      AND rc.rubric_version_id IS NULL;
  END IF;

  UPDATE interview_sessions s
  SET rubric_version_id = rv.id
  FROM rubric_versions rv
  WHERE s.context_pack_id = rv.context_pack_id
    AND rv.status = 'active'
    AND s.rubric_version_id IS NULL;
END $$;

ALTER TABLE interview_sessions
  DROP CONSTRAINT IF EXISTS interview_sessions_context_pack_id_fkey;

ALTER TABLE question_bank
  DROP CONSTRAINT IF EXISTS question_bank_context_pack_id_fkey;

DO $$
DECLARE
  mismatch_count INTEGER;
  duplicate_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rubric_criteria'
      AND column_name = 'rubric_version_id'
  ) THEN
    SELECT count(*) INTO mismatch_count
    FROM rubric_criteria rcr
    JOIN rubric_categories rc
      ON rc.id = rcr.rubric_category_id
    WHERE rcr.rubric_version_id IS DISTINCT FROM rc.rubric_version_id;

    IF mismatch_count > 0 THEN
      RAISE EXCEPTION 'Cannot drop rubric_criteria.rubric_version_id: % rows do not match rubric_categories.rubric_version_id', mismatch_count;
    END IF;
  END IF;

  SELECT count(*) INTO duplicate_count
  FROM (
    SELECT rc.rubric_version_id, rcr.code
    FROM rubric_criteria rcr
    JOIN rubric_categories rc
      ON rc.id = rcr.rubric_category_id
    GROUP BY rc.rubric_version_id, rcr.code
    HAVING count(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Cannot enforce rubric criterion version-code uniqueness: found % duplicate code groups', duplicate_count;
  END IF;
END $$;

ALTER TABLE rubric_categories
  DROP CONSTRAINT IF EXISTS rubric_categories_rubric_version_id_fkey,
  DROP CONSTRAINT IF EXISTS rubric_categories_context_category_key;

ALTER TABLE rubric_criteria
  DROP CONSTRAINT IF EXISTS rubric_criteria_rubric_version_id_fkey,
  DROP CONSTRAINT IF EXISTS rubric_criteria_version_code_key,
  DROP CONSTRAINT IF EXISTS rubric_criteria_category_code_key;

DROP INDEX IF EXISTS idx_rubric_criteria_version;
DROP INDEX IF EXISTS rubric_criteria_version_code_key;

DROP TABLE IF EXISTS context_packs;
DROP TYPE IF EXISTS "RubricVersionStatus";

CREATE INDEX IF NOT EXISTS idx_rubric_categories_version
  ON rubric_categories(rubric_version_id);

CREATE INDEX IF NOT EXISTS idx_rubric_criteria_category
  ON rubric_criteria(rubric_category_id);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_rubric_version
  ON interview_sessions(rubric_version_id);

CREATE UNIQUE INDEX IF NOT EXISTS rubric_categories_version_category_key
  ON rubric_categories(rubric_version_id, category_key);

CREATE UNIQUE INDEX IF NOT EXISTS rubric_criteria_category_code_key
  ON rubric_criteria(rubric_category_id, code);

ALTER TABLE rubric_criteria
  DROP COLUMN IF EXISTS rubric_version_id;

CREATE OR REPLACE FUNCTION validate_rubric_criterion_version_code()
RETURNS trigger AS $$
DECLARE
  target_version_id UUID;
BEGIN
  SELECT rubric_version_id INTO target_version_id
  FROM rubric_categories
  WHERE id = NEW.rubric_category_id;

  IF target_version_id IS NULL THEN
    RAISE EXCEPTION 'rubric_criteria must reference a category with a rubric version';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM rubric_criteria rcr
    JOIN rubric_categories rc
      ON rc.id = rcr.rubric_category_id
    WHERE rc.rubric_version_id = target_version_id
      AND rcr.code = NEW.code
      AND rcr.id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'rubric_criteria.code must be unique within a rubric version';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rubric_criteria_version_code ON rubric_criteria;
CREATE TRIGGER trg_rubric_criteria_version_code
BEFORE INSERT OR UPDATE OF rubric_category_id, code ON rubric_criteria
FOR EACH ROW EXECUTE FUNCTION validate_rubric_criterion_version_code();

WITH seeds(context_pack_id, category_key, label, weight, display_order) AS (
  VALUES
    ('VN', 'behavioral', 'Tiêu chí hành vi', 0.50, 1),
    ('VN', 'technical', 'Tiêu chí kỹ thuật', 0.50, 2),
    ('Western', 'behavioral', 'Tiêu chí hành vi', 0.45, 1),
    ('Western', 'technical', 'Tiêu chí kỹ thuật', 0.55, 2)
)
INSERT INTO rubric_versions (context_pack_id, version_key, status, checksum)
SELECT DISTINCT context_pack_id, 'v1', 'active', md5(context_pack_id || ':v1')
FROM seeds
ON CONFLICT (context_pack_id, version_key) DO NOTHING;

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
 AND rv.version_key = 'v1'
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
),
seed_rows AS (
  SELECT
    rv.id AS rubric_version_id,
    rc.id AS rubric_category_id,
    seeds.code,
    seeds.name,
    seeds.weight,
    seeds.display_order
  FROM seeds
  JOIN rubric_versions rv
    ON rv.context_pack_id = seeds.context_pack_id
   AND rv.version_key = 'v1'
  JOIN rubric_categories rc
    ON rc.rubric_version_id = rv.id
   AND rc.category_key = seeds.category_key
),
updated AS (
  UPDATE rubric_criteria rcr
  SET rubric_category_id = seed_rows.rubric_category_id,
      name = seed_rows.name,
      weight = seed_rows.weight,
      display_order = seed_rows.display_order
  FROM seed_rows, rubric_categories current_rc
  WHERE current_rc.id = rcr.rubric_category_id
    AND current_rc.rubric_version_id = seed_rows.rubric_version_id
    AND rcr.code = seed_rows.code
  RETURNING rcr.id
)
INSERT INTO rubric_criteria (
  rubric_category_id,
  code,
  name,
  weight,
  display_order
)
SELECT
  seed_rows.rubric_category_id,
  seed_rows.code,
  seed_rows.name,
  seed_rows.weight,
  seed_rows.display_order
FROM seed_rows
WHERE NOT EXISTS (
  SELECT 1
  FROM rubric_criteria rcr
  JOIN rubric_categories existing_rc
    ON existing_rc.id = rcr.rubric_category_id
  WHERE existing_rc.rubric_version_id = seed_rows.rubric_version_id
    AND rcr.code = seed_rows.code
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE ns.nspname = 'public'
      AND cls.relname = 'rubric_categories'
      AND con.conname = 'chk_rubric_categories_category_key'
  ) THEN
    ALTER TABLE public.rubric_categories
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


-- -----------------------------------------------------------------------------
-- 5. Profile CV fields
--    CV fields (education, work_experience, projects, technical_skills,
--    certifications, awards) live directly on user_profiles as JSONB columns.
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

ALTER TABLE interview_sessions
  DROP CONSTRAINT IF EXISTS chk_interview_sessions_context_pack;
ALTER TABLE interview_sessions
  ADD CONSTRAINT chk_interview_sessions_context_pack
  CHECK (context_pack_id IN ('VN', 'Western'));

ALTER TABLE question_bank
  DROP CONSTRAINT IF EXISTS chk_question_bank_context_pack;
ALTER TABLE question_bank
  ADD CONSTRAINT chk_question_bank_context_pack
  CHECK (context_pack_id IN ('VN', 'Western'));

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
    'skipped_answers',
    'session_competency_evaluation'
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
      SELECT s.id FROM interview_sessions s
      JOIN saved_job_descriptions sjd ON sjd.id = s.saved_job_description_id
      WHERE sjd.user_id = auth.uid()
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
-- 11. Retire legacy question competency metadata cache.
--     Criteria relations are the only DB source of truth from release 2 onward.
-- =============================================================================

ALTER TABLE "question_bank"
  DROP COLUMN IF EXISTS "competency_domain";

ALTER TABLE "session_questions"
  DROP COLUMN IF EXISTS "competency_domain";

-- =============================================================================
-- 12. Normalize question-to-rubric-criteria relations.
--     Release 2 drops the old competency_domains compatibility cache after
--     legacy backfill has populated relation tables.
-- =============================================================================

CREATE TABLE IF NOT EXISTS question_bank_criteria (
  question_bank_id UUID NOT NULL,
  rubric_criterion_id UUID NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT question_bank_criteria_pkey
    PRIMARY KEY (question_bank_id, rubric_criterion_id),
  CONSTRAINT question_bank_criteria_question_bank_id_fkey
    FOREIGN KEY (question_bank_id)
    REFERENCES question_bank(id)
    ON DELETE CASCADE,
  CONSTRAINT question_bank_criteria_rubric_criterion_id_fkey
    FOREIGN KEY (rubric_criterion_id)
    REFERENCES rubric_criteria(id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_question_bank_criteria_rubric_criterion
  ON question_bank_criteria(rubric_criterion_id);

CREATE TABLE IF NOT EXISTS session_question_criteria (
  session_question_id UUID NOT NULL,
  rubric_criterion_id UUID NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT session_question_criteria_pkey
    PRIMARY KEY (session_question_id, rubric_criterion_id),
  CONSTRAINT session_question_criteria_session_question_id_fkey
    FOREIGN KEY (session_question_id)
    REFERENCES session_questions(id)
    ON DELETE CASCADE,
  CONSTRAINT session_question_criteria_rubric_criterion_id_fkey
    FOREIGN KEY (rubric_criterion_id)
    REFERENCES rubric_criteria(id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_session_question_criteria_rubric_criterion
  ON session_question_criteria(rubric_criterion_id);

ALTER TABLE session_question_criteria
  DROP CONSTRAINT IF EXISTS chk_session_question_criteria_context_pack,
  DROP CONSTRAINT IF EXISTS chk_session_question_criteria_category_key,
  DROP CONSTRAINT IF EXISTS chk_session_question_criteria_weight,
  DROP CONSTRAINT IF EXISTS chk_session_question_criteria_display_order;

DROP INDEX IF EXISTS idx_session_question_criteria_criterion_code;

DO $$
DECLARE
  has_question_bank_cache BOOLEAN;
  has_session_question_cache BOOLEAN;
  violation_count INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'question_bank'
      AND column_name = 'competency_domains'
  ) INTO has_question_bank_cache;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'session_questions'
      AND column_name = 'competency_domains'
  ) INTO has_session_question_cache;

  IF has_question_bank_cache THEN
    EXECUTE $legacy$
      SELECT count(*)
      FROM question_bank
      WHERE deleted_at IS NULL
        AND cardinality(competency_domains) = 0
    $legacy$ INTO violation_count;

    IF violation_count > 0 THEN
      RAISE EXCEPTION 'Cannot backfill question_bank_criteria: % active question_bank rows have empty competency_domains', violation_count;
    END IF;

    EXECUTE $legacy$
      SELECT count(*)
      FROM question_bank qb
      CROSS JOIN LATERAL (
        SELECT count(*) AS total_count, count(DISTINCT code) AS distinct_count
        FROM unnest(qb.competency_domains) AS domain(code)
      ) counts
      WHERE qb.deleted_at IS NULL
        AND counts.total_count <> counts.distinct_count
    $legacy$ INTO violation_count;

    IF violation_count > 0 THEN
      RAISE EXCEPTION 'Cannot backfill question_bank_criteria: % active question_bank rows have duplicate competency_domains', violation_count;
    END IF;

    EXECUTE $legacy$
      SELECT count(*)
      FROM question_bank qb
      WHERE qb.deleted_at IS NULL
        AND EXISTS (
          SELECT 1
          FROM unnest(qb.competency_domains) AS domain(code)
          WHERE NOT EXISTS (
            SELECT 1
            FROM rubric_versions rv
            JOIN rubric_categories rc
              ON rc.rubric_version_id = rv.id
            JOIN rubric_criteria rcr
              ON rcr.rubric_category_id = rc.id
            WHERE rv.context_pack_id = qb.context_pack_id
              AND rv.status = 'active'
              AND rcr.code = domain.code
          )
        )
    $legacy$ INTO violation_count;

    IF violation_count > 0 THEN
      RAISE EXCEPTION 'Cannot backfill question_bank_criteria: % active question_bank rows have unmapped competency_domains', violation_count;
    END IF;

    EXECUTE $legacy$
      INSERT INTO question_bank_criteria (question_bank_id, rubric_criterion_id)
      SELECT qb.id, rcr.id
      FROM question_bank qb
      CROSS JOIN LATERAL unnest(qb.competency_domains) AS domain(code)
      JOIN rubric_versions rv
        ON rv.context_pack_id = qb.context_pack_id
       AND rv.status = 'active'
      JOIN rubric_categories rc
        ON rc.rubric_version_id = rv.id
      JOIN rubric_criteria rcr
        ON rcr.rubric_category_id = rc.id
       AND rcr.code = domain.code
      WHERE qb.deleted_at IS NULL
      ON CONFLICT DO NOTHING
    $legacy$;
  END IF;

  IF has_session_question_cache THEN
    EXECUTE $legacy$
      SELECT count(*)
      FROM session_questions
      WHERE cardinality(competency_domains) = 0
    $legacy$ INTO violation_count;

    IF violation_count > 0 THEN
      RAISE EXCEPTION 'Cannot backfill session_question_criteria: % session_questions rows have empty competency_domains', violation_count;
    END IF;

    EXECUTE $legacy$
      SELECT count(*)
      FROM session_questions sq
      CROSS JOIN LATERAL (
        SELECT count(*) AS total_count, count(DISTINCT code) AS distinct_count
        FROM unnest(sq.competency_domains) AS domain(code)
      ) counts
      WHERE counts.total_count <> counts.distinct_count
    $legacy$ INTO violation_count;

    IF violation_count > 0 THEN
      RAISE EXCEPTION 'Cannot backfill session_question_criteria: % session_questions rows have duplicate competency_domains', violation_count;
    END IF;

    EXECUTE $legacy$
      SELECT count(*)
      FROM session_questions sq
      JOIN interview_sessions s
        ON s.id = sq.session_id
      WHERE EXISTS (
        SELECT 1
        FROM unnest(sq.competency_domains) AS domain(code)
        WHERE NOT EXISTS (
          SELECT 1
          FROM rubric_criteria rcr
          JOIN rubric_categories rc
            ON rc.id = rcr.rubric_category_id
          WHERE rc.rubric_version_id = s.rubric_version_id
            AND rcr.code = domain.code
        )
      )
    $legacy$ INTO violation_count;

    IF violation_count > 0 THEN
      RAISE EXCEPTION 'Cannot backfill session_question_criteria: % session_questions rows have criteria missing from the session rubric version', violation_count;
    END IF;

    EXECUTE $legacy$
      WITH domain_rows AS (
        SELECT
          sq.id AS session_question_id,
          s.rubric_version_id,
          domain.code
        FROM session_questions sq
        JOIN interview_sessions s
          ON s.id = sq.session_id
        CROSS JOIN LATERAL unnest(sq.competency_domains)
          AS domain(code)
      )
      INSERT INTO session_question_criteria (
        session_question_id,
        rubric_criterion_id
      )
      SELECT
        domain_rows.session_question_id,
        rcr.id
      FROM domain_rows
      JOIN rubric_criteria rcr
        ON rcr.code = domain_rows.code
      JOIN rubric_categories rc
        ON rc.id = rcr.rubric_category_id
       AND rc.rubric_version_id = domain_rows.rubric_version_id
      ON CONFLICT DO NOTHING
    $legacy$;
  END IF;
END $$;

ALTER TABLE question_bank
  DROP COLUMN IF EXISTS competency_domains;

ALTER TABLE session_questions
  DROP COLUMN IF EXISTS competency_domains,
  DROP COLUMN IF EXISTS rubric_json;

ALTER TABLE session_question_criteria
  DROP COLUMN IF EXISTS context_pack_id_snapshot,
  DROP COLUMN IF EXISTS criterion_code,
  DROP COLUMN IF EXISTS criterion_name_snapshot,
  DROP COLUMN IF EXISTS category_key_snapshot,
  DROP COLUMN IF EXISTS weight_snapshot,
  DROP COLUMN IF EXISTS display_order_snapshot;

ALTER TABLE rubric_categories
  DROP COLUMN IF EXISTS context_pack_id;

ALTER TABLE rubric_criteria
  DROP COLUMN IF EXISTS active;

ALTER TABLE rubric_versions
  DROP CONSTRAINT IF EXISTS chk_rubric_versions_context_pack,
  DROP CONSTRAINT IF EXISTS chk_rubric_versions_status;
ALTER TABLE rubric_versions
  ADD CONSTRAINT chk_rubric_versions_context_pack CHECK (context_pack_id IN ('VN', 'Western')),
  ADD CONSTRAINT chk_rubric_versions_status CHECK (status IN ('active', 'archived'));

ALTER TABLE rubric_categories
  ALTER COLUMN rubric_version_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS rubric_categories_rubric_version_id_fkey;
ALTER TABLE rubric_categories
  ADD CONSTRAINT rubric_categories_rubric_version_id_fkey
  FOREIGN KEY (rubric_version_id)
  REFERENCES rubric_versions(id)
  ON DELETE CASCADE;

ALTER TABLE interview_sessions
  ALTER COLUMN rubric_version_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS interview_sessions_rubric_version_id_fkey;
ALTER TABLE interview_sessions
  ADD CONSTRAINT interview_sessions_rubric_version_id_fkey
  FOREIGN KEY (rubric_version_id)
  REFERENCES rubric_versions(id)
  ON DELETE RESTRICT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'session_question_criteria_pkey'
      AND conrelid = 'public.session_question_criteria'::regclass
  ) THEN
    ALTER TABLE session_question_criteria
      ADD CONSTRAINT session_question_criteria_pkey
      PRIMARY KEY (session_question_id, rubric_criterion_id);
  END IF;
END $$;

ALTER TABLE session_question_criteria
  ALTER COLUMN rubric_criterion_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS session_question_criteria_rubric_criterion_id_fkey;
ALTER TABLE session_question_criteria
  ADD CONSTRAINT session_question_criteria_rubric_criterion_id_fkey
  FOREIGN KEY (rubric_criterion_id)
  REFERENCES rubric_criteria(id)
  ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION validate_question_bank_criterion_version()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM question_bank qb
    JOIN rubric_criteria rcr
      ON rcr.id = NEW.rubric_criterion_id
    JOIN rubric_categories rc
      ON rc.id = rcr.rubric_category_id
    JOIN rubric_versions rv
      ON rv.id = rc.rubric_version_id
    WHERE qb.id = NEW.question_bank_id
      AND rv.context_pack_id = qb.context_pack_id
      AND rv.status = 'active'
  ) THEN
    RAISE EXCEPTION 'question_bank_criteria must reference an active criterion for the question context pack';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_question_bank_criteria_active_version ON question_bank_criteria;
CREATE TRIGGER trg_question_bank_criteria_active_version
BEFORE INSERT OR UPDATE ON question_bank_criteria
FOR EACH ROW EXECUTE FUNCTION validate_question_bank_criterion_version();

CREATE OR REPLACE FUNCTION validate_session_question_criterion_version()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM session_questions sq
    JOIN interview_sessions s
      ON s.id = sq.session_id
    JOIN rubric_criteria rcr
      ON rcr.id = NEW.rubric_criterion_id
    JOIN rubric_categories rc
      ON rc.id = rcr.rubric_category_id
    WHERE sq.id = NEW.session_question_id
      AND rc.rubric_version_id = s.rubric_version_id
  ) THEN
    RAISE EXCEPTION 'session_question_criteria must reference a criterion from the session rubric version';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_session_question_criteria_session_version ON session_question_criteria;
CREATE TRIGGER trg_session_question_criteria_session_version
BEFORE INSERT OR UPDATE ON session_question_criteria
FOR EACH ROW EXECUTE FUNCTION validate_session_question_criterion_version();

ALTER TABLE question_bank_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "question_bank_criteria: read active question bank"
  ON question_bank_criteria;
CREATE POLICY "question_bank_criteria: read active question bank"
  ON question_bank_criteria FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM question_bank qb
      WHERE qb.id = question_bank_id
        AND qb.deleted_at IS NULL
    )
  );

ALTER TABLE session_question_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_question_criteria: read own"
  ON session_question_criteria;
CREATE POLICY "session_question_criteria: read own"
  ON session_question_criteria FOR SELECT
  USING (
    session_question_id IN (
      SELECT sq.id
      FROM session_questions sq
      JOIN interview_sessions s ON s.id = sq.session_id
      JOIN saved_job_descriptions sjd ON sjd.id = s.saved_job_description_id
      WHERE sjd.user_id = auth.uid()
    )
  );

-- Step 2: Convert any remaining 'mixed' values (idempotent via WHERE)
UPDATE question_bank
SET session_type = (CASE
  WHEN EXISTS (
    SELECT 1
    FROM question_bank_criteria qbc
    JOIN rubric_criteria rcr
      ON rcr.id = qbc.rubric_criterion_id
    WHERE qbc.question_bank_id = question_bank.id
      AND rcr.code LIKE 'TD%'
  ) THEN 'technical'
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

-- Drop legacy dimension_scores from ai_feedbacks
ALTER TABLE public.ai_feedbacks DROP COLUMN IF EXISTS dimension_scores;

-- Update check constraint for session_reports to include session_competency_evaluation
ALTER TABLE public.session_reports DROP CONSTRAINT IF EXISTS chk_session_reports_report_type;
ALTER TABLE public.session_reports 
  ADD CONSTRAINT chk_session_reports_report_type 
  CHECK (report_type IN (
    'executive_summary',
    'comm_analysis',
    'competency_heatmap',
    'action_plan',
    'skipped_answers',
    'session_competency_evaluation'
  ));
