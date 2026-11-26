const REDIS_CONNECTION_ERROR_PATTERNS = [
  'connection is closed',
  'reached the max retries per request limit',
  "stream isn't writeable",
  'enableofflinequeue options is false',
];

function collectRedisSignals(
  value: unknown,
  seen = new Set<unknown>(),
): string[] {
  if (value === null || value === undefined || seen.has(value)) return [];
  seen.add(value);
  if (typeof value === 'string') return [value];
  if (typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const signals: string[] = [];
  if (typeof record['message'] === 'string') signals.push(record['message']);
  if (record['cause']) {
    signals.push(...collectRedisSignals(record['cause'], seen));
  }
  return signals;
}

export function isTransientRedisError(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;
  if (error.name === 'ReplyError') return false;
  if (error.name === 'MaxRetriesPerRequestError') return true;
  return collectRedisSignals(error).some((signal) => {
    const normalized = signal.toLowerCase();
    return REDIS_CONNECTION_ERROR_PATTERNS.some((pattern) =>
      normalized.includes(pattern),
    );
  });
}
