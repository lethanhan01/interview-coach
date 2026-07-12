import 'dotenv/config';
import { Client } from 'pg';
import {
  buildPgConnectionConfig,
  setClientDbTimeZone,
} from '../src/prisma/db-timezone';

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

      DO $$
      DECLARE
        invalid_contexts INTEGER;
        active_contexts INTEGER;
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
          RAISE EXCEPTION 'Cannot simplify context packs: found % invalid context_pack_id values', invalid_contexts;
        END IF;

        IF to_regclass('public.rubric_versions') IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name = 'rubric_categories'
               AND column_name = 'rubric_version_id'
           ) THEN
          SELECT count(*) INTO active_contexts
          FROM (
            SELECT context_pack_id
            FROM rubric_versions
            WHERE status::text = 'active'
              AND context_pack_id IN ('VN', 'Western')
            GROUP BY context_pack_id
            HAVING count(*) = 1
          ) active;

          IF active_contexts <> 2 THEN
            RAISE EXCEPTION 'Cannot simplify rubric versions: VN and Western must each have exactly one active rubric version';
          END IF;

          IF EXISTS (
            SELECT 1
            FROM rubric_versions rv
            WHERE rv.status::text = 'active'
              AND rv.context_pack_id IN ('VN', 'Western')
              AND (
                SELECT count(*)
                FROM rubric_categories rc
                WHERE rc.rubric_version_id = rv.id
                  AND rc.category_key IN ('behavioral', 'technical')
              ) <> 2
          ) THEN
            RAISE EXCEPTION 'Cannot simplify rubric versions: active rubric versions must have behavioral and technical categories';
          END IF;

          IF EXISTS (
            SELECT 1
            FROM rubric_versions rv
            WHERE rv.status::text = 'active'
              AND rv.context_pack_id IN ('VN', 'Western')
              AND NOT EXISTS (
                SELECT 1
                FROM rubric_criteria rcr
                WHERE rcr.rubric_version_id = rv.id
                  AND rcr.active = true
              )
          ) THEN
            RAISE EXCEPTION 'Cannot simplify rubric versions: active rubric versions must have active criteria';
          END IF;

          IF EXISTS (
            SELECT 1
            FROM question_bank qb
            JOIN rubric_versions rv
              ON rv.context_pack_id = qb.context_pack_id
             AND rv.status::text = 'active'
            WHERE qb.deleted_at IS NULL
              AND EXISTS (
                SELECT 1
                FROM unnest(qb.competency_domains) AS domain(code)
                WHERE NOT EXISTS (
                  SELECT 1
                  FROM rubric_criteria rcr
                  WHERE rcr.rubric_version_id = rv.id
                    AND rcr.code = domain.code
                    AND rcr.active = true
                )
              )
          ) THEN
            RAISE EXCEPTION 'Cannot simplify rubric versions: question_bank.competency_domains must match active criteria';
          END IF;

          ALTER TABLE rubric_categories
            ADD COLUMN IF NOT EXISTS context_pack_id TEXT;

          UPDATE rubric_categories rc
          SET context_pack_id = rv.context_pack_id
          FROM rubric_versions rv
          WHERE rc.rubric_version_id = rv.id
            AND rv.status::text = 'active'
            AND rc.context_pack_id IS NULL;
        END IF;
      END $$;

      ALTER TABLE interview_sessions
        DROP CONSTRAINT IF EXISTS interview_sessions_context_pack_id_fkey,
        DROP CONSTRAINT IF EXISTS interview_sessions_rubric_version_id_fkey;

      ALTER TABLE question_bank
        DROP CONSTRAINT IF EXISTS question_bank_context_pack_id_fkey;

      ALTER TABLE rubric_categories
        DROP CONSTRAINT IF EXISTS rubric_categories_rubric_version_id_fkey,
        DROP CONSTRAINT IF EXISTS rubric_categories_version_category_key;

      ALTER TABLE rubric_criteria
        DROP CONSTRAINT IF EXISTS rubric_criteria_rubric_version_id_fkey,
        DROP CONSTRAINT IF EXISTS rubric_criteria_version_code_key;

      DROP INDEX IF EXISTS idx_rubric_versions_context_pack;
      DROP INDEX IF EXISTS idx_rubric_versions_one_active_per_context_pack;
      DROP INDEX IF EXISTS idx_rubric_categories_version;
      DROP INDEX IF EXISTS idx_rubric_criteria_version;
      DROP INDEX IF EXISTS idx_interview_sessions_rubric_version;

      ALTER TABLE question_bank
        ADD COLUMN IF NOT EXISTS competency_domains TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'competency_domain'
        ) THEN
          UPDATE question_bank
          SET competency_domains = ARRAY[competency_domain]
          WHERE cardinality(competency_domains) = 0
            AND competency_domain IS NOT NULL;
        END IF;
      END $$;

      ALTER TABLE session_questions
        ADD COLUMN IF NOT EXISTS competency_domains TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'session_questions'
            AND column_name = 'competency_domain'
        ) THEN
          UPDATE session_questions
          SET competency_domains = ARRAY[competency_domain]
          WHERE cardinality(competency_domains) = 0
            AND competency_domain IS NOT NULL;
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
    `);
    console.log('Raw SQL constraints and retired schema objects prepared for Prisma db push.');
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
