/**
 * Read-only verification for Phase 2 (pgvector semantic retrieval).
 *
 * Checks:
 *  - extension `vector` installed with version >= 0.8.1 (first release supporting PG18)
 *  - column `question_bank.embedding` exists with type `vector(1024)` and is nullable
 *
 * Also prints embedding coverage (informational, never fails the run).
 * Only executes SELECT statements — safe to run against the shared DB.
 */
import 'dotenv/config';
import { Client } from 'pg';
import {
  buildPgConnectionConfig,
  setClientDbTimeZone,
} from '../../src/infrastructure/database/prisma/db-timezone';

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const MIN_PGVECTOR_VERSION = '0.8.1';
const EXPECTED_COLUMN_TYPE = 'vector(1024)';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL is required to verify pgvector.');
}

const client = new Client(buildPgConnectionConfig(connectionString));

async function main() {
  await client.connect();
  await setClientDbTimeZone(client);

  const results: CheckResult[] = [
    await checkExtension(),
    await checkEmbeddingColumn(),
  ];

  const failed = results.filter((result) => !result.ok);
  console.log(
    `pgvector verify: ${results.length - failed.length}/${results.length} passed`,
  );
  for (const result of results) {
    console.log(
      `${result.ok ? 'PASS' : 'FAIL'} ${result.name} ${result.detail}`,
    );
  }

  if (results[1]?.ok) {
    await printCoverage();
  }

  await client.end();
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

async function checkExtension(): Promise<CheckResult> {
  const result = await client.query<{ extversion: string }>(
    `SELECT extversion FROM pg_extension WHERE extname = 'vector'`,
  );
  const version = result.rows[0]?.extversion;
  if (!version) {
    return { name: 'extension:vector', ok: false, detail: 'missing' };
  }
  const ok = compareVersions(version, MIN_PGVECTOR_VERSION) >= 0;
  return {
    name: 'extension:vector',
    ok,
    detail: `version=${version} (min ${MIN_PGVECTOR_VERSION})`,
  };
}

async function checkEmbeddingColumn(): Promise<CheckResult> {
  const result = await client.query<{ type: string; not_null: boolean }>(
    `SELECT format_type(a.atttypid, a.atttypmod) AS type,
            a.attnotnull AS not_null
     FROM pg_attribute a
     WHERE a.attrelid = to_regclass('public.question_bank')
       AND a.attname = 'embedding'
       AND NOT a.attisdropped`,
  );
  const row = result.rows[0];
  if (!row) {
    return {
      name: 'column:question_bank.embedding',
      ok: false,
      detail: 'missing',
    };
  }
  const ok = row.type === EXPECTED_COLUMN_TYPE && !row.not_null;
  return {
    name: 'column:question_bank.embedding',
    ok,
    detail: `type=${row.type} nullable=${!row.not_null} (expected ${EXPECTED_COLUMN_TYPE}, nullable)`,
  };
}

async function printCoverage() {
  const result = await client.query<{ active: number; missing: number }>(
    `SELECT count(*)::int AS active,
            count(*) FILTER (WHERE embedding IS NULL)::int AS missing
     FROM question_bank
     WHERE deleted_at IS NULL`,
  );
  const row = result.rows[0];
  console.log(
    `INFO coverage active=${row?.active ?? 0} missing_embedding=${row?.missing ?? 0}`,
  );
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const pb = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

void main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.stack : String(error));
  await client.end().catch(() => undefined);
  process.exitCode = 1;
});
