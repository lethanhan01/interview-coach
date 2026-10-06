import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SseService } from './sse.service';

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn(
      (_channel: string, callback?: (error: Error | null) => void) => {
        callback?.(null);
        return Promise.resolve(1);
      },
    ),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
    quit: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('SseService', () => {
  beforeEach(() => (Redis as unknown as jest.Mock).mockClear());

  it('chỉ unsubscribe Redis khi subscriber cuối cùng của channel đóng', () => {
    const service = new SseService({
      get: jest.fn((key: string) =>
        key === 'REDIS_PORT' ? 6379 : 'localhost',
      ),
    } as unknown as ConfigService);
    service.onModuleInit();
    const subscriber = (Redis as unknown as jest.Mock).mock.results[1]
      .value as { subscribe: jest.Mock; unsubscribe: jest.Mock };
    const first = service.subscribe('sse:session:1').subscribe();
    const second = service.subscribe('sse:session:1').subscribe();
    expect(subscriber.subscribe).toHaveBeenCalledTimes(1);
    first.unsubscribe();
    expect(subscriber.unsubscribe).not.toHaveBeenCalled();
    second.unsubscribe();
    expect(subscriber.unsubscribe).toHaveBeenCalledWith('sse:session:1');
  });

  it('emitError phát sự kiện error với payload chuẩn hóa { error: { code, message }, timestamp }', async () => {
    const service = new SseService({
      get: jest.fn((key: string) =>
        key === 'REDIS_PORT' ? 6379 : 'localhost',
      ),
    } as unknown as ConfigService);
    service.onModuleInit();
    const publisher = (Redis as unknown as jest.Mock).mock.results[0].value as {
      publish: jest.Mock;
    };

    await service.emitError('sse:session:1', 'AI_TIMEOUT', 'Request timed out');

    expect(publisher.publish).toHaveBeenCalledTimes(1);
    const [channel, payloadStr] = publisher.publish.mock.calls[0];
    expect(channel).toBe('sse:session:1');
    const payload = JSON.parse(payloadStr);
    expect(payload.event).toBe('session.error');
    expect(payload.data.error).toEqual({
      code: 'AI_TIMEOUT',
      message: 'Request timed out',
    });
    expect(payload.data.timestamp).toBeDefined();
  });

  describe('Redis timeouts', () => {
    const buildService = (overrides: Record<string, unknown> = {}) =>
      new SseService({
        get: jest.fn((key: string) => {
          if (key in overrides) return overrides[key];
          return key === 'REDIS_PORT' ? 6379 : 'localhost';
        }),
      } as unknown as ConfigService);

    it('dùng giá trị mặc định: connectTimeout 10s cho cả hai, commandTimeout 3s chỉ cho publisher', () => {
      buildService({
        REDIS_CONNECT_TIMEOUT_MS: undefined,
        REDIS_COMMAND_TIMEOUT_MS: undefined,
      }).onModuleInit();
      const calls = (Redis as unknown as jest.Mock).mock.calls;
      expect(calls[0][0]).toMatchObject({
        connectTimeout: 10_000,
        commandTimeout: 3_000,
      });
      expect(calls[1][0]).toMatchObject({ connectTimeout: 10_000 });
      expect(calls[1][0]).not.toHaveProperty('commandTimeout');
    });

    it('đọc giá trị cấu hình hợp lệ từ ConfigService', () => {
      buildService({
        REDIS_CONNECT_TIMEOUT_MS: 2_000,
        REDIS_COMMAND_TIMEOUT_MS: '1500',
      }).onModuleInit();
      const calls = (Redis as unknown as jest.Mock).mock.calls;
      expect(calls[0][0]).toMatchObject({
        connectTimeout: 2_000,
        commandTimeout: 1_500,
      });
      expect(calls[1][0]).toMatchObject({ connectTimeout: 2_000 });
    });

    it('giá trị không hợp lệ (NaN, <= 0) quay về mặc định', () => {
      buildService({
        REDIS_CONNECT_TIMEOUT_MS: 'abc',
        REDIS_COMMAND_TIMEOUT_MS: -5,
      }).onModuleInit();
      const calls = (Redis as unknown as jest.Mock).mock.calls;
      expect(calls[0][0]).toMatchObject({
        connectTimeout: 10_000,
        commandTimeout: 3_000,
      });
    });
  });
});
