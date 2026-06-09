import { z } from 'zod';

const EnvSchema = z
  .object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_JWT_SECRET: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    AUDIO_ALLOWED_HOSTS: z.string().optional(),
    PORT: z.coerce.number().default(3000),
    AUTH_ENABLED: z.enum(['true', 'false']).default('true'),
    MOCK_USER_ID: z.string().uuid().optional(),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
  })
  .superRefine((env, ctx) => {
    if (env.AUTH_ENABLED === 'false' && !env.MOCK_USER_ID) {
      ctx.addIssue({
        code: 'custom',
        path: ['MOCK_USER_ID'],
        message:
          'MOCK_USER_ID must be a valid existing user UUID when auth is disabled',
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return EnvSchema.parse(config);
}
