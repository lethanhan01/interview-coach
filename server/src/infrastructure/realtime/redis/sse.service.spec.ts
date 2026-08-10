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
});
