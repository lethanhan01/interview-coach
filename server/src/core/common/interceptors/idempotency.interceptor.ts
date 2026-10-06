import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Optional,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Observable, of, throwError } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { InterviewAIException } from '../exceptions/interview-ai.exception';
import { ErrorCode } from '../exceptions/error-code.enum';
import {
  IDEMPOTENT_METADATA_KEY,
  IdempotentOptions,
} from '../decorators/idempotent.decorator';
import type { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { id?: string; user?: { id?: string } };
  file?: {
    originalname?: string;
    size?: number;
    mimetype?: string;
    buffer?: Buffer;
  };
}

export const IDEMPOTENCY_REDIS_CLIENT = 'IDEMPOTENCY_REDIS_CLIENT';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const DEFAULT_LOCK_TTL_SECONDS = 60; // In-progress lock release window
const DEFAULT_CACHE_TTL_SECONDS = 86_400; // 24 hours
const MAX_KEY_LENGTH = 128;

interface StoredIdempotencyRecord {
  status: 'IN_PROGRESS' | 'COMPLETED';
  startedAt?: number;
  completedAt?: number;
  statusCode?: number;
  body?: unknown;
  payloadHash?: string;
}

@Injectable()
export class IdempotencyInterceptor
  implements NestInterceptor, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private redisClient?: Redis;
  private isInternalRedis = false;

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    @Optional()
    @Inject(IDEMPOTENCY_REDIS_CLIENT)
    customRedis?: Redis,
  ) {
    if (customRedis) {
      this.redisClient = customRedis;
      this.isInternalRedis = false;
    }
  }

  onModuleInit() {
    if (this.redisClient) {
      return;
    }

    try {
      const host = this.config.get<string>('REDIS_HOST') || 'localhost';
      const port = Number(this.config.get<number>('REDIS_PORT')) || 6379;
      const password = this.config.get<string>('REDIS_PASSWORD') || undefined;

      this.redisClient = new Redis({
        host,
        port,
        ...(password ? { password } : {}),
        lazyConnect: true,
        connectTimeout: 2_000,
        commandTimeout: 2_000,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
      });

      this.isInternalRedis = true;

      this.redisClient.on('error', (err: Error) => {
        this.logger.warn(
          `Idempotency Redis connection warning: ${err.message}`,
        );
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to initialize Redis client for IdempotencyInterceptor: ${msg}`,
      );
    }
  }

  onModuleDestroy() {
    if (this.isInternalRedis && this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    const req = http.getRequest<AuthenticatedRequest>();
    const res = http.getResponse<Response>();

    if (!req || !req.method) {
      return next.handle();
    }

    const method = req.method.toUpperCase();
    const isMutation = MUTATION_METHODS.has(method);

    const options = this.reflector.getAllAndOverride<IdempotentOptions>(
      IDEMPOTENT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Extract Idempotency Key from headers
    const rawKey =
      req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
    const idempotencyKey =
      typeof rawKey === 'string'
        ? rawKey.trim()
        : Array.isArray(rawKey) && rawKey[0]
          ? rawKey[0].trim()
          : undefined;

    // Check if endpoint strictly requires Idempotency-Key
    if (!idempotencyKey) {
      if (options?.required) {
        throw new InterviewAIException(
          ErrorCode.BAD_REQUEST,
          HttpStatus.BAD_REQUEST,
          'Idempotency-Key header is required for this operation',
        );
      }
      return next.handle();
    }

    // Only process mutations or endpoints explicitly marked with @Idempotent
    if (!isMutation && !options) {
      return next.handle();
    }

    // Validate key format and bounds
    if (idempotencyKey.length === 0 || idempotencyKey.length > MAX_KEY_LENGTH) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        `Invalid Idempotency-Key. Key length must be between 1 and ${MAX_KEY_LENGTH} characters.`,
      );
    }

    // Fail-open check: if Redis is unavailable, bypass idempotency check gracefully
    if (!this.redisClient) {
      this.logger.warn('Idempotency bypassed: Redis client is not initialized');
      return next.handle();
    }

    const userId =
      req.user?.id ||
      (typeof req.user === 'object' &&
        req.user !== null &&
        req.user.user?.id) ||
      'anon';
    const rawUrl = req.originalUrl || req.url || req.baseUrl || req.path || '';
    const path = rawUrl.split('?')[0];
    const redisKey = `idempotency:${userId}:${method}:${path}:${idempotencyKey}`;
    const payloadHash = this.computePayloadHash(req.body, req.file);

    const lockTtlSeconds =
      Number(this.config.get('IDEMPOTENCY_LOCK_TTL_SECONDS')) ||
      DEFAULT_LOCK_TTL_SECONDS;
    const cacheTtlSeconds =
      options?.ttlSeconds ??
      (Number(this.config.get('IDEMPOTENCY_CACHE_TTL_SECONDS')) ||
        DEFAULT_CACHE_TTL_SECONDS);

    try {
      // 1. Attempt atomic lock for IN_PROGRESS state
      const initialRecord: StoredIdempotencyRecord = {
        status: 'IN_PROGRESS',
        startedAt: Date.now(),
        payloadHash,
      };

      const setResult = await this.redisClient.set(
        redisKey,
        JSON.stringify(initialRecord),
        'EX',
        lockTtlSeconds,
        'NX',
      );

      // 2. Lock failed -> Key already exists in Redis
      if (setResult !== 'OK') {
        const existingRaw = await this.redisClient.get(redisKey);
        if (existingRaw) {
          const existing = this.parseRecord(existingRaw);

          // Payload Fingerprinting: Check if payload body matches original request
          if (existing.payloadHash && existing.payloadHash !== payloadHash) {
            throw new InterviewAIException(
              ErrorCode.CONFLICT,
              HttpStatus.CONFLICT,
              'Idempotency key was previously used with a different request payload',
            );
          }

          if (existing.status === 'IN_PROGRESS') {
            throw new InterviewAIException(
              ErrorCode.REQUEST_IN_PROGRESS,
              HttpStatus.CONFLICT,
              'A request with this idempotency key is currently in progress. Please retry shortly.',
            );
          }

          if (existing.status === 'COMPLETED') {
            res.status(existing.statusCode || HttpStatus.OK);
            res.setHeader('Idempotent-Replay', 'true');
            res.setHeader('X-Cache-Lookup', 'HIT');
            return of(existing.body);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof InterviewAIException) {
        throw err;
      }
      // Fail-open: If Redis command throws, log warning and let request proceed
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Idempotency check bypassed due to Redis error: ${msg}`);
      return next.handle();
    }

    // 3. Lock acquired successfully -> Execute request and handle completion/failure
    return next.handle().pipe(
      concatMap(async (responseBody: unknown) => {
        await this.saveCompletedRecord(
          redisKey,
          res.statusCode || HttpStatus.OK,
          responseBody,
          payloadHash,
          cacheTtlSeconds,
        );
        return responseBody;
      }),
      catchError((error: unknown) => {
        // Release the lock immediately so client can retry without waiting for lock TTL
        void this.safeDeleteKey(redisKey);
        return throwError(() => error);
      }),
    );
  }

  private computePayloadHash(
    body: unknown,
    file?: {
      originalname?: string;
      size?: number;
      mimetype?: string;
      buffer?: Buffer;
    },
  ): string {
    const hash = crypto.createHash('sha256');
    const serialized =
      body !== undefined && body !== null ? JSON.stringify(body) : '';
    hash.update(serialized);

    if (file) {
      hash.update(
        `:file:${file.originalname || ''}:${file.size || 0}:${file.mimetype || ''}`,
      );
      if (file.buffer && Buffer.isBuffer(file.buffer)) {
        hash.update(file.buffer);
      }
    }

    return hash.digest('hex');
  }

  private parseRecord(raw: string): StoredIdempotencyRecord {
    try {
      return JSON.parse(raw) as StoredIdempotencyRecord;
    } catch {
      return { status: 'IN_PROGRESS' };
    }
  }

  private async saveCompletedRecord(
    key: string,
    statusCode: number,
    body: unknown,
    payloadHash: string,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      if (!this.redisClient) return;
      const record: StoredIdempotencyRecord = {
        status: 'COMPLETED',
        completedAt: Date.now(),
        statusCode,
        body,
        payloadHash,
      };
      await this.redisClient.set(key, JSON.stringify(record), 'EX', ttlSeconds);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to store completed idempotency record for ${key}: ${msg}`,
      );
    }
  }

  private async safeDeleteKey(key: string): Promise<void> {
    try {
      if (!this.redisClient) return;
      await this.redisClient.del(key);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to delete idempotency lock for key ${key}: ${msg}`,
      );
    }
  }
}
