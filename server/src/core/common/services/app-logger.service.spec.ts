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

    it('che giấu cookie, client_secret và private_key', () => {
      const input = {
        cookie: 'session_id=secret_cookie_val',
        client_secret: 'oauth_secret_abc',
        privateKey: '-----BEGIN RSA PRIVATE KEY-----',
        publicField: 'public-data',
      };

      const result = redactSensitiveData(input) as Record<string, any>;
      expect(result.cookie).toBe('[REDACTED]');
      expect(result.client_secret).toBe('[REDACTED]');
      expect(result.privateKey).toBe('[REDACTED]');
      expect(result.publicField).toBe('public-data');
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

    it('bổ sung userId và durationMs khi có trong RequestContext', () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      RequestContext.run(
        {
          requestId: 'req-prod-user',
          correlationId: 'corr-prod-user',
          userId: 'usr-abc-123',
          startTime: Date.now() - 50,
        },
        () => {
          logger.log('User action', 'UserContext');
        },
      );

      expect(consoleSpy).toHaveBeenCalled();
      const rawJson = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(rawJson);

      expect(parsed.userId).toBe('usr-abc-123');
      expect(typeof parsed.durationMs).toBe('number');
      expect(parsed.durationMs).toBeGreaterThanOrEqual(0);

      consoleSpy.mockRestore();
    });

    it('in JSON structured qua console.error khi gọi logger.error ở production', () => {
      process.env.NODE_ENV = 'production';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      RequestContext.run(
        {
          requestId: 'req-err-123',
          correlationId: 'corr-err-123',
          userId: 'usr-err-123',
          startTime: Date.now() - 100,
        },
        () => {
          logger.error(
            'Database failure',
            'Error: Connection timeout\n  at db.query',
            'DatabaseContext',
            { password: 'db-pass-secret' },
          );
        },
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      const rawJson = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(rawJson);

      expect(parsed.level).toBe('error');
      expect(parsed.context).toBe('DatabaseContext');
      expect(parsed.correlationId).toBe('corr-err-123');
      expect(parsed.userId).toBe('usr-err-123');
      expect(parsed.message).toBe('Database failure');
      expect(parsed.stack).toContain('Connection timeout');
      expect(parsed.meta.password).toBe('[REDACTED]');

      consoleErrorSpy.mockRestore();
    });
  });
});
