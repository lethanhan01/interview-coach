import 'dotenv/config';
import { Client } from 'pg';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL is required to prepare db push.');
}

const client = new Client({ connectionString });

async function main() {
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE user_answers
        DROP CONSTRAINT IF EXISTS user_answers_question_session_match_fkey;

      ALTER TABLE session_questions
        DROP CONSTRAINT IF EXISTS session_questions_id_session_id_key;

      DROP TABLE IF EXISTS question_usage;

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
