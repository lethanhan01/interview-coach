-- Only changes constraints on public.users. No row data is modified.
BEGIN;

LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE
  null_passwords INTEGER;
  incomplete_candidates INTEGER;
BEGIN
  SELECT count(*) INTO null_passwords
  FROM public.users
  WHERE password_hash IS NULL;

  SELECT count(*) INTO incomplete_candidates
  FROM public.users
  WHERE role = 'candidate'
    AND (
      first_name IS NULL OR btrim(first_name) = ''
      OR last_name IS NULL OR btrim(last_name) = ''
    );

  IF null_passwords > 0 OR incomplete_candidates > 0 THEN
    RAISE EXCEPTION
      'Cannot enforce user constraints: null_passwords=%, incomplete_candidates=%',
      null_passwords, incomplete_candidates;
  END IF;
END $$;

ALTER TABLE public.users
  ALTER COLUMN password_hash SET NOT NULL;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS chk_users_candidate_names;

ALTER TABLE public.users
  ADD CONSTRAINT chk_users_candidate_names
  CHECK (
    role <> 'candidate'
    OR (
      first_name IS NOT NULL AND btrim(first_name) <> ''
      AND last_name IS NOT NULL AND btrim(last_name) <> ''
    )
  );

COMMIT;
