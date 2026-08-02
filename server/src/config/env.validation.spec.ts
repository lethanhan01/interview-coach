import { validateEnv } from './env.validation';

const validEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-value',
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
  it('validates local authentication configuration', () => {
    const result = validateEnv(validEnv);
    expect(result.AUTH_COOKIE_NAME).toBe('interviewcoach_auth');
    expect(result.AUTH_COOKIE_MAX_AGE).toBe(86_400);
    expect(result.SMTP_PORT).toBe(587);
  });

  it('rejects a short local JWT secret', () => {
    expect(() => validateEnv({ ...validEnv, AUTH_JWT_SECRET: 'short' })).toThrow();
  });
});
