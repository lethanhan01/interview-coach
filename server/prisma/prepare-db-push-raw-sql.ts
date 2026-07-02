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
    `);
    console.log('Raw SQL constraints prepared for Prisma db push.');
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
