import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code.enum';

export class InterviewAIException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    statusCode: HttpStatus,
    message?: string,
  ) {
    super(
      {
        success: false,
        errorCode,
        message: message ?? errorCode,
      },
      statusCode,
    );
  }
}
