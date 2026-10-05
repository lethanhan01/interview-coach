import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../error-code.enum';
import { InterviewAIException } from '../interview-ai.exception';

export class PrismaErrorMapper {
  static map(error: Prisma.PrismaClientKnownRequestError): InterviewAIException {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[])?.join(', ') || 'field';
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
      case 'P1001':
      case 'P1002':
        return new InterviewAIException(
          ErrorCode.SERVICE_UNAVAILABLE,
          HttpStatus.SERVICE_UNAVAILABLE,
          'Database server is temporarily unreachable',
          { cause: error, metadata: { prismaCode: error.code }, isOperational: false },
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
}
