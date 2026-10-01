import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5433/interviewcoach_test?schema=public';
process.env.DIRECT_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379';
process.env.WORKERS_ENABLED = 'false';
process.env.APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
process.env.MEDIA_STORAGE_PATH =
  process.env.MEDIA_STORAGE_PATH ?? './uploads/audio-test';
process.env.AUTH_JWT_SECRET =
  process.env.AUTH_JWT_SECRET ??
  'test_jwt_secret_must_be_at_least_32_characters';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '2525';
process.env.SMTP_USER = 'test';
process.env.SMTP_PASSWORD = 'test';
process.env.SMTP_FROM = 'test@example.com';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'test';
process.env.OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL ?? 'http://127.0.0.1:1234/v1';
