import { HttpStatus, HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InterviewAIExceptionFilter } from './interview-ai-exception.filter';
import { InterviewAIException } from './interview-ai.exception';
import { ErrorCode } from './error-code.enum';

const mockResponse = () => {
  const res = {} as Record<string, jest.Mock>;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockHost = (
  res: ReturnType<typeof mockResponse>,
  url = '/api/v1/test',
  headers: Record<string, string> = {},
) => ({
  switchToHttp: () => ({
    getResponse: () => res,
    getRequest: () => ({ url, headers }),
  }),
});

describe('InterviewAIExceptionFilter', () => {
  let filter: InterviewAIExceptionFilter;

  beforeEach(() => {
    filter = new InterviewAIExceptionFilter();
  });

  it('xử lý InterviewAIException — trả đúng status và hierarchical error envelope', () => {
    const res = mockResponse();
    const exception = new InterviewAIException(
      ErrorCode.FORBIDDEN,
      HttpStatus.FORBIDDEN,
      'Access denied',
      { details: { reason: ['Account suspended'] } },
    );

    filter.catch(exception, mockHost(res) as never);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: ErrorCode.FORBIDDEN,
          message: 'Access denied',
          details: { reason: ['Account suspended'] },
        },
        meta: expect.objectContaining({
          path: '/api/v1/test',
          timestamp: expect.any(String),
        }),
      }),
    );
  });

  it('xử lý HttpException 401 — map sang UNAUTHORIZED error code trong envelope', () => {
    const res = mockResponse();
    const exception = new HttpException(
      'Unauthorized',
      HttpStatus.UNAUTHORIZED,
    );

    filter.catch(exception, mockHost(res) as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ErrorCode.UNAUTHORIZED,
          message: 'Unauthorized',
        }),
      }),
    );
  });

  it('xử lý HttpException 403 — map sang FORBIDDEN', () => {
    const res = mockResponse();
    filter.catch(
      new HttpException('Forbidden', HttpStatus.FORBIDDEN),
      mockHost(res) as never,
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: ErrorCode.FORBIDDEN }),
      }),
    );
  });

  it('xử lý PrismaClientKnownRequestError P2002 — map sang CONFLICT (409)', () => {
    const res = mockResponse();
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.8.0',
        meta: { target: ['email'] },
      },
    );

    filter.catch(prismaError, mockHost(res) as never);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ErrorCode.CONFLICT,
        }),
      }),
    );
  });

  it('xử lý PrismaClientInitializationError — map sang SERVICE_UNAVAILABLE (503)', () => {
    const res = mockResponse();
    const initError = new Prisma.PrismaClientInitializationError(
      'Cannot connect to PostgreSQL server at localhost:5432',
      '7.8.0',
    );

    filter.catch(initError, mockHost(res) as never);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ErrorCode.SERVICE_UNAVAILABLE,
          message: 'Database server connection could not be initialized',
        }),
      }),
    );
  });

  it('xử lý unknown Error — trả 500 INTERNAL_ERROR', () => {
    const res = mockResponse();
    filter.catch(new Error('Unexpected crash'), mockHost(res) as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ErrorCode.INTERNAL_ERROR,
        }),
      }),
    );
  });

  it('response có path và timestamp trong meta', () => {
    const res = mockResponse();
    const exception = new InterviewAIException(
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, mockHost(res, '/api/v1/sessions') as never);

    const body = res.json.mock.calls[0][0] as {
      meta: { path: string; timestamp: string };
    };
    expect(body.meta.path).toBe('/api/v1/sessions');
    expect(body.meta.timestamp).toBeDefined();
  });

  it('response gắn requestId nếu request có header x-request-id', () => {
    const res = mockResponse();
    const exception = new InterviewAIException(
      ErrorCode.BAD_REQUEST,
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(
      exception,
      mockHost(res, '/api/v1/test', { 'x-request-id': 'req-xyz-123' }) as never,
    );

    const body = res.json.mock.calls[0][0] as { meta: { requestId?: string } };
    expect(body.meta.requestId).toBe('req-xyz-123');
  });

  it('response gắn correlationId nếu request có header x-correlation-id', () => {
    const res = mockResponse();
    const exception = new InterviewAIException(
      ErrorCode.BAD_REQUEST,
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(
      exception,
      mockHost(res, '/api/v1/test', {
        'x-correlation-id': 'corr-abc-999',
      }) as never,
    );

    const body = res.json.mock.calls[0][0] as {
      meta: { correlationId?: string };
    };
    expect(body.meta.correlationId).toBe('corr-abc-999');
  });

  it('ghi log ERROR khi InterviewAIException là non-operational hoặc status >= 500', () => {
    const res = mockResponse();
    const loggerErrorSpy = jest.spyOn((filter as any).logger, 'error');

    const exception = new InterviewAIException(
      ErrorCode.SERVICE_UNAVAILABLE,
      HttpStatus.SERVICE_UNAVAILABLE,
      'DB unreachable',
      { isOperational: false },
    );

    filter.catch(exception, mockHost(res) as never);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SERVICE_UNAVAILABLE] DB unreachable'),
      expect.anything(),
    );
  });

  describe('HttpException hierarchical fallback mapping', () => {
    it('map HttpException 429 sang RATE_LIMIT_EXCEEDED', () => {
      const res = mockResponse();
      filter.catch(
        new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS),
        mockHost(res) as never,
      );

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCode.RATE_LIMIT_EXCEEDED,
          }),
        }),
      );
    });

    it('map HttpException 502/504 sang INTERNAL_ERROR', () => {
      const res = mockResponse();
      filter.catch(
        new HttpException('Bad Gateway', HttpStatus.BAD_GATEWAY),
        mockHost(res) as never,
      );

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: ErrorCode.INTERNAL_ERROR }),
        }),
      );
    });

    it('map HttpException 422 hoặc mã 4xx khác sang BAD_REQUEST', () => {
      const res = mockResponse();
      filter.catch(
        new HttpException(
          'Unprocessable Entity',
          HttpStatus.UNPROCESSABLE_ENTITY,
        ),
        mockHost(res) as never,
      );

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: ErrorCode.BAD_REQUEST }),
        }),
      );
    });
  });

  describe('Stack trace and message whitelist security', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('ẩn tuyệt đối stack trace và trả thông điệp chung trên staging hoặc khi NODE_ENV undefined', () => {
      delete process.env.NODE_ENV;
      const res = mockResponse();
      filter.catch(
        new Error('Sensitive DB Error: Password123'),
        mockHost(res) as never,
      );

      const body = res.json.mock.calls[0][0];
      expect(body.error.message).toBe('Internal server error');
      expect(body.error.details).toBeNull();
    });

    it('chỉ hiển thị stack trace và exception message khi NODE_ENV === development', () => {
      process.env.NODE_ENV = 'development';
      const res = mockResponse();
      const error = new Error('Debug error with details');
      filter.catch(error, mockHost(res) as never);

      const body = res.json.mock.calls[0][0];
      expect(body.error.message).toBe('Debug error with details');
      expect(body.error.details).toEqual({ stack: error.stack });
    });
  });
});
