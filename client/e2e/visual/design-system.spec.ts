import { test, expect } from '@playwright/test'

/**
 * Visual regression tests for core Design System components.
 * These tests navigate to Storybook's iframe view to isolate the component
 * without the Storybook UI wrapper.
 */

// Hàm helper để tạo url đến story dựa vào id
const getStoryUrl = (storyId: string) =>
  `/iframe.html?id=${storyId}&viewMode=story`

test.describe('Design System Visual Baseline', () => {
  test('Button - variants', async ({ page }) => {
    // Navigating to the Button story (Giả sử id là components-button--default)
    // Cần điều chỉnh story ID theo thực tế trong dự án
    await page.goto(getStoryUrl('components-button--default'))
    // Đợi component render
    await page.waitForSelector('#storybook-root')

    // Take a screenshot and compare with baseline
    await expect(page).toHaveScreenshot('button-variants.png', {
      fullPage: true,
    })
  })

  test('Form states - input', async ({ page }) => {
    // Giả sử có story cho form input
    await page.goto(getStoryUrl('components-input--default'))
    await page.waitForSelector('#storybook-root')

    await expect(page).toHaveScreenshot('form-input-states.png', {
      fullPage: true,
    })
  })

  test('Dialog - open state', async ({ page }) => {
    await page.goto(getStoryUrl('components-dialog--default'))
    await page.waitForSelector('#storybook-root')

    // Tìm button trigger dialog và click
    const trigger = page.getByRole('button', { name: /open/i })
    if (await trigger.isVisible()) {
      await trigger.click()
      // Đợi dialog animation (nếu có)
      await page.waitForTimeout(300)
    }

    await expect(page).toHaveScreenshot('dialog-open.png')
  })

  // Thêm các component khác tương tự: DropdownMenu, Tabs, Alert, Page layout, Dark theme
})
