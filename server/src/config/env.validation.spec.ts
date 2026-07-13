import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const VALID_ENV = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key-value',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-value',
    SUPABASE_JWT_SECRET: 'jwt-secret-value',
    DATABASE_URL: 'postgresql://localhost:5432/test',
  };

  it('parse thành công và trả về default values khi các optional field bị thiếu', () => {
    const result = validateEnv(VALID_ENV);

    expect(result.SUPABASE_URL).toBe('https://example.supabase.co');
    expect(result.REDIS_HOST).toBe('localhost');
    expect(result.REDIS_PORT).toBe(6379);
    expect(result.PORT).toBe(3000);
    expect(result.SESSION_CREATION_LIMIT_PER_24H).toBe(10);
    expect(result.DB_TIMEZONE).toBe('Asia/Ho_Chi_Minh');
    expect(result.AUTH_ENABLED).toBe('false');
    expect(result.MOCK_USER_ID).toBeUndefined();
    expect(result.NODE_ENV).toBe('development');
    expect(result.CLIENT_URL).toBe('http://localhost:5173');
    expect(result.OPENAI_API_KEY).toBe('lm-studio');
    expect(result.OPENAI_BASE_URL).toBe('http://127.0.0.1:1234/v1');
    expect(result.OPENAI_CHAT_MODEL).toBe('google/gemma-4-e4b');
    expect(result.OPENAI_FEEDBACK_MODEL).toBeUndefined();
    expect(result.OPENAI_REPORT_MODEL).toBeUndefined();
    expect(result.OPENAI_JSON_MODE).toBe('false');
    expect(result.OPENAI_TIMEOUT_MS).toBe(30000);
    expect(result.OPENAI_FEEDBACK_TIMEOUT_MS).toBe(420000);
    expect(result.OPENAI_REPORT_TIMEOUT_MS).toBe(600000);
    expect(result.OPENAI_QUESTION_TIMEOUT_MS).toBe(240000);
    expect(result.OPENAI_QUESTION_MAX_TOKENS).toBe(2400);
    expect(result.FEEDBACK_WORKER_CONCURRENCY).toBe(2);
    expect(result.PRISMA_POOL_MAX).toBe(5);
    expect(result.PRISMA_CONNECTION_TIMEOUT_MS).toBe(30000);
    expect(result.PRISMA_IDLE_TIMEOUT_MS).toBe(30000);
    expect(result.PRISMA_TRANSACTION_MAX_WAIT_MS).toBe(15000);
    expect(result.PRISMA_TRANSACTION_TIMEOUT_MS).toBe(30000);
    expect(result.PRISMA_CONNECT_RETRIES).toBe(3);
    expect(result.PRISMA_CONNECT_RETRY_DELAY_MS).toBe(1500);
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

  it('ném lỗi khi MOCK_USER_ID không phải UUID', () => {
    expect(() =>
      validateEnv({
        ...VALID_ENV,
        MOCK_USER_ID: 'dev-user-1',
      }),
    ).toThrow();
  });

  it('giữ lại cấu hình local OpenAI-compatible khi được khai báo', () => {
    const result = validateEnv({
      ...VALID_ENV,
      OPENAI_API_KEY: 'local-key',
      OPENAI_BASE_URL: 'http://127.0.0.1:1234/v1',
      OPENAI_CHAT_MODEL: 'google/gemma-4-e4b',
      OPENAI_FEEDBACK_MODEL: 'qwen-feedback',
      OPENAI_REPORT_MODEL: 'qwen-report',
      OPENAI_JSON_MODE: 'true',
      OPENAI_TIMEOUT_MS: '45000',
      OPENAI_FEEDBACK_TIMEOUT_MS: '80000',
      OPENAI_REPORT_TIMEOUT_MS: '70000',
      OPENAI_QUESTION_MAX_TOKENS: '3600',
      FEEDBACK_WORKER_CONCURRENCY: '3',
    });

    expect(result.OPENAI_API_KEY).toBe('local-key');
    expect(result.OPENAI_BASE_URL).toBe('http://127.0.0.1:1234/v1');
    expect(result.OPENAI_CHAT_MODEL).toBe('google/gemma-4-e4b');
    expect(result.OPENAI_FEEDBACK_MODEL).toBe('qwen-feedback');
    expect(result.OPENAI_REPORT_MODEL).toBe('qwen-report');
    expect(result.OPENAI_JSON_MODE).toBe('true');
    expect(result.OPENAI_TIMEOUT_MS).toBe(45000);
    expect(result.OPENAI_FEEDBACK_TIMEOUT_MS).toBe(80000);
    expect(result.OPENAI_REPORT_TIMEOUT_MS).toBe(70000);
    expect(result.OPENAI_QUESTION_MAX_TOKENS).toBe(3600);
    expect(result.FEEDBACK_WORKER_CONCURRENCY).toBe(3);
  });

  it('cho phép tắt giới hạn tạo session trong local dev bằng giá trị 0', () => {
    const result = validateEnv({
      ...VALID_ENV,
      SESSION_CREATION_LIMIT_PER_24H: '0',
    });

    expect(result.SESSION_CREATION_LIMIT_PER_24H).toBe(0);
  });

  it('cho phép cấu hình DB_TIMEZONE hợp lệ', () => {
    const result = validateEnv({
      ...VALID_ENV,
      DB_TIMEZONE: 'Asia/Ho_Chi_Minh',
    });

    expect(result.DB_TIMEZONE).toBe('Asia/Ho_Chi_Minh');
  });

  it('cho phép tinh chỉnh pool và retry của Prisma', () => {
    const result = validateEnv({
      ...VALID_ENV,
      PRISMA_POOL_MAX: '8',
      PRISMA_CONNECTION_TIMEOUT_MS: '45000',
      PRISMA_IDLE_TIMEOUT_MS: '60000',
      PRISMA_TRANSACTION_MAX_WAIT_MS: '20000',
      PRISMA_TRANSACTION_TIMEOUT_MS: '45000',
      PRISMA_CONNECT_RETRIES: '4',
      PRISMA_CONNECT_RETRY_DELAY_MS: '2000',
    });

    expect(result.PRISMA_POOL_MAX).toBe(8);
    expect(result.PRISMA_CONNECTION_TIMEOUT_MS).toBe(45000);
    expect(result.PRISMA_IDLE_TIMEOUT_MS).toBe(60000);
    expect(result.PRISMA_TRANSACTION_MAX_WAIT_MS).toBe(20000);
    expect(result.PRISMA_TRANSACTION_TIMEOUT_MS).toBe(45000);
    expect(result.PRISMA_CONNECT_RETRIES).toBe(4);
    expect(result.PRISMA_CONNECT_RETRY_DELAY_MS).toBe(2000);
  });

  it('từ chối DB_TIMEZONE rỗng', () => {
    expect(() =>
      validateEnv({
        ...VALID_ENV,
        DB_TIMEZONE: '',
      }),
    ).toThrow();
  });

  it('từ chối FEEDBACK_WORKER_CONCURRENCY nhỏ hơn 1', () => {
    expect(() =>
      validateEnv({
        ...VALID_ENV,
        FEEDBACK_WORKER_CONCURRENCY: '0',
      }),
    ).toThrow();
  });

  it('từ chối cấu hình Prisma timeout không hợp lệ', () => {
    expect(() =>
      validateEnv({
        ...VALID_ENV,
        PRISMA_CONNECTION_TIMEOUT_MS: '0',
      }),
    ).toThrow();
  });
});
