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
EXCEPTION
  WHEN duplicate_object THEN NULL;
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
