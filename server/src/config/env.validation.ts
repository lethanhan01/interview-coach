import { z } from 'zod';

const EnvSchema = z
  .object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_JWT_SECRET: z.string().min(1).default('mvp-jwt-secret'),
    DATABASE_URL: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1).default('lm-studio'),
    OPENAI_BASE_URL: z.string().url().default('http://127.0.0.1:1234/v1'),
    OPENAI_CHAT_MODEL: z.string().min(1).default('google/gemma-4-e4b'),
    OPENAI_JSON_MODE: z.enum(['true', 'false']).default('false'),
    OPENAI_TIMEOUT_MS: z.coerce.number().positive().default(30_000),
    OPENAI_FEEDBACK_TIMEOUT_MS: z.coerce.number().positive().default(300_000),
    OPENAI_QUESTION_TIMEOUT_MS: z.coerce.number().positive().default(120_000),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    AUDIO_ALLOWED_HOSTS: z.string().optional(),
    PORT: z.coerce.number().default(3000),
    SESSION_CREATION_LIMIT_PER_24H: z.coerce
      .number()
      .int()
      .min(0)
      .default(10),
    AUTH_ENABLED: z.enum(['true', 'false']).default('false'),
    MOCK_USER_ID: z.string().uuid().optional(),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
  });

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return EnvSchema.parse(config);
}
