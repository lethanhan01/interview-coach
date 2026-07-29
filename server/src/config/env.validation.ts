import { z } from 'zod';
import { DEFAULT_DB_TIME_ZONE } from '../prisma/db-timezone';

const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DB_TIMEZONE: z
    .string()
    .trim()
    .min(1)
    .regex(/^[A-Za-z0-9_/+.-]+$/)
    .default(DEFAULT_DB_TIME_ZONE),
  PRISMA_POOL_MAX: z.coerce.number().int().positive().default(5),
  PRISMA_CONNECTION_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30_000),
  PRISMA_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  PRISMA_TRANSACTION_MAX_WAIT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15_000),
  PRISMA_TRANSACTION_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30_000),
  PRISMA_CONNECT_RETRIES: z.coerce.number().int().positive().default(3),
  PRISMA_CONNECT_RETRY_DELAY_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(1_500),
  OPENAI_API_KEY: z.string().min(1).default('lm-studio'),
  OPENAI_BASE_URL: z.string().url().default('http://127.0.0.1:1234/v1'),
  OPENAI_CHAT_MODEL: z.string().min(1).default('google/gemma-4-e4b'),
  OPENAI_FEEDBACK_MODEL: z.string().min(1).optional(),
  OPENAI_REPORT_MODEL: z.string().min(1).optional(),
  OPENAI_JSON_MODE: z.enum(['true', 'false']).default('false'),
  OPENAI_TIMEOUT_MS: z.coerce.number().positive().default(30_000),
  OPENAI_FEEDBACK_TIMEOUT_MS: z.coerce.number().positive().default(420_000),
  OPENAI_REPORT_TIMEOUT_MS: z.coerce.number().positive().default(600_000),
  OPENAI_QUESTION_TIMEOUT_MS: z.coerce.number().positive().default(240_000),
  OPENAI_QUESTION_MAX_TOKENS: z.coerce.number().int().positive().default(2_400),
  FEEDBACK_WORKER_CONCURRENCY: z.coerce.number().int().min(1).default(2),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  AUDIO_ALLOWED_HOSTS: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  SESSION_CREATION_LIMIT_PER_24H: z.coerce.number().int().min(0).default(10),
  AUTH_ENABLED: z.enum(['true', 'false']).default('false'),
  MOCK_USER_ID: z.string().uuid().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return EnvSchema.parse(config);
}
