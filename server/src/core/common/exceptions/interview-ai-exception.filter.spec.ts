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
      mockHost(res, '/api/v1/test', { 'x-correlation-id': 'corr-abc-999' }) as never,
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
});
