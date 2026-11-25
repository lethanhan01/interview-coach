const prismaPgMock = jest.fn();

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: prismaPgMock,
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
    $queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
  },
}));

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  const originalDatabaseUrl = process.env['DATABASE_URL'];

  beforeEach(() => {
    prismaPgMock.mockClear();
    process.env['DATABASE_URL'] =
      'postgresql://user:pass@127.0.0.1:5432/interviewai?sslmode=disable';
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env['DATABASE_URL'];
    } else {
      process.env['DATABASE_URL'] = originalDatabaseUrl;
    }
  });

  it('cấu hình pg.Pool với keepAlive, keepAliveInitialDelayMillis, maxLifetimeSeconds và error callbacks', () => {
    const service = new PrismaService();
    expect(prismaPgMock).toHaveBeenCalledTimes(1);

    const [poolConfig, adapterOptions] = prismaPgMock.mock.calls[0] as [
      Record<string, unknown>,
      {
        onPoolError?: (err: Error) => void;
        onConnectionError?: (err: Error) => void;
      },
    ];

    expect(poolConfig).toMatchObject({
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
      maxLifetimeSeconds: 1_800,
    });
    expect(typeof adapterOptions?.onPoolError).toBe('function');
    expect(typeof adapterOptions?.onConnectionError).toBe('function');

    const warnSpy = jest
      .spyOn((service as unknown as { logger: { warn: jest.Mock } }).logger, 'warn')
      .mockImplementation(() => undefined);

    expect(() =>
      adapterOptions.onPoolError?.(
        new Error('Connection terminated unexpectedly'),
      ),
    ).not.toThrow();
    expect(() =>
      adapterOptions.onConnectionError?.(new Error('socket hang up')),
    ).not.toThrow();

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('PostgreSQL idle pool client error'),
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('PostgreSQL active connection error'),
    );
  });

  it('onModuleDestroy bắt lỗi an toàn nếu $disconnect thất bại trong lúc shutdown', async () => {
    const service = new PrismaService();
    const warnSpy = jest
      .spyOn((service as unknown as { logger: { warn: jest.Mock } }).logger, 'warn')
      .mockImplementation(() => undefined);
    jest
      .spyOn(service, '$disconnect')
      .mockRejectedValueOnce(new Error('Connection terminated unexpectedly'));

    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Prisma disconnect encountered an error'),
    );
  });
});
