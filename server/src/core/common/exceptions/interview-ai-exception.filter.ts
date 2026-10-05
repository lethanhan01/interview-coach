import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ErrorCode } from './error-code.enum';
import { InterviewAIException } from './interview-ai.exception';
import { PrismaErrorMapper } from './mappers/prisma-error.mapper';
import { RequestContext } from '../context/request-context';

const httpExceptionCodeByStatus: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
};

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
    let details: Record<string, string[]> | unknown = null;

    if (exception instanceof InterviewAIException) {
      status = exception.getStatus();
      errorCode = exception.errorCode;
      message = exception.message;
      details = exception.details ?? null;

      if (!exception.isOperational || status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `[${errorCode}] ${message}`,
          exception.stack,
        );
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = PrismaErrorMapper.map(exception);
      status = mapped.getStatus();
      errorCode = mapped.errorCode;
      message = mapped.message;
      details = mapped.details ?? null;
      this.logger.warn(
        `PrismaClientKnownRequestError [${exception.code}]: ${exception.message}`,
      );
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorCode =
        httpExceptionCodeByStatus[status] ?? ErrorCode.VALIDATION_ERROR;
      const body = exception.getResponse();
      const rawMsg =
        typeof body === 'string'
          ? body
          : (body as { message?: unknown }).message;

      if (Array.isArray(rawMsg)) {
        message = 'Validation failed for incoming payload';
        details = { error: rawMsg.map(String) };
      } else {
        message = (rawMsg as string | undefined) ?? exception.message;
        if (typeof body === 'object' && body !== null && 'details' in body) {
          details = (body as { details?: unknown }).details ?? null;
        }
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = ErrorCode.INTERNAL_ERROR;
      const isProd = process.env.NODE_ENV === 'production';
      message = isProd
        ? 'Internal server error'
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';
      details = isProd
        ? null
        : exception instanceof Error
          ? { stack: exception.stack }
          : null;

      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const requestId =
      (request.headers?.['x-request-id'] as string) ||
      (request.headers?.['X-Request-ID'] as string) ||
      RequestContext.getRequestId() ||
      undefined;

    const correlationId =
      (request.headers?.['x-correlation-id'] as string) ||
      (request.headers?.['X-Correlation-ID'] as string) ||
      RequestContext.getCorrelationId() ||
      undefined;

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
      meta: {
        requestId: requestId !== 'no-request-id' ? requestId : undefined,
        correlationId: correlationId !== 'no-correlation-id' ? correlationId : undefined,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
