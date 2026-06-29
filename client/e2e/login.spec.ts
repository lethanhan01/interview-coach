import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/v1/token**', async (route) => {
    const body = route.request().postDataJSON()
    if (body?.email === 'valid@example.com') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: 'fake-token', user: { id: 'u1' } }),
      })
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error_description: 'Invalid login credentials' }),
      })
    }
  })
})

test('hiển thị form đăng nhập', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
})

test('nút submit hiện loading khi đang gửi', async ({ page }) => {
  await page.goto('/login')
  const emailInput = page.getByRole('textbox', { name: /email/i })
  await emailInput.fill('valid@example.com')

  const submitBtn = page.getByRole('button', { name: /đăng nhập|gửi|magic link/i })
  await submitBtn.click()
  await expect(submitBtn).toBeDisabled()
})

test('hiện thông báo lỗi khi email không hợp lệ', async ({ page }) => {
  await page.goto('/login')
  const emailInput = page.getByRole('textbox', { name: /email/i })
  await emailInput.fill('invalid@example.com')

  await page.getByRole('button', { name: /đăng nhập|gửi|magic link/i }).click()
  await expect(page.getByRole('alert')).toBeVisible()
})
