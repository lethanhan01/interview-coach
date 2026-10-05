import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaErrorMapper } from './prisma-error.mapper';
import { ErrorCode } from '../error-code.enum';

describe('PrismaErrorMapper', () => {
  it('map P2002 sang CONFLICT (409)', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.8.0',
        meta: { target: ['email'] },
      },
    );

    const exception = PrismaErrorMapper.map(error);
    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exception.errorCode).toBe(ErrorCode.CONFLICT);
    expect(exception.message).toContain('email');
    expect(exception.cause).toBe(error);
  });

  it('map P2025 sang NOT_FOUND (404)', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Record not found',
      {
        code: 'P2025',
        clientVersion: '7.8.0',
      },
    );

    const exception = PrismaErrorMapper.map(error);
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.errorCode).toBe(ErrorCode.NOT_FOUND);
    expect(exception.cause).toBe(error);
  });

  it('map P2003 sang VALIDATION_ERROR (400)', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed',
      {
        code: 'P2003',
        clientVersion: '7.8.0',
      },
    );

    const exception = PrismaErrorMapper.map(error);
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('map P1001 / P1002 sang SERVICE_UNAVAILABLE (503)', () => {
    const error1001 = new Prisma.PrismaClientKnownRequestError(
      'Cannot connect to database',
      {
        code: 'P1001',
        clientVersion: '7.8.0',
      },
    );

    const exception = PrismaErrorMapper.map(error1001);
    expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(exception.errorCode).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(exception.isOperational).toBe(false);
  });

  it('map unknown prisma code sang INTERNAL_ERROR (500)', () => {
    const unknownError = new Prisma.PrismaClientKnownRequestError(
      'Unknown DB fault',
      {
        code: 'P9999',
        clientVersion: '7.8.0',
      },
    );

    const exception = PrismaErrorMapper.map(unknownError);
    expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(exception.errorCode).toBe(ErrorCode.INTERNAL_ERROR);
  });
});
