const TRANSIENT_PRISMA_CODES = new Set([
  'P1001',
  'P1002',
  'P1008',
  'P1017',
  'P2024',
  'P2028',
]);
const PG_CONNECTION_DROP_PATTERNS = [
  'connection terminated due to connection timeout',
  'connection terminated unexpectedly',
  'server closed the connection unexpectedly',
  "can't reach database server",
  'client has encountered a connection error and is not queryable',
];
const TRANSIENT_MESSAGE_PATTERNS = [
  ...PG_CONNECTION_DROP_PATTERNS,
  'connection timeout',
  'connection timed out',
  'connect etimedout',
  'timeout expired',
  'econnreset',
  'econnrefused',
  'eacces',
  'enotfound',
  'eai_again',
  'could not connect',
];
export function isTransientPrismaConnectionError(error: unknown): boolean {
  return collectErrorSignals(error).some((signal) => {
    const normalized = signal.toLowerCase();
    return (
      TRANSIENT_PRISMA_CODES.has(signal) ||
      TRANSIENT_MESSAGE_PATTERNS.some((pattern) => normalized.includes(pattern))
    );
  });
}
export function isPgConnectionDropError(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;
  return collectErrorSignals(error).some((signal) => {
    const normalized = signal.toLowerCase();
    return (
      TRANSIENT_PRISMA_CODES.has(signal) ||
      PG_CONNECTION_DROP_PATTERNS.some((pattern) =>
        normalized.includes(pattern),
      )
    );
  });
}
export function formatDatabaseStartupError(error: unknown): string {
  const signals = collectErrorSignals(error);
  return signals.length > 0 ? signals.join(' | ') : String(error);
}
function collectErrorSignals(
  error: unknown,
  seen = new Set<unknown>(),
): string[] {
  if (error === null || error === undefined || seen.has(error)) return [];
  seen.add(error);
  if (typeof error === 'string') return [error];
  if (typeof error !== 'object') return [formatNonObjectSignal(error)];
  const record = error as Record<string, unknown>;
  const signals: string[] = [];
  if (typeof record['code'] === 'string') signals.push(record['code']);
  if (typeof record['message'] === 'string') signals.push(record['message']);
  if (record['cause'])
    signals.push(...collectErrorSignals(record['cause'], seen));
  return signals;
}
function formatNonObjectSignal(error: unknown): string {
  if (
    typeof error === 'number' ||
    typeof error === 'boolean' ||
    typeof error === 'bigint'
  )
    return error.toString();
  if (typeof error === 'function') return error.name || 'anonymous function';
  if (typeof error === 'symbol') return error.description ?? error.toString();
  return 'unknown non-object value';
}
