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
