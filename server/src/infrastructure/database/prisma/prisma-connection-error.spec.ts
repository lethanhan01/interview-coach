import {
  formatDatabaseStartupError,
  isPgConnectionDropError,
  isTransientPrismaConnectionError,
} from './prisma-connection-error';

describe('isTransientPrismaConnectionError', () => {
  it('nhận diện timeout bị bọc trong cause của pg-pool', () => {
    const error = new Error('Connection terminated due to connection timeout');
    (error as Error & { cause?: Error }).cause = new Error(
      'Connection terminated unexpectedly',
    );

    expect(isTransientPrismaConnectionError(error)).toBe(true);
  });

  it('nhận diện mã lỗi kết nối của Prisma', () => {
    expect(isTransientPrismaConnectionError({ code: 'P1001' })).toBe(true);
  });

  it('nhận diện mã lỗi mạng khi môi trường chặn truy cập database', () => {
    expect(isTransientPrismaConnectionError({ code: 'EACCES' })).toBe(true);
  });

  it('không coi lỗi xác thực database là lỗi tạm thời', () => {
    expect(
      isTransientPrismaConnectionError(
        new Error('password authentication failed for user "postgres"'),
      ),
    ).toBe(false);
  });
});

describe('formatDatabaseStartupError', () => {
  it('gom message chính và cause để log đủ ngữ cảnh', () => {
    const error = new Error('Connection terminated due to connection timeout');
    (error as Error & { cause?: Error }).cause = new Error(
      'Connection terminated unexpectedly',
    );

    expect(formatDatabaseStartupError(error)).toContain(
      'Connection terminated due to connection timeout',
    );
    expect(formatDatabaseStartupError(error)).toContain(
      'Connection terminated unexpectedly',
    );
  });
});

describe('isPgConnectionDropError', () => {
  it('nhận diện các lỗi rớt kết nối đặc trưng của pg/PostgreSQL', () => {
    expect(
      isPgConnectionDropError(new Error('Connection terminated unexpectedly')),
    ).toBe(true);
    expect(
      isPgConnectionDropError(
        new Error('Connection terminated due to connection timeout'),
      ),
    ).toBe(true);
    expect(
      isPgConnectionDropError(
        new Error(
          'Client has encountered a connection error and is not queryable',
        ),
      ),
    ).toBe(true);
  });

  it('nhận diện mã lỗi Prisma connection/transaction được bọc trong Error', () => {
    const err = Object.assign(new Error('Server closed connection'), {
      code: 'P1017',
    });
    expect(isPgConnectionDropError(err)).toBe(true);

    const txErr = Object.assign(new Error('Transaction timeout'), {
      code: 'P2028',
    });
    expect(isPgConnectionDropError(txErr)).toBe(true);
  });

  it('không nhận nhầm lỗi ngoài DB (EACCES, ENOTFOUND, lỗi nghiệp vụ, non-Error)', () => {
    expect(
      isPgConnectionDropError(
        Object.assign(new Error('permission denied'), { code: 'EACCES' }),
      ),
    ).toBe(false);
    expect(
      isPgConnectionDropError(
        Object.assign(new Error('getaddrinfo ENOTFOUND api.openai.com'), {
          code: 'ENOTFOUND',
        }),
      ),
    ).toBe(false);
    expect(isPgConnectionDropError(new Error('Unexpected crash'))).toBe(false);
    expect(isPgConnectionDropError('Connection terminated unexpectedly')).toBe(
      false,
    );
  });
});
