import { test, expect } from '@playwright/test'

const MOCK_SESSION_ID = 'session-abc123'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/sessions', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: MOCK_SESSION_ID }),
      })
    } else {
      await route.continue()
    }
  })
})

test('nút Tiếp theo disabled khi JD < 100 ký tự', async ({ page }) => {
  await page.goto('/setup')
  const nextBtn = page.getByRole('button', { name: 'Tiếp theo' })
  await expect(nextBtn).toBeDisabled()

  const textarea = page.getByLabel('Nội dung Job Description')
  await textarea.fill('x'.repeat(50))
  await expect(nextBtn).toBeDisabled()
})

test('nút Tiếp theo enabled khi JD >= 100 ký tự', async ({ page }) => {
  await page.goto('/setup')
  const textarea = page.getByLabel('Nội dung Job Description')
  await textarea.fill('x'.repeat(100))

  const nextBtn = page.getByRole('button', { name: 'Tiếp theo' })
  await expect(nextBtn).toBeEnabled()
})

test('có thể đi qua bước 1 → 2 → 3 và quay lại', async ({ page }) => {
  await page.goto('/setup')

  await page.getByLabel('Nội dung Job Description').fill('x'.repeat(100))
  await page.getByRole('button', { name: 'Tiếp theo' }).click()

  await expect(page.getByText('Chọn loại phỏng vấn')).toBeVisible()

  await page.getByRole('button', { name: 'Tiếp theo' }).click()
  await expect(page.getByText('Xác nhận')).toBeVisible()

  await page.getByRole('button', { name: 'Quay lại' }).click()
  await expect(page.getByText('Chọn loại phỏng vấn')).toBeVisible()
})

test('submit bước 3 redirect sang /sessions/:id', async ({ page }) => {
  await page.goto('/setup')

  await page.getByLabel('Nội dung Job Description').fill('x'.repeat(100))
  await page.getByRole('button', { name: 'Tiếp theo' }).click()
  await page.getByRole('button', { name: 'Tiếp theo' }).click()
  await page.getByRole('button', { name: 'Bắt đầu phỏng vấn' }).click()

  await expect(page).toHaveURL(new RegExp(`/sessions/${MOCK_SESSION_ID}`))
})
