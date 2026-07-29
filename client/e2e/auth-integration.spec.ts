import { expect, test } from '@playwright/test'

const hasSupabaseTestCredentials = Boolean(
  process.env.E2E_SUPABASE_URL
  && process.env.E2E_SUPABASE_PUBLISHABLE_KEY
  && process.env.E2E_TEST_EMAIL
  && process.env.E2E_TEST_PASSWORD,
)

test('email login returns an authenticated test user to next', async ({ page }) => {
  test.skip(!hasSupabaseTestCredentials, 'Supabase test-project credentials are required')

  await page.goto('/login?next=/setup')
  await page.getByRole('textbox', { name: /email/i }).fill(process.env.E2E_TEST_EMAIL!)
  await page.getByLabel(/mật khẩu/i).fill(process.env.E2E_TEST_PASSWORD!)
  await page.getByRole('button', { name: /đăng nhập/i }).click()
  await expect(page).toHaveURL(/\/setup$/)
})
