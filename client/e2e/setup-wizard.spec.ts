import { test, expect, type Page } from '@playwright/test'
import { CATALOG_INTERVIEW_OPTIONS_FIXTURE } from '../test-utils/fixtures/catalog.fixture'

const MOCK_SESSION_ID = 'session-abc123'
const VALID_REQUIREMENTS =
  'Có kinh nghiệm React, TypeScript và làm việc với REST API.'
const VALID_JOB_CONTENT =
  'Phát triển giao diện web, phối hợp backend và tối ưu trải nghiệm người dùng.'

const MOCK_TECHNOLOGIES = [
  { example: 'PyTorch', isHotTechnology: true, inDemand: true },
  { example: 'Playwright', isHotTechnology: true, inDemand: true },
  { example: 'Terraform', isHotTechnology: true, inDemand: true },
  { example: 'OWASP', isHotTechnology: false, inDemand: true },
  { example: 'React', isHotTechnology: true, inDemand: true },
  { example: 'TypeScript', isHotTechnology: true, inDemand: true },
]

let savedJobDescriptionPayload: Record<string, unknown> | null = null
let sessionPayload: Record<string, unknown> | null = null

async function selectLevel(page: Page, optionLabel: string) {
  const levelInput = page.getByLabel('Level yêu cầu')
  await levelInput.click()
  await page.getByRole('option', { name: optionLabel, exact: true }).click()
}

async function fillValidJd(page: Page) {
  await page.getByLabel('Tên công ty').fill('FPT Software')
  await page.getByLabel('Vị trí').fill('Frontend Developer')
  await selectLevel(page, 'Junior')
  await page.getByLabel('Yêu cầu', { exact: true }).fill(VALID_REQUIREMENTS)
  await page.getByLabel('Nội dung công việc').fill(VALID_JOB_CONTENT)
}

async function selectTech(page: Page, tech: string) {
  await page.getByLabel('Tìm kiếm tech stack').fill(tech)
  await page.getByRole('button', { name: tech, exact: true }).click()
}

test.beforeEach(async ({ page }) => {
  savedJobDescriptionPayload = null
  sessionPayload = null

  await page.route('**/api/v1/auth/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'u1',
          email: 'test@example.com',
          role: 'candidate',
          status: 'active',
          firstname: 'Test',
          lastname: 'User',
          emailVerified: true,
        },
      }),
    })
  })

  await page.route('**/api/v1/catalog/interview-options**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: CATALOG_INTERVIEW_OPTIONS_FIXTURE,
      }),
    })
  })

  await page.route('**/api/v1/onet/occupations**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            socCode: '15-1254.00',
            title: 'Frontend Developer',
            description: 'Web and digital interface development',
          },
        ],
      }),
    })
  })

  await page.route('**/api/v1/onet/technologies**', async (route) => {
    const url = new URL(route.request().url())
    const query = (url.searchParams.get('query') ?? '').trim().toLowerCase()
    const filtered = query
      ? MOCK_TECHNOLOGIES.filter((t) => t.example.toLowerCase().includes(query))
      : MOCK_TECHNOLOGIES

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: filtered,
      }),
    })
  })

  await page.route('**/api/v1/saved-job-descriptions', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      })
      return
    }

    savedJobDescriptionPayload = route.request().postDataJSON() as Record<
      string,
      unknown
    >
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'saved-jd-1' }),
    })
  })

  await page.route('**/api/v1/sessions', async (route) => {
    if (route.request().method() === 'POST') {
      sessionPayload = route.request().postDataJSON() as Record<string, unknown>
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

test('nút Tiếp theo disabled khi JD chưa đủ thông tin bắt buộc', async ({
  page,
}) => {
  await page.goto('/setup')
  const nextBtn = page.getByRole('button', { name: 'Tiếp theo' })
  await expect(nextBtn).toBeDisabled()

  await page.getByLabel('Tên công ty').fill('FPT Software')
  await page.getByLabel('Yêu cầu', { exact: true }).fill('x'.repeat(30))
  await expect(nextBtn).toBeDisabled()

  await page.getByLabel('Vị trí').fill('Frontend Developer')
  await page.getByLabel('Nội dung công việc').fill('x'.repeat(30))
  await expect(nextBtn).toBeDisabled()

  await selectLevel(page, 'Fresher')
  await expect(nextBtn).toBeEnabled()
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

test('chọn Western gửi language=en khi tạo session', async ({ page }) => {
  await page.goto('/setup')

  await fillValidJd(page)
  await page.getByRole('button', { name: 'Tiếp theo' }).click()
  await page.getByRole('radio', { name: /Western/i }).click()
  await page.getByRole('button', { name: 'Tiếp theo' }).click()
  await page.getByRole('button', { name: 'Bắt đầu phỏng vấn' }).click()

  await expect.poll(() => sessionPayload).not.toBeNull()
  expect(sessionPayload).toMatchObject({
    contextPack: 'Western',
    language: 'en',
  })
})

test('có thể tìm kiếm, chọn và lưu các tech stack mới trong JD', async ({
  page,
}) => {
  await page.goto('/setup')

  await fillValidJd(page)

  await selectTech(page, 'PyTorch')
  await expect(
    page.getByRole('button', { name: 'Bỏ chọn PyTorch' })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Bỏ chọn PyTorch' }).click()
  await expect(page.getByLabel('Tên công ty')).toHaveValue('FPT Software')

  await selectTech(page, 'PyTorch')
  await selectTech(page, 'Playwright')
  await selectTech(page, 'Terraform')
  await selectTech(page, 'OWASP')

  await page.getByRole('button', { name: 'Tiếp theo' }).click()
  await page.getByRole('button', { name: 'Tiếp theo' }).click()

  await expect(
    page.getByText(/PyTorch.*Playwright.*Terraform.*OWASP/)
  ).toBeVisible()

  await page.getByRole('button', { name: 'Bắt đầu phỏng vấn' }).click()
  await expect(page).toHaveURL(new RegExp(`/sessions/${MOCK_SESSION_ID}`))

  expect(savedJobDescriptionPayload).toMatchObject({
    level: 'junior',
    techStack: ['PyTorch', 'Playwright', 'Terraform', 'OWASP'],
  })
  expect(String(sessionPayload?.jobDescription)).toContain(
    'Tech Stack: PyTorch, Playwright, Terraform, OWASP'
  )
  expect(String(sessionPayload?.jobDescription)).toContain(
    'Level yêu cầu: Junior'
  )
})

test('chuẩn hóa draft JD cũ thiếu field để input luôn controlled', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.addInitScript(
    ({ requirements, jobContent }) => {
      window.localStorage.setItem(
        'interviewcoach_jd_draft',
        JSON.stringify({ company: 'FPT Software', requirements, jobContent })
      )
    },
    { requirements: VALID_REQUIREMENTS, jobContent: VALID_JOB_CONTENT }
  )

  await page.goto('/setup')
  await page.getByLabel('Website công ty').fill('https://fptsoftware.com')
  await page.getByLabel('Vị trí').fill('Frontend Developer')
  await selectLevel(page, 'Junior')
  await page.getByLabel('Số lượng tuyển').fill('2 người')
  await page.getByLabel('Địa điểm làm việc').fill('Hà Nội')
  await page.getByLabel('Lương').fill('20-30 triệu VNĐ')
  await page.getByLabel('Quyền lợi nhân viên').fill('Bảo hiểm sức khỏe')

  expect(consoleErrors.join('\n')).not.toContain(
    'A component is changing an uncontrolled input to be controlled'
  )
})
