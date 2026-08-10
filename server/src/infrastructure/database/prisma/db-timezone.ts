import type { ClientConfig, Client } from 'pg';
export const DEFAULT_DB_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const SAFE_TIME_ZONE_PATTERN = /^[A-Za-z0-9_/+.-]+$/;
export function resolveDbTimeZone(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const timeZone = env.DB_TIMEZONE?.trim() || DEFAULT_DB_TIME_ZONE;
  return validateDbTimeZone(timeZone);
}
export function validateDbTimeZone(timeZone: string): string {
  if (!SAFE_TIME_ZONE_PATTERN.test(timeZone))
    throw new Error(`Unsafe DB timezone value: ${timeZone}`);
  return timeZone;
}
export function buildPgConnectionConfig(
  connectionString: string | undefined,
  timeZone = resolveDbTimeZone(),
): ClientConfig {
  if (!connectionString)
    throw new Error('DATABASE_URL or DIRECT_URL is required.');
  return {
    connectionString,
    options: `-c TimeZone=${validateDbTimeZone(timeZone)}`,
  };
}
export async function setClientDbTimeZone(
  client: Pick<Client, 'query'>,
  timeZone = resolveDbTimeZone(),
): Promise<void> {
  await client.query(`SET TIME ZONE ${quotePostgresLiteral(timeZone)}`);
}
export function quotePostgresLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
