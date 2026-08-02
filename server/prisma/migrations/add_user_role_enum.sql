-- Migration: Add UserRole enum and update users table
-- Handles: existing chk_users_role TEXT constraint, 'candidate' data, RLS policies

-- Step 1: Ensure UserRole enum exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
  END IF;
END
$$;

-- Step 2: Drop old check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;

-- Step 3: Update 'candidate' rows to 'user' (the new valid value)
UPDATE users SET role = 'user' WHERE role = 'candidate' OR role NOT IN ('user', 'admin');

-- Step 4: Drop RLS policies that reference role column (needed for ALTER TYPE)
DROP POLICY IF EXISTS "users: admin read all" ON users;
DROP POLICY IF EXISTS "users: admin update status" ON users;

-- Step 5: Drop default before changing column type
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Step 6: Change column type from text to the UserRole enum
ALTER TABLE users
  ALTER COLUMN role TYPE "UserRole" USING role::"UserRole";

-- Step 7: Restore default
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'::"UserRole";

-- The application now authenticates through the backend and Prisma. Do not
-- recreate auth.uid()-based policies for public.users.
