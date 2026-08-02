import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/v1/token**', async (route) => {
    const body = route.request().postDataJSON()
    if (body?.email === 'valid@example.com') {
      await new Promise((resolve) => setTimeout(resolve, 250))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-token',
          refresh_token: 'fake-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'u1', email: 'valid@example.com' },
        }),
      })
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error_description: 'Invalid login credentials',
        }),
      })
    }
  })
})

test('hiển thị form đăng nhập', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
})

test('nút submit hiện loading khi đang gửi', async ({ page }) => {
  let releaseRequest: (() => void) | undefined
  await page.route('**/auth/v1/token**', async (route) => {
    await new Promise<void>((resolve) => {
      releaseRequest = resolve
    })
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error_description: 'Invalid login credentials' }),
    })
  })
  await page.goto('/login')
  const emailInput = page.getByRole('textbox', { name: /email/i })
  await emailInput.fill('valid@example.com')
  await page.getByLabel(/mật khẩu/i).fill('correct-password')

  const submitBtn = page.getByRole('button', { name: /đăng nhập|đang xử lý/i })
  await submitBtn.click()
  await expect(submitBtn).toBeDisabled()
  releaseRequest?.()
  await expect(submitBtn).toBeEnabled()
})

test('hiện thông báo lỗi khi email không hợp lệ', async ({ page }) => {
  await page.goto('/login')
  const emailInput = page.getByRole('textbox', { name: /email/i })
  await emailInput.fill('invalid@example.com')
  await page.getByLabel(/mật khẩu/i).fill('wrong-password')

  await page.getByRole('button', { name: /đăng nhập|gửi|magic link/i }).click()
  await expect(page.getByText('Invalid login credentials')).toBeVisible()
})
