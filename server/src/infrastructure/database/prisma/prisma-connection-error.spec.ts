import {
  formatDatabaseStartupError,
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
