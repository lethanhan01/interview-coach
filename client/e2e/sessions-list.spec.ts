import { test, expect } from '@playwright/test'
import type { Session } from '../lib/types'

const MOCK_ACTIVE: Session = {
  id: 'sess-active',
  userId: 'u1',
  sessionType: 'technical',
  contextPackId: 'VN',
  status: 'active',
  numQuestions: 5,
  jobDescription: 'Frontend Engineer at ABC',
  createdAt: '2026-06-07T10:00:00.000Z',
}

const MOCK_COMPLETED: Session = {
  id: 'sess-done',
  userId: 'u1',
  sessionType: 'hr',
  contextPackId: 'Western',
  status: 'completed',
  numQuestions: 5,
  jobDescription: 'Backend Engineer at XYZ',
  createdAt: '2026-06-06T08:00:00.000Z',
  overallScore: 7.5,
}

const MOCK_COMPLETING: Session = {
  id: 'sess-completing',
  userId: 'u1',
  sessionType: 'technical',
  contextPackId: 'VN',
  status: 'completing',
  numQuestions: 5,
  jobDescription: 'Fullstack Engineer at ACME',
  createdAt: '2026-06-07T09:00:00.000Z',
}

const MOCK_PAUSED: Session = {
  id: 'sess-paused',
  userId: 'u1',
  sessionType: 'hr',
  contextPackId: 'VN',
  status: 'paused',
  numQuestions: 5,
  jobDescription: 'Fullstack Engineer at Paused Co',
  createdAt: '2026-06-07T11:00:00.000Z',
}

test.beforeEach(async ({ page }) => {
  await page.route('**/auth/v1/user**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'u1', email: 'test@example.com' }),
    })
  })
})

test('hiển thị empty state khi chưa có phiên nào', async ({ page }) => {
  await page.route('**/api/v1/sessions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessions: [] }),
    })
  })

  await page.goto('/sessions')
  await expect(page.getByText('Chưa có phiên phỏng vấn nào')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Bắt đầu phỏng vấn' })
  ).toHaveAttribute('href', '/setup')
})

test('hiển thị danh sách session với status badge đúng', async ({ page }) => {
  await page.route('**/api/v1/sessions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessions: [MOCK_ACTIVE, MOCK_PAUSED, MOCK_COMPLETING, MOCK_COMPLETED],
      }),
    })
  })

  await page.goto('/sessions')
  await expect(page.getByText('Đang phỏng vấn')).toBeVisible()
  await expect(page.getByText('Tạm dừng')).toBeVisible()
  await expect(page.getByText('Đang tạo báo cáo')).toBeVisible()
  await expect(page.getByText('Hoàn thành', { exact: true })).toBeVisible()
})

test('session active có link "Tiếp tục" đến interview page', async ({
  page,
}) => {
  await page.route('**/api/v1/sessions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessions: [MOCK_ACTIVE] }),
    })
  })

  await page.goto('/sessions')
  const link = page.getByRole('link', { name: 'Tiếp tục' })
  await expect(link).toHaveAttribute('href', `/sessions/${MOCK_ACTIVE.id}`)
})

test('session paused có link "Tiếp tục" đến interview page', async ({
  page,
}) => {
  await page.route('**/api/v1/sessions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessions: [MOCK_PAUSED] }),
    })
  })

  await page.goto('/sessions')
  const link = page.getByRole('link', { name: 'Tiếp tục' })
  await expect(link).toHaveAttribute('href', `/sessions/${MOCK_PAUSED.id}`)
})

test('session completed có link "Xem báo cáo" đến report page', async ({
  page,
}) => {
  await page.route('**/api/v1/sessions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessions: [MOCK_COMPLETED] }),
    })
  })

  await page.goto('/sessions')
  const link = page.getByRole('link', { name: 'Xem báo cáo' })
  await expect(link).toHaveAttribute(
    'href',
    `/sessions/${MOCK_COMPLETED.id}/report`
  )
})

test('session completing có link theo dõi đến report page', async ({
  page,
}) => {
  await page.route('**/api/v1/sessions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessions: [MOCK_COMPLETING] }),
    })
  })

  await page.goto('/sessions')
  const link = page.getByRole('link', { name: 'Theo dõi báo cáo' })
  await expect(link).toHaveAttribute(
    'href',
    `/sessions/${MOCK_COMPLETING.id}/report`
  )
})
