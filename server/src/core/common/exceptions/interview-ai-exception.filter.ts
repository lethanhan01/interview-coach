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
import { isPgConnectionDropError } from '@infra/database/prisma/prisma-connection-error';
import { ErrorCode } from './error-code.enum';
import { InterviewAIException } from './interview-ai.exception';
import { PrismaErrorMapper } from './mappers/prisma-error.mapper';
import { isTransientRedisError } from './mappers/transient-redis-error';
import { RequestContext } from '../context/request-context';

const SERVICE_UNAVAILABLE_RETRY_AFTER_SECONDS = '5';

type PrismaLikeError =
  | Prisma.PrismaClientKnownRequestError
  | Prisma.PrismaClientUnknownRequestError
  | Prisma.PrismaClientInitializationError
  | Prisma.PrismaClientRustPanicError
  | Prisma.PrismaClientValidationError
  | Error;

interface ResolvedErrorPayload {
  status: number;
  errorCode: ErrorCode;
  message: string;
  details: unknown;
}

function isPrismaOrConnectionDropError(
  exception: unknown,
): exception is PrismaLikeError {
  return (
    exception instanceof Prisma.PrismaClientKnownRequestError ||
    exception instanceof Prisma.PrismaClientUnknownRequestError ||
    exception instanceof Prisma.PrismaClientInitializationError ||
    exception instanceof Prisma.PrismaClientRustPanicError ||
    exception instanceof Prisma.PrismaClientValidationError ||
    isPgConnectionDropError(exception)
  );
}

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
    try {
      if (typeof host.getType === 'function' && host.getType() !== 'http') {
        this.logger.error(
          `Unhandled non-HTTP (${host.getType()}) exception`,
          exception instanceof Error ? exception.stack : String(exception),
        );
        return;
      }

      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      if (!response || response.headersSent || response.writableEnded) {
        this.logger.warn(
          `Skipped error response because headers were already sent or stream ended (${request?.url ?? 'unknown-path'}): ${
            exception instanceof Error ? exception.message : String(exception)
          }`,
        );
        return;
      }

      const { status, errorCode, message, details } =
        this.resolveErrorPayload(exception);
      const requestId = this.resolveContextHeader(
        request,
        'x-request-id',
        'X-Request-ID',
        RequestContext.getRequestId(),
        'no-request-id',
      );
      const correlationId = this.resolveContextHeader(
        request,
        'x-correlation-id',
        'X-Correlation-ID',
        RequestContext.getCorrelationId(),
        'no-correlation-id',
      );

      if (
        status === Number(HttpStatus.SERVICE_UNAVAILABLE) &&
        typeof response.setHeader === 'function'
      ) {
        response.setHeader(
          'Retry-After',
          SERVICE_UNAVAILABLE_RETRY_AFTER_SECONDS,
        );
      }

      response.status(status).json({
        success: false,
        error: {
          code: errorCode,
          message,
          details,
        },
        meta: {
          requestId,
          correlationId,
          timestamp: new Date().toISOString(),
          path: request?.url ?? '',
        },
      });
    } catch (filterError: unknown) {
      this.logger.error(
        'Fatal error inside InterviewAIExceptionFilter',
        filterError instanceof Error ? filterError.stack : String(filterError),
      );
    }
  }

  private resolveErrorPayload(exception: unknown): ResolvedErrorPayload {
    if (exception instanceof InterviewAIException) {
      const status = exception.getStatus();
      if (!exception.isOperational || status >= 500) {
        this.logger.error(
          `[${exception.errorCode}] ${exception.message}`,
          exception.stack,
        );
      }
      return {
        status,
        errorCode: exception.errorCode,
        message: exception.message,
        details: exception.details ?? null,
      };
    }

    if (isPrismaOrConnectionDropError(exception)) {
      return this.resolvePrismaError(exception);
    }

    if (isTransientRedisError(exception)) {
      this.logger.error(
        `Transient Redis Error: ${exception.message}`,
        exception.stack,
      );
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        errorCode: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Cache and realtime service is temporarily unavailable',
        details: null,
      };
    }

    if (exception instanceof HttpException) {
      return this.resolveHttpException(exception);
    }

    return this.resolveUnknownError(exception);
  }

  private resolvePrismaError(exception: PrismaLikeError): ResolvedErrorPayload {
    const mapped = PrismaErrorMapper.map(exception);
    const status = mapped.getStatus();

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

    return {
      status,
      errorCode: mapped.errorCode,
      message: mapped.message,
      details: mapped.details ?? null,
    };
  }

  private resolveHttpException(exception: HttpException): ResolvedErrorPayload {
    const status = exception.getStatus();
    const errorCode =
      httpExceptionCodeByStatus[status] ??
      (status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST);
    const body = exception.getResponse();
    const rawMsg =
      typeof body === 'string' ? body : (body as { message?: unknown }).message;

    if (Array.isArray(rawMsg)) {
      return {
        status,
        errorCode,
        message: 'Validation failed for incoming payload',
        details: { error: rawMsg.map(String) },
      };
    }

    const details =
      typeof body === 'object' && body !== null && 'details' in body
        ? ((body as { details?: unknown }).details ?? null)
        : null;

    return {
      status,
      errorCode,
      message: (rawMsg as string | undefined) ?? exception.message,
      details,
    };
  }

  private resolveUnknownError(exception: unknown): ResolvedErrorPayload {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isError = exception instanceof Error;

    this.logger.error(
      'Unhandled exception',
      isError ? exception.stack : String(exception),
    );

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCode.INTERNAL_ERROR,
      message:
        isDevelopment && isError ? exception.message : 'Internal server error',
      details: isDevelopment && isError ? { stack: exception.stack } : null,
    };
  }

  private resolveContextHeader(
    request: Request | undefined,
    lowerKey: string,
    upperKey: string,
    fallback: string | undefined,
    placeholder: string,
  ): string | undefined {
    const value =
      (request?.headers?.[lowerKey] as string | undefined) ||
      (request?.headers?.[upperKey] as string | undefined) ||
      fallback;
    return value && value !== placeholder ? value : undefined;
  }
}
