import { HttpStatus, HttpException } from '@nestjs/common';
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

  it('xử lý InterviewAIException — trả đúng status và errorCode', () => {
    const res = mockResponse();
    const exception = new InterviewAIException(
      ErrorCode.FORBIDDEN,
      HttpStatus.FORBIDDEN,
    );

    filter.catch(exception, mockHost(res) as never);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errorCode: ErrorCode.FORBIDDEN,
      }),
    );
  });

  it('xử lý HttpException 401 — map sang UNAUTHORIZED error code', () => {
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
        errorCode: ErrorCode.UNAUTHORIZED,
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
      expect.objectContaining({ errorCode: ErrorCode.FORBIDDEN }),
    );
  });

  it('xử lý unknown Error — trả 500 INTERNAL_ERROR', () => {
    const res = mockResponse();
    filter.catch(new Error('Unexpected crash'), mockHost(res) as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errorCode: ErrorCode.INTERNAL_ERROR,
      }),
    );
  });

  it('response có path và timestamp', () => {
    const res = mockResponse();
    const exception = new InterviewAIException(
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, mockHost(res, '/api/v1/sessions') as never);

    const body = res.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.path).toBe('/api/v1/sessions');
    expect(body.timestamp).toBeDefined();
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

    const body = res.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.requestId).toBe('req-xyz-123');
  });
});
