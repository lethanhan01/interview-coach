import { test, expect, type Page } from '@playwright/test'

const MOCK_SESSION_ID = 'session-abc123'
const VALID_REQUIREMENTS = 'Có kinh nghiệm React, TypeScript và làm việc với REST API.'
const VALID_JOB_CONTENT = 'Phát triển giao diện web, phối hợp backend và tối ưu trải nghiệm người dùng.'

async function fillValidJd(page: Page) {
  await page.getByLabel('Tên công ty').fill('FPT Software')
  await page.locator('select').first().selectOption('Frontend Developer')
  await page.getByLabel('Yêu cầu').fill(VALID_REQUIREMENTS)
  await page.getByLabel('Nội dung công việc').fill(VALID_JOB_CONTENT)
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/saved-job-descriptions', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      })
      return
    }

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'saved-jd-1' }),
    })
  })

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

test('nút Tiếp theo disabled khi JD chưa đủ thông tin bắt buộc', async ({ page }) => {
  await page.goto('/setup')
  const nextBtn = page.getByRole('button', { name: 'Tiếp theo' })
  await expect(nextBtn).toBeDisabled()

  await page.getByLabel('Tên công ty').fill('FPT Software')
  await page.getByLabel('Yêu cầu').fill('x'.repeat(30))
  await expect(nextBtn).toBeDisabled()
})

test('nút Tiếp theo enabled khi JD hợp lệ', async ({ page }) => {
  await page.goto('/setup')
  await fillValidJd(page)

  const nextBtn = page.getByRole('button', { name: 'Tiếp theo' })
  await expect(nextBtn).toBeEnabled()
})

test('có thể đi qua bước 1 → 2 → 3 và quay lại', async ({ page }) => {
  await page.goto('/setup')

  await fillValidJd(page)
  await page.getByRole('button', { name: 'Tiếp theo' }).click()

  await expect(page.getByText('Loại phỏng vấn')).toBeVisible()

  await page.getByRole('button', { name: 'Tiếp theo' }).click()
  await expect(page.getByRole('heading', { name: 'Xác nhận' })).toBeVisible()

  await page.getByRole('button', { name: 'Quay lại' }).click()
  await expect(page.getByText('Loại phỏng vấn')).toBeVisible()
})

test('submit bước 3 redirect sang /sessions/:id', async ({ page }) => {
  await page.goto('/setup')

  await fillValidJd(page)
  await page.getByRole('button', { name: 'Tiếp theo' }).click()
  await page.getByRole('button', { name: 'Tiếp theo' }).click()
  await page.getByRole('button', { name: 'Bắt đầu phỏng vấn' }).click()

  await expect(page).toHaveURL(new RegExp(`/sessions/${MOCK_SESSION_ID}`))
})
