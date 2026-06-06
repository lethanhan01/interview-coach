import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from './error-code.enum';
import { InterviewAIException } from './interview-ai.exception';

@Catch()
export class InterviewAIExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(InterviewAIExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorCode: ErrorCode;
    let message: string;

    if (exception instanceof InterviewAIException) {
      status = exception.getStatus();
      errorCode = exception.errorCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorCode = ErrorCode.VALIDATION_ERROR;
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : (body as { message?: string }).message ?? exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = ErrorCode.INTERNAL_ERROR;
      message = 'Internal server error';
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      errorCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
