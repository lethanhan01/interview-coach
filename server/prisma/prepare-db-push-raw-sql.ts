import 'dotenv/config';
import { Client } from 'pg';
import {
  buildPgConnectionConfig,
  setClientDbTimeZone,
} from '../src/infrastructure/database/prisma/db-timezone';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL is required to prepare db push.');
}

const client = new Client(buildPgConnectionConfig(connectionString));

async function main() {
  await client.connect();
  await setClientDbTimeZone(client);
  try {
    await client.query(`
      ALTER TABLE user_answers
        DROP CONSTRAINT IF EXISTS user_answers_question_session_match_fkey;

      ALTER TABLE session_questions
        DROP CONSTRAINT IF EXISTS session_questions_id_session_id_key;

      DROP TABLE IF EXISTS question_usage;

      UPDATE interview_sessions SET context_pack_id = 'VN' WHERE context_pack_id = 'vn';
      UPDATE interview_sessions SET context_pack_id = 'Western' WHERE context_pack_id = 'western';
      UPDATE question_bank SET context_pack_id = 'VN' WHERE context_pack_id = 'vn';
      UPDATE question_bank SET context_pack_id = 'Western' WHERE context_pack_id = 'western';

      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS firstname TEXT,
        ADD COLUMN IF NOT EXISTS lastname TEXT;

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON e.enumtypid = t.oid
          WHERE t.typname = 'UserRole'
            AND e.enumlabel = 'user'
        ) THEN
          ALTER TYPE "UserRole" RENAME VALUE 'user' TO 'candidate';
        END IF;
      END $$;

      UPDATE users u
      SET
        firstname = CASE
          WHEN trimmed.full_name IS NULL OR trimmed.full_name = '' THEN NULL
          ELSE split_part(trimmed.full_name, ' ', 1)
        END,
        lastname = CASE
          WHEN trimmed.full_name IS NULL OR trimmed.full_name = '' THEN NULL
          WHEN position(' ' in trimmed.full_name) = 0 THEN NULL
          ELSE nullif(regexp_replace(trimmed.full_name, '^\\S+\\s*', ''), '')
        END
      FROM (
        SELECT
          user_id,
          btrim(full_name) AS full_name
        FROM user_profiles
        WHERE full_name IS NOT NULL
      ) trimmed
      WHERE u.id = trimmed.user_id;

      UPDATE users
      SET role = 'candidate'
      WHERE role::text = 'user';

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

      DO $$
      DECLARE
        invalid_contexts INTEGER;
        mismatch_count INTEGER;
        duplicate_count INTEGER;
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

        ALTER TABLE rubric_categories
          ADD COLUMN IF NOT EXISTS rubric_version_id UUID;

        ALTER TABLE interview_sessions
          ADD COLUMN IF NOT EXISTS rubric_version_id UUID;

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

        IF to_regclass('public.session_question_criteria') IS NOT NULL THEN
          ALTER TABLE session_question_criteria
            ADD COLUMN IF NOT EXISTS rubric_criterion_id UUID;

          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'session_question_criteria'
              AND column_name = 'criterion_code'
          ) THEN
            UPDATE session_question_criteria sqc
            SET rubric_criterion_id = rcr.id
            FROM session_questions sq
            JOIN interview_sessions s
              ON s.id = sq.session_id
            JOIN rubric_criteria rcr
              ON rcr.code = sqc.criterion_code
            JOIN rubric_categories rc
              ON rc.id = rcr.rubric_category_id
             AND rc.rubric_version_id = s.rubric_version_id
            WHERE sqc.session_question_id = sq.id
              AND sqc.rubric_criterion_id IS NULL;
          END IF;
        END IF;
      END $$;

      ALTER TABLE rubric_categories
        DROP CONSTRAINT IF EXISTS rubric_categories_context_category_key;

      ALTER TABLE rubric_criteria
        DROP CONSTRAINT IF EXISTS rubric_criteria_rubric_version_id_fkey,
        DROP CONSTRAINT IF EXISTS rubric_criteria_version_code_key,
        DROP CONSTRAINT IF EXISTS rubric_criteria_category_code_key;

      DROP INDEX IF EXISTS idx_rubric_criteria_version;
      DROP INDEX IF EXISTS rubric_criteria_version_code_key;

      ALTER TABLE interview_sessions
        DROP CONSTRAINT IF EXISTS interview_sessions_context_pack_id_fkey;

      ALTER TABLE question_bank
        DROP CONSTRAINT IF EXISTS question_bank_context_pack_id_fkey;

      ALTER TABLE rubric_categories
        DROP CONSTRAINT IF EXISTS rubric_categories_rubric_version_id_fkey;

      DROP TRIGGER IF EXISTS trg_rubric_criteria_version_code ON rubric_criteria;
      DROP TRIGGER IF EXISTS trg_question_bank_criteria_active_version ON question_bank_criteria;
      DROP TRIGGER IF EXISTS trg_session_question_criteria_session_version ON session_question_criteria;
      DROP FUNCTION IF EXISTS validate_rubric_criterion_version_code();
      DROP FUNCTION IF EXISTS validate_question_bank_criterion_version();
      DROP FUNCTION IF EXISTS validate_session_question_criterion_version();

      DO $$
      DECLARE
        missing_links INTEGER;
      BEGIN
        IF to_regclass('public.question_bank_criteria') IS NOT NULL THEN
          SELECT count(*) INTO missing_links
          FROM question_bank qb
          WHERE qb.deleted_at IS NULL
            AND NOT EXISTS (
              SELECT 1
              FROM question_bank_criteria qbc
              WHERE qbc.question_bank_id = qb.id
            );

          IF missing_links > 0 THEN
            RAISE EXCEPTION 'Cannot drop question_bank.competency_domains: % active question_bank rows have no criteria relation', missing_links;
          END IF;
        END IF;

        IF to_regclass('public.session_question_criteria') IS NOT NULL THEN
          SELECT count(*) INTO missing_links
          FROM session_questions sq
          WHERE NOT EXISTS (
            SELECT 1
            FROM session_question_criteria sqc
            WHERE sqc.session_question_id = sq.id
          );

          IF missing_links > 0 THEN
            RAISE EXCEPTION 'Cannot drop session_questions.competency_domains: % session_questions rows have no criteria snapshot relation', missing_links;
          END IF;

          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'session_question_criteria'
              AND column_name = 'rubric_criterion_id'
          ) THEN
            SELECT count(*) INTO missing_links
            FROM session_question_criteria
            WHERE rubric_criterion_id IS NULL;

            IF missing_links > 0 THEN
              RAISE EXCEPTION 'Cannot require session_question_criteria.rubric_criterion_id: % rows could not be mapped from the locked session rubric version', missing_links;
            END IF;
          END IF;
        END IF;
      END $$;

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'competency_domain'
        ) THEN
          ALTER TABLE question_bank DROP COLUMN competency_domain;
        END IF;
      END $$;

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'session_questions'
            AND column_name = 'competency_domain'
        ) THEN
          ALTER TABLE session_questions DROP COLUMN competency_domain;
        END IF;
      END $$;

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
    `);
    console.log(
      'Raw SQL constraints and retired schema objects prepared for Prisma db push.',
    );
  } finally {
    await client.end();
  }
}

void main().catch(async (error: unknown) => {
  console.error(
    'Failed to prepare raw SQL constraints for db push:',
    error instanceof Error ? error.message : String(error),
  );
  await client.end().catch(() => undefined);
  process.exitCode = 1;
});
