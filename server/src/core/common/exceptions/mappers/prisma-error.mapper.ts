import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  isPgConnectionDropError,
  isTransientPrismaConnectionError,
} from '@infra/database/prisma/prisma-connection-error';
import { ErrorCode } from '../error-code.enum';
import { InterviewAIException } from '../interview-ai.exception';

export class PrismaErrorMapper {
  static map(
    error:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientInitializationError
      | Prisma.PrismaClientRustPanicError
      | Prisma.PrismaClientUnknownRequestError
      | Prisma.PrismaClientValidationError
      | Error,
  ): InterviewAIException {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return new InterviewAIException(
        ErrorCode.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Database server connection could not be initialized',
        { cause: error, isOperational: false },
      );
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return new InterviewAIException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Database engine encountered a critical panic',
        { cause: error, isOperational: false },
      );
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Database query validation failed',
        { cause: error },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': {
          const target =
            (error.meta?.target as string[])?.join(', ') || 'field';
          return new InterviewAIException(
            ErrorCode.CONFLICT,
            HttpStatus.CONFLICT,
            `Unique constraint failed on: ${target}`,
            { cause: error, metadata: { prismaCode: error.code } },
          );
        }
        case 'P2025':
          return new InterviewAIException(
            ErrorCode.NOT_FOUND,
            HttpStatus.NOT_FOUND,
            'Requested record was not found or has been deleted',
            { cause: error, metadata: { prismaCode: error.code } },
          );
        case 'P2003':
          return new InterviewAIException(
            ErrorCode.VALIDATION_ERROR,
            HttpStatus.BAD_REQUEST,
            'Foreign key constraint failed',
            { cause: error, metadata: { prismaCode: error.code } },
          );
        case 'P2000':
          return new InterviewAIException(
            ErrorCode.VALIDATION_ERROR,
            HttpStatus.BAD_REQUEST,
            'The provided value for the column is too long',
            { cause: error, metadata: { prismaCode: error.code } },
          );
        case 'P2014':
          return new InterviewAIException(
            ErrorCode.CONFLICT,
            HttpStatus.CONFLICT,
            'The change you are trying to make would violate the required relation',
            { cause: error, metadata: { prismaCode: error.code } },
          );
        case 'P2024':
          return new InterviewAIException(
            ErrorCode.SERVICE_UNAVAILABLE,
            HttpStatus.SERVICE_UNAVAILABLE,
            'Timed out fetching a new connection from the database connection pool',
            {
              cause: error,
              metadata: { prismaCode: error.code },
              isOperational: false,
            },
          );
        case 'P2028':
          return new InterviewAIException(
            ErrorCode.SERVICE_UNAVAILABLE,
            HttpStatus.SERVICE_UNAVAILABLE,
            'Database transaction timed out or connection was interrupted',
            {
              cause: error,
              metadata: { prismaCode: error.code },
              isOperational: false,
            },
          );
        case 'P1001':
        case 'P1002':
        case 'P1008':
        case 'P1017':
          return new InterviewAIException(
            ErrorCode.SERVICE_UNAVAILABLE,
            HttpStatus.SERVICE_UNAVAILABLE,
            'Database server is temporarily unreachable',
            {
              cause: error,
              metadata: { prismaCode: error.code },
              isOperational: false,
            },
          );
        default:
          return new InterviewAIException(
            ErrorCode.INTERNAL_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Database operation failed',
            { cause: error, metadata: { prismaCode: error.code } },
          );
      }
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      if (isTransientPrismaConnectionError(error)) {
        return new InterviewAIException(
          ErrorCode.SERVICE_UNAVAILABLE,
          HttpStatus.SERVICE_UNAVAILABLE,
          'Database connection was interrupted temporarily',
          { cause: error, isOperational: false },
        );
      }
      return new InterviewAIException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Database operation failed',
        { cause: error, isOperational: false },
      );
    }

    if (isPgConnectionDropError(error)) {
      return new InterviewAIException(
        ErrorCode.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Database connection was interrupted temporarily',
        { cause: error, isOperational: false },
      );
    }

    return new InterviewAIException(
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Database operation failed',
      { cause: error },
    );
  }
}
