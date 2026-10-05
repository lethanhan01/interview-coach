import { AppLogger, redactSensitiveData } from './app-logger.service';
import { RequestContext } from '../context/request-context';

describe('AppLogger', () => {
  let logger: AppLogger;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    logger = new AppLogger();
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('redactSensitiveData', () => {
    it('che giấu các trường nhạy cảm', () => {
      const input = {
        email: 'user@example.com',
        password: 'super-secret-password',
        token: 'jwt-access-token',
        nested: {
          apiKey: 'secret-api-key',
          visible: 'hello',
        },
      };

      const result = redactSensitiveData(input) as Record<string, any>;
      expect(result.email).toBe('user@example.com');
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.nested.apiKey).toBe('[REDACTED]');
      expect(result.nested.visible).toBe('hello');
    });

    it('xử lý an toàn tham chiếu vòng (circular references)', () => {
      const obj: Record<string, any> = { name: 'circular' };
      obj.self = obj;

      const result = redactSensitiveData(obj) as Record<string, any>;
      expect(result.name).toBe('circular');
      expect(result.self).toBe('[CIRCULAR]');
    });

    it('xử lý mảng (arrays)', () => {
      const input = [
        { password: '123' },
        { title: 'Normal' },
      ];

      const result = redactSensitiveData(input) as any[];
      expect(result[0].password).toBe('[REDACTED]');
      expect(result[1].title).toBe('Normal');
    });
  });

  describe('formatLog in dev vs prod', () => {
    it('in log có correlationId từ RequestContext', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      RequestContext.run(
        {
          requestId: 'req-1',
          correlationId: 'corr-xyz-12345678',
          startTime: Date.now(),
        },
        () => {
          logger.log('Test message', 'TestContext');
        },
      );

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('[trace:corr-xyz]');
      expect(output).toContain('[TestContext]');
      expect(output).toContain('Test message');

      consoleSpy.mockRestore();
    });

    it('in JSON structured một dòng khi NODE_ENV là production', () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      RequestContext.run(
        {
          requestId: 'req-prod',
          correlationId: 'corr-prod-123',
          startTime: Date.now(),
        },
        () => {
          logger.log('Production event', 'ProdContext', { secret: '123456' });
        },
      );

      expect(consoleSpy).toHaveBeenCalled();
      const rawJson = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(rawJson);

      expect(parsed.level).toBe('info');
      expect(parsed.context).toBe('ProdContext');
      expect(parsed.correlationId).toBe('corr-prod-123');
      expect(parsed.message).toBe('Production event');
      expect(parsed.meta.secret).toBe('[REDACTED]');

      consoleSpy.mockRestore();
    });
  });
});
