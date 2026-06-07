import { test, expect } from '@playwright/test'

const SESSION_ID = 'sess-abc'
const MOCK_QUESTIONS = [
  { id: 'q1', content: 'Hãy giới thiệu về bản thân bạn.', orderIndex: 0 },
  { id: 'q2', content: 'Điểm mạnh của bạn là gì?', orderIndex: 1 },
]

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/v1/user**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'u1', email: 'test@example.com' }),
    })
  })

  await page.route(`**/api/v1/sessions/${SESSION_ID}/questions`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ questions: MOCK_QUESTIONS }),
    })
  })

  await page.route(`**/api/v1/sessions/${SESSION_ID}/events**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: { 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
      body: '',
    })
  })
})

test('câu hỏi đầu tiên hiển thị sau khi load', async ({ page }) => {
  await page.goto(`/sessions/${SESSION_ID}`)
  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({ timeout: 10000 })
})

test('mode toggle giữa Text và Giọng nói', async ({ page }) => {
  await page.goto(`/sessions/${SESSION_ID}`)
  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({ timeout: 10000 })

  const voiceBtn = page.getByRole('button', { name: 'Giọng nói' })
  await voiceBtn.click()
  await expect(page.getByRole('button', { name: 'Text' })).toBeVisible()

  const textBtn = page.getByRole('button', { name: 'Text' })
  await textBtn.click()
})

test('text mode: submit answer gọi POST /turns', async ({ page }) => {
  let turnCalled = false
  await page.route(`**/api/v1/sessions/${SESSION_ID}/turns`, async (route) => {
    turnCalled = true
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'turn-1' }),
    })
  })
  await page.route(`**/api/v1/sessions/${SESSION_ID}/status`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.goto(`/sessions/${SESSION_ID}`)
  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({ timeout: 10000 })

  const textarea = page.getByRole('textbox')
  await textarea.fill('Tôi là sinh viên CNTT năm 4, có kinh nghiệm thực tập frontend 3 tháng.')
  await page.getByRole('button', { name: /gửi|submit/i }).click()

  await expect.poll(() => turnCalled).toBe(true)
})

test('khi session kết thúc, hiện nút "Xem báo cáo"', async ({ page }) => {
  await page.route(`**/api/v1/sessions/${SESSION_ID}/status`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
  await page.route(`**/api/v1/sessions/${SESSION_ID}/turns`, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'turn-1' }),
    })
  })

  await page.goto(`/sessions/${SESSION_ID}`)
  await expect(page.getByText(MOCK_QUESTIONS[0].content)).toBeVisible({ timeout: 10000 })

  for (let i = 0; i < MOCK_QUESTIONS.length; i++) {
    const textarea = page.getByRole('textbox')
    await textarea.fill('Câu trả lời mẫu cho câu hỏi này.')
    await page.getByRole('button', { name: /gửi|submit/i }).click()
    if (i < MOCK_QUESTIONS.length - 1) {
      await expect(page.getByText(MOCK_QUESTIONS[i + 1].content)).toBeVisible({ timeout: 5000 })
    }
  }

  await expect(page.getByRole('button', { name: 'Xem báo cáo' })).toBeVisible({ timeout: 5000 })
})
