import 'dotenv/config';
import { Client } from 'pg';
import {
  quotePostgresLiteral,
  resolveDbTimeZone,
} from '../src/prisma/db-timezone';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DIRECT_URL or DATABASE_URL is required to set DB timezone.');
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function main() {
  const timeZone = resolveDbTimeZone();
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const context = await client.query<{
      database_name: string;
      role_name: string;
    }>(
      `SELECT current_database() AS database_name, current_user AS role_name`,
    );
    const { database_name: databaseName, role_name: roleName } =
      context.rows[0] ?? {};

    if (!databaseName || !roleName) {
      throw new Error('Unable to resolve current database or role.');
    }

    await client.query(
      `ALTER DATABASE ${quoteIdentifier(databaseName)} SET timezone TO ${quotePostgresLiteral(timeZone)}`,
    );
    await client.query(
      `ALTER ROLE ${quoteIdentifier(roleName)} SET timezone TO ${quotePostgresLiteral(timeZone)}`,
    );

    console.log(
      `DB timezone default set: database=${databaseName} role=${roleName} timezone=${timeZone}`,
    );
  } finally {
    await client.end();
  }

  const verifyClient = new Client({ connectionString });
  await verifyClient.connect();
  try {
    const result = await verifyClient.query<{ timezone: string }>(
      `SELECT current_setting('TimeZone') AS timezone`,
    );
    const actual = result.rows[0]?.timezone;
    if (actual !== timeZone) {
      const persisted = await hasPersistedTimeZoneSetting(
        verifyClient,
        timeZone,
      );
      if (!persisted) {
        throw new Error(
          `DB timezone verification failed: expected ${timeZone}, got ${actual}`,
        );
      }
      console.warn(
        `DB timezone setting was persisted, but this provider returned ${actual} for a new session. The app and DB scripts still run SET TIME ZONE per connection.`,
      );
      return;
    }
    console.log(`DB timezone verified on a new connection: ${actual}`);
  } finally {
    await verifyClient.end();
  }
}

async function hasPersistedTimeZoneSetting(
  client: Client,
  timeZone: string,
): Promise<boolean> {
  const result = await client.query<{ found: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM pg_db_role_setting
        WHERE ${quotePostgresLiteral(`TimeZone=${timeZone}`)} = ANY(setconfig)
      ) AS found
    `,
  );
  return result.rows[0]?.found === true;
}

void main().catch((error: unknown) => {
  console.error(
    'Failed to set DB timezone:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
