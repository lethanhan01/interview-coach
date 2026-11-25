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
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.8.0',
    });

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

  it('map P2024 (connection pool timeout) sang SERVICE_UNAVAILABLE (503) với isOperational = false', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Timed out fetching a new connection from the pool',
      {
        code: 'P2024',
        clientVersion: '7.8.0',
      },
    );

    const exception = PrismaErrorMapper.map(error);
    expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(exception.errorCode).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(exception.isOperational).toBe(false);
  });

  it('map P2000 (value too long) sang VALIDATION_ERROR (400)', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'The provided value for the column is too long',
      {
        code: 'P2000',
        clientVersion: '7.8.0',
      },
    );

    const exception = PrismaErrorMapper.map(error);
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('map P2014 (required relation violation) sang CONFLICT (409)', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'The change you are trying to make would violate the required relation',
      {
        code: 'P2014',
        clientVersion: '7.8.0',
      },
    );

    const exception = PrismaErrorMapper.map(error);
    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exception.errorCode).toBe(ErrorCode.CONFLICT);
  });

  it('map PrismaClientInitializationError sang SERVICE_UNAVAILABLE (503) với isOperational = false', () => {
    const initError = new Prisma.PrismaClientInitializationError(
      'Can not reach database server at `localhost:5432`',
      '7.8.0',
    );

    const exception = PrismaErrorMapper.map(initError);
    expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(exception.errorCode).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(exception.isOperational).toBe(false);
    expect(exception.cause).toBe(initError);
  });

  it('map PrismaClientRustPanicError sang INTERNAL_ERROR (500) với isOperational = false', () => {
    const panicError = new Prisma.PrismaClientRustPanicError(
      'Engine panic',
      '7.8.0',
    );

    const exception = PrismaErrorMapper.map(panicError);
    expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(exception.errorCode).toBe(ErrorCode.INTERNAL_ERROR);
    expect(exception.isOperational).toBe(false);
  });

  it('map PrismaClientValidationError sang VALIDATION_ERROR (400)', () => {
    const validationError = new Prisma.PrismaClientValidationError(
      'Invalid prisma query args',
      { clientVersion: '7.8.0' },
    );

    const exception = PrismaErrorMapper.map(validationError);
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
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

  it('map P1008 / P1017 / P2028 sang SERVICE_UNAVAILABLE (503) với isOperational = false', () => {
    for (const code of ['P1008', 'P1017', 'P2028']) {
      const error = new Prisma.PrismaClientKnownRequestError(
        `Transient Prisma fault ${code}`,
        { code, clientVersion: '7.8.0' },
      );

      const exception = PrismaErrorMapper.map(error);
      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(exception.errorCode).toBe(ErrorCode.SERVICE_UNAVAILABLE);
      expect(exception.isOperational).toBe(false);
      expect(exception.cause).toBe(error);
    }
  });

  it('map PrismaClientUnknownRequestError chứa lỗi rớt kết nối sang SERVICE_UNAVAILABLE (503)', () => {
    const error = new Prisma.PrismaClientUnknownRequestError(
      'Connection terminated unexpectedly',
      { clientVersion: '7.8.0' },
    );

    const exception = PrismaErrorMapper.map(error);
    expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(exception.errorCode).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(exception.isOperational).toBe(false);
    expect(exception.cause).toBe(error);
  });

  it('map PrismaClientUnknownRequestError không phải lỗi kết nối sang INTERNAL_ERROR (500)', () => {
    const error = new Prisma.PrismaClientUnknownRequestError(
      'Unexpected SQL grammar fault',
      { clientVersion: '7.8.0' },
    );

    const exception = PrismaErrorMapper.map(error);
    expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(exception.errorCode).toBe(ErrorCode.INTERNAL_ERROR);
    expect(exception.isOperational).toBe(false);
  });

  it('map raw pg Error Connection terminated unexpectedly sang SERVICE_UNAVAILABLE (503)', () => {
    const error = new Error('Connection terminated unexpectedly');

    const exception = PrismaErrorMapper.map(error);
    expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(exception.errorCode).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(exception.isOperational).toBe(false);
    expect(exception.cause).toBe(error);
  });
});
