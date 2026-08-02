import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config specifically for Visual Regression testing of the Design System
 */
export default defineConfig({
  testDir: './e2e/visual',
  snapshotDir: './e2e/visual/__snapshots__',
  timeout: 30000,
  expect: {
    // Độ nhạy cho phép khác biệt (thường cấu hình maxDiffPixelRatio để tránh flaky)
    toHaveScreenshot: { maxDiffPixelRatio: 0.05 },
  },
  use: {
    baseURL: 'http://localhost:6006', // Storybook URL
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run storybook -- --ci',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
  },
})
