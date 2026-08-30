import { HttpStatus } from '@nestjs/common';
import { InterviewAIException } from './interview-ai.exception';
import { ErrorCode } from './error-code.enum';

describe('InterviewAIException', () => {
  it('set errorCode đúng', () => {
    const ex = new InterviewAIException(
      ErrorCode.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
    );
    expect(ex.errorCode).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('set HTTP status đúng', () => {
    const ex = new InterviewAIException(
      ErrorCode.FORBIDDEN,
      HttpStatus.FORBIDDEN,
    );
    expect(ex.getStatus()).toBe(403);
  });

  it('dùng errorCode làm message mặc định khi không truyền message', () => {
    const ex = new InterviewAIException(
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    const response = ex.getResponse() as Record<string, unknown>;
    expect(response.message).toBe(ErrorCode.NOT_FOUND);
  });

  it('dùng message custom khi được truyền vào', () => {
    const ex = new InterviewAIException(
      ErrorCode.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
      'Custom error message',
    );
    const response = ex.getResponse() as Record<string, unknown>;
    expect(response.message).toBe('Custom error message');
  });

  it('response body có success = false', () => {
    const ex = new InterviewAIException(
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const response = ex.getResponse() as Record<string, unknown>;
    expect(response.success).toBe(false);
  });

  it('extends Error', () => {
    const ex = new InterviewAIException(
      ErrorCode.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
    );
    expect(ex).toBeInstanceOf(Error);
  });
});
