-- Run after prisma db push. Keep this file limited to cleanup that Prisma cannot
-- express directly or that needs to survive reruns during local sync.

ALTER TABLE public.users
  DROP COLUMN IF EXISTS password_updated_at,
  DROP COLUMN IF EXISTS password_reset_token_hash,
  DROP COLUMN IF EXISTS password_reset_expires_at;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE public.users
  ADD CONSTRAINT chk_users_role
  CHECK (role IN ('candidate', 'admin'));
