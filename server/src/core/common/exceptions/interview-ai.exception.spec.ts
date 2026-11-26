import { HttpStatus } from '@nestjs/common';
import { InterviewAIException } from './interview-ai.exception';
import { ErrorCode } from './error-code.enum';

describe('InterviewAIException', () => {
  it('khởi tạo với các tham số cơ bản (backward compatibility)', () => {
    const ex = new InterviewAIException(
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      'Resource not found',
    );

    expect(ex.errorCode).toBe(ErrorCode.NOT_FOUND);
    expect(ex.getStatus()).toBe(404);
    expect(ex.message).toBe('Resource not found');
    expect(ex.details).toBeUndefined();
    expect(ex.cause).toBeUndefined();
    expect(ex.metadata).toBeUndefined();
    expect(ex.isOperational).toBe(true);

    const res = ex.getResponse() as Record<string, unknown>;
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe(ErrorCode.NOT_FOUND);
    expect(res.message).toBe('Resource not found');
    expect(res.details).toBeNull();
  });

  it('khởi tạo với đầy đủ options (v2 features)', () => {
    const causeError = new Error('Database connection failed');
    const details = { email: ['Email already taken'] };
    const metadata = { traceId: '123' };

    const ex = new InterviewAIException(
      ErrorCode.CONFLICT,
      HttpStatus.CONFLICT,
      'Email conflict',
      {
        details,
        cause: causeError,
        metadata,
        isOperational: false,
      },
    );

    expect(ex.errorCode).toBe(ErrorCode.CONFLICT);
    expect(ex.getStatus()).toBe(409);
    expect(ex.message).toBe('Email conflict');
    expect(ex.details).toEqual(details);
    expect(ex.cause).toBe(causeError);
    expect(ex.metadata).toEqual(metadata);
    expect(ex.isOperational).toBe(false);

    const res = ex.getResponse() as Record<string, unknown>;
    expect(res.details).toEqual(details);
  });

  it('bảo toàn prototype chain cho instanceof checking', () => {
    const ex = new InterviewAIException(ErrorCode.BAD_REQUEST);
    expect(ex instanceof InterviewAIException).toBe(true);
  });
});
