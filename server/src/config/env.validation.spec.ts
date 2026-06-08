import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const VALID_ENV = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key-value',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-value',
    SUPABASE_JWT_SECRET: 'jwt-secret-value',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    OPENAI_API_KEY: 'sk-test-key',
  };

  it('parse thành công và trả về default values khi các optional field bị thiếu', () => {
    const result = validateEnv(VALID_ENV);

    expect(result.SUPABASE_URL).toBe('https://example.supabase.co');
    expect(result.REDIS_HOST).toBe('localhost');
    expect(result.REDIS_PORT).toBe(6379);
    expect(result.PORT).toBe(3000);
    expect(result.AUTH_ENABLED).toBe('true');
    expect(result.MOCK_USER_ID).toBeUndefined();
    expect(result.NODE_ENV).toBe('development');
    expect(result.CLIENT_URL).toBe('http://localhost:5173');
  });

  it('giữ lại cấu hình tắt auth cho local dev', () => {
    const mockUserId = '110235ac-6613-4ef3-bdff-715f4cd5d7fc';
    const result = validateEnv({
      ...VALID_ENV,
      AUTH_ENABLED: 'false',
      MOCK_USER_ID: mockUserId,
    });

    expect(result.AUTH_ENABLED).toBe('false');
    expect(result.MOCK_USER_ID).toBe(mockUserId);
  });

  it('ném lỗi khi tắt auth nhưng MOCK_USER_ID không phải UUID', () => {
    expect(() =>
      validateEnv({
        ...VALID_ENV,
        AUTH_ENABLED: 'false',
        MOCK_USER_ID: 'dev-user-1',
      }),
    ).toThrow();
  });

  it('ném lỗi khi thiếu required field OPENAI_API_KEY', () => {
    const { OPENAI_API_KEY: _omit, ...missingKey } = VALID_ENV;
    expect(() => validateEnv(missingKey)).toThrow();
  });
});
