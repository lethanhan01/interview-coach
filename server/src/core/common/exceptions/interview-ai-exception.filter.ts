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
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMIT_EXCEEDED,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ErrorCode.PAYLOAD_TOO_LARGE,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
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
    let details: unknown = null;

    if (exception instanceof InterviewAIException) {
      status = exception.getStatus();
      errorCode = exception.errorCode;
      message = exception.message;
      details = exception.details ?? null;

      if (!exception.isOperational || status >= 500) {
        this.logger.error(`[${errorCode}] ${message}`, exception.stack);
      }
    } else if (
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientValidationError
    ) {
      const mapped = PrismaErrorMapper.map(exception);
      status = mapped.getStatus();
      errorCode = mapped.errorCode;
      message = mapped.message;
      details = mapped.details ?? null;

      if (!mapped.isOperational || status >= 500) {
        this.logger.error(
          `Prisma Database Error: ${exception.message}`,
          exception.stack,
        );
      } else {
        const prismaCode =
          'code' in exception
            ? String((exception as { code?: string }).code)
            : exception.name;
        this.logger.warn(
          `Prisma Database Error [${prismaCode}]: ${exception.message}`,
        );
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      if (httpExceptionCodeByStatus[status]) {
        errorCode = httpExceptionCodeByStatus[status]!;
      } else if (status >= 500) {
        errorCode = ErrorCode.INTERNAL_ERROR;
      } else {
        errorCode = ErrorCode.BAD_REQUEST;
      }
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
      const isDevelopment = process.env.NODE_ENV === 'development';
      message =
        isDevelopment && exception instanceof Error
          ? exception.message
          : 'Internal server error';
      details =
        isDevelopment && exception instanceof Error
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
        correlationId:
          correlationId !== 'no-correlation-id' ? correlationId : undefined,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
