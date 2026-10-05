import { Injectable, LoggerService } from '@nestjs/common';
import { RequestContext } from '../context/request-context';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'authorization',
  'secret',
  'creditcard',
]);

export function redactSensitiveData(data: unknown, seen = new WeakSet()): unknown {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (seen.has(data as object)) {
    return '[CIRCULAR]';
  }
  seen.add(data as object);

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, seen));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSensitiveData(value, seen);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

@Injectable()
export class AppLogger implements LoggerService {
  private formatLog(level: string, message: unknown, context?: string, meta?: unknown): string {
    const store = RequestContext.get();
    const correlationId = store?.correlationId ?? 'no-correlation-id';
    const userId = store?.userId;
    const durationMs = store?.startTime ? Date.now() - store.startTime : undefined;
    const timestamp = new Date().toISOString();
    const isProd = process.env.NODE_ENV === 'production';

    const cleanMeta = meta ? redactSensitiveData(meta) : undefined;
    const cleanMessage =
      typeof message === 'object' ? redactSensitiveData(message) : message;

    if (isProd) {
      return JSON.stringify({
        timestamp,
        level,
        context: context ?? 'Application',
        correlationId,
        ...(userId ? { userId } : {}),
        ...(durationMs !== undefined ? { durationMs } : {}),
        message: cleanMessage,
        meta: cleanMeta,
      });
    }

    // Dev format: human-readable and colorized prefix
    const ctx = context ? `[${context}] ` : '';
    const trace =
      correlationId !== 'no-correlation-id'
        ? `[trace:${correlationId.slice(0, 8)}] `
        : '';
    const formattedMsg =
      typeof cleanMessage === 'string'
        ? cleanMessage
        : JSON.stringify(cleanMessage);

    return `${timestamp} ${level.toUpperCase().padEnd(5)} ${trace}${ctx}${formattedMsg}`;
  }

  log(message: unknown, context?: string, meta?: unknown) {
    console.log(this.formatLog('info', message, context, meta));
  }

  error(message: unknown, trace?: string, context?: string, meta?: unknown) {
    const store = RequestContext.get();
    const correlationId = store?.correlationId ?? 'no-correlation-id';
    const userId = store?.userId;
    const durationMs = store?.startTime ? Date.now() - store.startTime : undefined;
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          context: context ?? 'Application',
          correlationId,
          ...(userId ? { userId } : {}),
          ...(durationMs !== undefined ? { durationMs } : {}),
          message:
            typeof message === 'object' ? redactSensitiveData(message) : message,
          stack: trace,
          meta: meta ? redactSensitiveData(meta) : undefined,
        }),
      );
    } else {
      console.error(this.formatLog('error', message, context, meta));
      if (trace) {
        console.error(trace);
      }
    }
  }

  warn(message: unknown, context?: string, meta?: unknown) {
    console.warn(this.formatLog('warn', message, context, meta));
  }

  debug(message: unknown, context?: string, meta?: unknown) {
    if (process.env.NODE_ENV === 'production') return;
    console.debug(this.formatLog('debug', message, context, meta));
  }

  verbose(message: unknown, context?: string, meta?: unknown) {
    if (process.env.NODE_ENV === 'production') return;
    console.log(this.formatLog('verbose', message, context, meta));
  }
}
