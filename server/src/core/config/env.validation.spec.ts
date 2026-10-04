import { validateEnv } from './env.validation';

const validEnv = {
  APP_URL: 'http://localhost:3000',
  MEDIA_STORAGE_PATH: './uploads/audio',
  AUTH_JWT_SECRET: 'a-very-long-local-auth-secret-for-tests',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_USER: 'user',
  SMTP_PASSWORD: 'password',
  SMTP_FROM: 'no-reply@example.com',
  PASSWORD_RESET_OTP_TTL_MINUTES: '30',
  DATABASE_URL: 'postgresql://localhost:5432/test',
};

describe('validateEnv', () => {
  it('validates local authentication and storage configuration', () => {
    const result = validateEnv(validEnv);
    expect(result.APP_URL).toBe('http://localhost:3000');
    expect(result.MEDIA_STORAGE_PATH).toBe('./uploads/audio');
    expect(result.MEDIA_SIGNED_URL_TTL_SECONDS).toBe(1800);
    expect(result.AUTH_COOKIE_NAME).toBe('interviewcoach_auth');
    expect(result.AUTH_COOKIE_MAX_AGE).toBe(86_400);
    expect(result.SMTP_PORT).toBe(587);
  });

  it('rejects a short local JWT secret', () => {
    expect(() =>
      validateEnv({ ...validEnv, AUTH_JWT_SECRET: 'short' }),
    ).toThrow();
  });

  it('validates optional auth cookie and redis variables when provided', () => {
    const result = validateEnv({
      ...validEnv,
      AUTH_ACCESS_COOKIE_NAME: 'custom_access_cookie',
      AUTH_REFRESH_COOKIE_NAME: 'custom_refresh_cookie',
      AUTH_ACCESS_COOKIE_MAX_AGE: '1200',
      AUTH_REFRESH_COOKIE_MAX_AGE: '1209600',
      REDIS_PASSWORD: 'secure_redis_password',
    });
    expect(result.AUTH_ACCESS_COOKIE_NAME).toBe('custom_access_cookie');
    expect(result.AUTH_REFRESH_COOKIE_NAME).toBe('custom_refresh_cookie');
    expect(result.AUTH_ACCESS_COOKIE_MAX_AGE).toBe(1200);
    expect(result.AUTH_REFRESH_COOKIE_MAX_AGE).toBe(1209600);
    expect(result.REDIS_PASSWORD).toBe('secure_redis_password');
  });
});
