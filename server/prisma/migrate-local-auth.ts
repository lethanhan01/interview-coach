/**
 * Local migration helper for legacy auth/user-name data.
 * Run before schema push when existing rows still have `user_profiles.full_name`
 * or need the verification-code table created without dropping legacy columns.
 */
import { Client } from 'pg';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const client = new Client({ connectionString: process.env.DIRECT_URL });

const statements = [
  `ALTER TABLE users
    ADD COLUMN IF NOT EXISTS firstname TEXT,
    ADD COLUMN IF NOT EXISTS lastname TEXT`,
  `UPDATE users u
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
     SELECT user_id, btrim(full_name) AS full_name
     FROM user_profiles
     WHERE full_name IS NOT NULL
   ) trimmed
   WHERE u.id = trimmed.user_id`,
  `CREATE TABLE IF NOT EXISTS user_verification_codes (
     id UUID NOT NULL DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL,
     purpose TEXT NOT NULL,
     code_hash TEXT NOT NULL,
     expires_at TIMESTAMPTZ(6) NOT NULL,
     created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
     CONSTRAINT user_verification_codes_pkey PRIMARY KEY (id),
     CONSTRAINT user_verification_codes_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     CONSTRAINT user_verification_codes_user_purpose_key UNIQUE (user_id, purpose)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_user_verification_codes_expires_at
   ON user_verification_codes (expires_at)`,
];

async function main() {
  await client.connect();
  try {
    for (const stmt of statements) {
      await client.query(stmt);
    }
  } finally {
    await client.end();
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Failed to migrate local auth data:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
