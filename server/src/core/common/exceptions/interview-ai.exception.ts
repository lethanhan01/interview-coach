import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code.enum';

export interface InterviewAIExceptionOptions {
  details?: Record<string, string[]> | unknown;
  cause?: unknown;
  metadata?: Record<string, unknown>;
  isOperational?: boolean;
}

export class InterviewAIException extends HttpException {
  public readonly details?: Record<string, string[]> | unknown;
  public readonly metadata?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    public readonly errorCode: ErrorCode,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    message?: string,
    options?: InterviewAIExceptionOptions,
  ) {
    super(
      {
        success: false,
        errorCode,
        message: message ?? errorCode,
        details: options?.details ?? null,
      },
      statusCode,
      { cause: options?.cause },
    );

    this.details = options?.details;
    this.metadata = options?.metadata;
    this.isOperational = options?.isOperational ?? true;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
