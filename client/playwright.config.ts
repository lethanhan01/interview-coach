import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_AUTH_ENABLED: 'true',
      NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.E2E_SUPABASE_PUBLISHABLE_KEY ?? 'test-publishable-key',
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000/api/v1',
    },
  },
})
