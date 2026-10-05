import { ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import {
  IdempotencyInterceptor,
  IDEMPOTENT_METADATA_KEY,
} from './idempotency.interceptor';
import { InterviewAIException } from '../exceptions/interview-ai.exception';
import { ErrorCode } from '../exceptions/error-code.enum';
import * as crypto from 'crypto';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let configService: jest.Mocked<ConfigService>;
  let mockRedis: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'IDEMPOTENCY_LOCK_TTL_SECONDS') return 60;
        if (key === 'IDEMPOTENCY_CACHE_TTL_SECONDS') return 86400;
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    };

    interceptor = new IdempotencyInterceptor(
      reflector,
      configService,
      mockRedis,
    );
  });

  function createMockContext(
    method: string,
    headers: Record<string, string | string[]> = {},
    body: any = {},
    user: any = { id: 'user-123' },
    url = '/api/v1/sessions',
    file?: any,
  ): {
    context: ExecutionContext;
    response: {
      status: jest.Mock;
      setHeader: jest.Mock;
      statusCode: number;
    };
  } {
    const response = {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      statusCode: 200,
    };

    const request = {
      method,
      headers: { ...headers },
      body,
      user,
      baseUrl: url,
      originalUrl: url,
      file,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    return { context, response };
  }

  function createMockCallHandler(returnValue: any = { success: true }): CallHandler {
    return {
      handle: jest.fn(() => of(returnValue)),
    };
  }

  describe('Pass-through scenarios', () => {
    it('cho phép request GET đi qua bình thường mà không kiểm tra Idempotency', async () => {
      const { context } = createMockContext('GET', {
        'idempotency-key': 'test-key-1',
      });
      const next = createMockCallHandler();

      const observable = await interceptor.intercept(context, next);
      let result: any;
      observable.subscribe((res) => (result = res));

      expect(next.handle).toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('cho phép request mutation không có header đi qua nếu không bắt buộc', async () => {
      const { context } = createMockContext('POST');
      const next = createMockCallHandler();

      const observable = await interceptor.intercept(context, next);
      let result: any;
      observable.subscribe((res) => (result = res));

      expect(next.handle).toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('Validation & Requirements', () => {
    it('ném lỗi 400 BAD_REQUEST nếu endpoint gắn @Idempotent({ required: true }) mà thiếu header', async () => {
      reflector.getAllAndOverride.mockReturnValue({ required: true });

      const { context } = createMockContext('POST', {});
      const next = createMockCallHandler();

      await expect(interceptor.intercept(context, next)).rejects.toThrow(
        InterviewAIException,
      );

      try {
        await interceptor.intercept(context, next);
      } catch (err: any) {
        expect(err.errorCode).toBe(ErrorCode.BAD_REQUEST);
        expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(err.message).toContain('Idempotency-Key header is required');
      }
    });

    it('ném lỗi 400 VALIDATION_ERROR nếu Idempotency-Key vượt quá 128 ký tự', async () => {
      const longKey = 'a'.repeat(129);
      const { context } = createMockContext('POST', {
        'idempotency-key': longKey,
      });
      const next = createMockCallHandler();

      await expect(interceptor.intercept(context, next)).rejects.toThrow(
        InterviewAIException,
      );

      try {
        await interceptor.intercept(context, next);
      } catch (err: any) {
        expect(err.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
        expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(err.message).toContain('between 1 and 128 characters');
      }
    });
  });

  describe('Locking & Execution Lifecycle', () => {
    it('khóa IN_PROGRESS thành công và lưu COMPLETED cache sau khi handler xử lý xong', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const body = { role: 'Backend Engineer' };
      const { context, response } = createMockContext(
        'POST',
        { 'idempotency-key': 'valid-uuid-key' },
        body,
        { id: 'usr-1' },
        '/api/v1/sessions',
      );
      response.statusCode = 201;

      const next = createMockCallHandler({ id: 'sess-created' });

      const observable = await interceptor.intercept(context, next);

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: (res) => {
            expect(res).toEqual({ id: 'sess-created' });
            resolve();
          },
        });
      });

      // 1. Kiểm tra atomic SET NX lock
      expect(mockRedis.set).toHaveBeenCalledWith(
        'idempotency:usr-1:POST:/api/v1/sessions:valid-uuid-key',
        expect.stringContaining('"status":"IN_PROGRESS"'),
        'EX',
        60,
        'NX',
      );

      // 2. Chờ microtask để tap hoàn thành lưu cache
      await new Promise((r) => setTimeout(r, 10));

      expect(mockRedis.set).toHaveBeenCalledWith(
        'idempotency:usr-1:POST:/api/v1/sessions:valid-uuid-key',
        expect.stringContaining('"status":"COMPLETED"'),
        'EX',
        86400,
      );
    });

    it('ném 409 CONFLICT (REQUEST_IN_PROGRESS) nếu request thứ hai gửi đến trong lúc request đầu đang chạy', async () => {
      // SET NX trả về null nghĩa là key đã tồn tại
      mockRedis.set.mockResolvedValue(null);

      const body = { role: 'Backend Engineer' };
      const payloadHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(body))
        .digest('hex');

      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          status: 'IN_PROGRESS',
          startedAt: Date.now(),
          payloadHash,
        }),
      );

      const { context } = createMockContext(
        'POST',
        { 'idempotency-key': 'running-key' },
        body,
      );
      const next = createMockCallHandler();

      try {
        await interceptor.intercept(context, next);
        fail('Expected to throw InterviewAIException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(InterviewAIException);
        expect(err.errorCode).toBe(ErrorCode.REQUEST_IN_PROGRESS);
        expect(err.getStatus()).toBe(HttpStatus.CONFLICT);
        expect(err.message).toContain('currently in progress');
      }

      expect(next.handle).not.toHaveBeenCalled();
    });

    it('ném 409 CONFLICT nếu cùng key nhưng payload body bị thay đổi (Payload Mismatch)', async () => {
      mockRedis.set.mockResolvedValue(null);

      const originalPayloadHash = 'hash-for-role-frontend';
      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          status: 'IN_PROGRESS',
          startedAt: Date.now(),
          payloadHash: originalPayloadHash,
        }),
      );

      const differentBody = { role: 'Backend Engineer' }; // Khác với original hash
      const { context } = createMockContext(
        'POST',
        { 'idempotency-key': 'tampered-key' },
        differentBody,
      );
      const next = createMockCallHandler();

      try {
        await interceptor.intercept(context, next);
        fail('Expected to throw InterviewAIException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(InterviewAIException);
        expect(err.errorCode).toBe(ErrorCode.CONFLICT);
        expect(err.getStatus()).toBe(HttpStatus.CONFLICT);
        expect(err.message).toContain('different request payload');
      }

      expect(next.handle).not.toHaveBeenCalled();
    });

    it('trả về response cache với headers Idempotent-Replay khi request thứ hai gửi đến sau khi đã hoàn thành', async () => {
      mockRedis.set.mockResolvedValue(null);

      const body = { role: 'Backend Engineer' };
      const payloadHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(body))
        .digest('hex');

      const cachedResponse = { id: 'sess-already-created', role: 'Backend Engineer' };
      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          status: 'COMPLETED',
          completedAt: Date.now() - 1000,
          statusCode: 201,
          body: cachedResponse,
          payloadHash,
        }),
      );

      const { context, response } = createMockContext(
        'POST',
        { 'idempotency-key': 'completed-key' },
        body,
      );
      const next = createMockCallHandler();

      const observable = await interceptor.intercept(context, next);
      let result: any;
      observable.subscribe((res) => (result = res));

      expect(result).toEqual(cachedResponse);
      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.setHeader).toHaveBeenCalledWith(
        'Idempotent-Replay',
        'true',
      );
      expect(response.setHeader).toHaveBeenCalledWith('X-Cache-Lookup', 'HIT');
      expect(next.handle).not.toHaveBeenCalled();
    });

    it('tự động xóa lock trong Redis khi pipeline ném unhandled error (để cho phép retry)', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const { context } = createMockContext('POST', {
        'idempotency-key': 'failing-key',
      });
      const failingNext: CallHandler = {
        handle: () => throwError(() => new Error('Simulated Database Crash')),
      };

      const observable = await interceptor.intercept(context, failingNext);

      await new Promise<void>((resolve) => {
        observable.subscribe({
          error: (err) => {
            expect(err.message).toBe('Simulated Database Crash');
            resolve();
          },
        });
      });

      // Kiểm tra del được gọi để xóa lock
      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining('failing-key'),
      );
    });
  });

  describe('Fail-open Resiliency', () => {
    it('cho phép request tiếp tục chạy bình thường (Fail-open) khi Redis ném exception', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis connection timeout'));

      const { context } = createMockContext('POST', {
        'idempotency-key': 'any-key',
      });
      const next = createMockCallHandler({ success: true, bypassed: true });

      const observable = await interceptor.intercept(context, next);
      let result: any;
      observable.subscribe((res) => (result = res));

      expect(next.handle).toHaveBeenCalled();
      expect(result).toEqual({ success: true, bypassed: true });
    });
  });

  describe('Multipart & URL Normalization', () => {
    it('bóc tách query params khỏi URL để tạo redis key chuẩn xác', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const { context } = createMockContext(
        'POST',
        { 'idempotency-key': 'url-key' },
        { a: 1 },
        { id: 'usr-url' },
        '/api/v1/sessions?tab=active&filter=recent',
      );
      const next = createMockCallHandler({ id: 'sess-ok' });

      const observable = await interceptor.intercept(context, next);
      observable.subscribe();

      expect(mockRedis.set).toHaveBeenCalledWith(
        'idempotency:usr-url:POST:/api/v1/sessions:url-key',
        expect.any(String),
        'EX',
        60,
        'NX',
      );
    });

    it('phát hiện Payload Mismatch khi upload file khác nhau với cùng Idempotency-Key', async () => {
      mockRedis.set.mockResolvedValue(null);

      // File A ban đầu
      const fileA = {
        originalname: 'answer-1.wav',
        size: 1024,
        mimetype: 'audio/wav',
        buffer: Buffer.from('audio-content-A'),
      };

      const fileAHash = crypto
        .createHash('sha256')
        .update('')
        .update(`:file:${fileA.originalname}:${fileA.size}:${fileA.mimetype}`)
        .update(fileA.buffer)
        .digest('hex');

      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          status: 'IN_PROGRESS',
          startedAt: Date.now(),
          payloadHash: fileAHash,
        }),
      );

      // File B được gửi đến với cùng key
      const fileB = {
        originalname: 'answer-2.wav',
        size: 2048,
        mimetype: 'audio/wav',
        buffer: Buffer.from('audio-content-B'),
      };

      const { context } = createMockContext(
        'POST',
        { 'idempotency-key': 'upload-key' },
        {},
        { id: 'usr-1' },
        '/api/v1/sessions/123/turns/audio',
        fileB,
      );
      const next = createMockCallHandler();

      try {
        await interceptor.intercept(context, next);
        fail('Expected to throw InterviewAIException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(InterviewAIException);
        expect(err.errorCode).toBe(ErrorCode.CONFLICT);
        expect(err.getStatus()).toBe(HttpStatus.CONFLICT);
        expect(err.message).toContain('different request payload');
      }

      expect(next.handle).not.toHaveBeenCalled();
    });
  });
});
