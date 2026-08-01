-- Run after prisma db push. This migration deliberately does not read or write
-- Supabase's auth schema; public.users is the application's account source.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountStatus') THEN
    CREATE TYPE "AccountStatus" AS ENUM ('active', 'locked', 'deleted', 'password_reset_required');
  END IF;
END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS password_reset_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

DO $$
DECLARE current_type TEXT;
BEGIN
  SELECT udt_name INTO current_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status';
  IF current_type <> 'AccountStatus' THEN
    ALTER TABLE public.users ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE public.users
      ALTER COLUMN status TYPE "AccountStatus"
      USING CASE status::text
        WHEN 'active' THEN 'active'::"AccountStatus"
        WHEN 'locked' THEN 'locked'::"AccountStatus"
        WHEN 'deleted' THEN 'deleted'::"AccountStatus"
        ELSE 'password_reset_required'::"AccountStatus"
      END;
    ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'active'::"AccountStatus";
  END IF;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

DROP POLICY IF EXISTS "users: read own" ON public.users;
DROP POLICY IF EXISTS "users: update own" ON public.users;
DROP POLICY IF EXISTS "users: admin read all" ON public.users;
DROP POLICY IF EXISTS "users: admin update status" ON public.users;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

UPDATE public.users
SET status = 'password_reset_required'::"AccountStatus",
    password_hash = NULL,
    password_updated_at = NULL,
    token_version = token_version + 1
WHERE password_hash IS NULL
  AND status NOT IN ('deleted'::"AccountStatus", 'locked'::"AccountStatus");
