import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import {
  buildPgConnectionConfig,
  setClientDbTimeZone,
} from '../src/infrastructure/database/prisma/db-timezone';

interface DuplicateStats {
  duplicateGroups: number;
  duplicateRows: number;
}

async function getDuplicateStats(client: Client): Promise<DuplicateStats> {
  const result = await client.query<{
    duplicate_groups: number;
    duplicate_rows: number;
  }>(`
    SELECT
      COUNT(*)::INTEGER AS duplicate_groups,
      COALESCE(SUM(answer_count - 1), 0)::INTEGER AS duplicate_rows
    FROM (
      SELECT COUNT(*) AS answer_count
      FROM user_answers
      GROUP BY session_id, question_id
      HAVING COUNT(*) > 1
    ) duplicate_groups
  `);

  return {
    duplicateGroups: result.rows[0]?.duplicate_groups ?? 0,
    duplicateRows: result.rows[0]?.duplicate_rows ?? 0,
  };
}

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DIRECT_URL or DATABASE_URL is required');
  }

  const client = new Client(buildPgConnectionConfig(connectionString));
  await client.connect();
  await setClientDbTimeZone(client);

  try {
    const tableResult = await client.query<{ table_name: string | null }>(
      `SELECT to_regclass('public.user_answers')::TEXT AS table_name`,
    );
    if (!tableResult.rows[0]?.table_name) {
      console.log(
        'user_answers does not exist yet; Prisma db push will create it.',
      );
      return;
    }

    const before = await getDuplicateStats(client);
    const migrationSql = readFileSync(
      join(process.cwd(), 'prisma', 'deduplicate-user-answers.sql'),
      'utf8',
    );

    await client.query(migrationSql);

    const after = await getDuplicateStats(client);
    console.log(
      `user_answers prepared: ${before.duplicateRows} duplicate rows across ` +
        `${before.duplicateGroups} groups; ${after.duplicateRows} remain.`,
    );
  } finally {
    await client.end();
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Failed to prepare user_answers uniqueness:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
