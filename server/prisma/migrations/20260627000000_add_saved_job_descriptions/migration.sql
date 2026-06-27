CREATE TABLE IF NOT EXISTS saved_job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_website TEXT,
  job_title TEXT NOT NULL,
  headcount TEXT,
  location TEXT,
  requirements TEXT NOT NULL,
  job_content TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  benefits TEXT,
  salary TEXT,
  bonus TEXT,
  last_used_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS saved_job_description_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'interview_sessions'::regclass
      AND conname = 'interview_sessions_saved_job_description_id_fkey'
  ) THEN
    ALTER TABLE interview_sessions
      ADD CONSTRAINT interview_sessions_saved_job_description_id_fkey
      FOREIGN KEY (saved_job_description_id)
      REFERENCES saved_job_descriptions(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_saved_job_descriptions_user_updated
  ON saved_job_descriptions(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_job_descriptions_user_company_title
  ON saved_job_descriptions(user_id, company_name, job_title);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_saved_jd
  ON interview_sessions(saved_job_description_id);

ALTER TABLE saved_job_descriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'saved_job_descriptions'
      AND policyname = 'saved_job_descriptions: read own'
  ) THEN
    CREATE POLICY "saved_job_descriptions: read own"
      ON saved_job_descriptions FOR SELECT
      USING (user_id = auth.uid() AND deleted_at IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'saved_job_descriptions'
      AND policyname = 'saved_job_descriptions: insert own'
  ) THEN
    CREATE POLICY "saved_job_descriptions: insert own"
      ON saved_job_descriptions FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'saved_job_descriptions'
      AND policyname = 'saved_job_descriptions: update own'
  ) THEN
    CREATE POLICY "saved_job_descriptions: update own"
      ON saved_job_descriptions FOR UPDATE
      USING (user_id = auth.uid());
  END IF;
END
$$;
