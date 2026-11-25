import { test, expect } from '@playwright/test'

/**
 * Visual regression tests for Mantine v9 Zero-Hex Foundations and key Domain stories.
 * Navigates directly to Storybook's iframe view in both Light and Dark color schemes.
 */

type ColorScheme = 'light' | 'dark'

const getStoryUrl = (storyId: string, colorScheme: ColorScheme) =>
  `/iframe.html?id=${storyId}&viewMode=story&globals=colorScheme:${colorScheme}`

const VISUAL_STORIES: ReadonlyArray<{
  name: string
  storyId: string
  snapshotPrefix: string
}> = [
  {
    name: 'Foundations — Mantine Semantic Colors',
    storyId: 'foundations-mantine-tokens--semantic-colors',
    snapshotPrefix: 'foundations-semantic-colors',
  },
  {
    name: 'Landing — HeroSection',
    storyId: 'feature-landing-herosection--default',
    snapshotPrefix: 'landing-hero',
  },
  {
    name: 'Auth — LoginForm',
    storyId: 'feature-auth-loginform--default',
    snapshotPrefix: 'auth-login-form',
  },
  {
    name: 'Layout — AppLayout Candidate',
    storyId: 'layout-applayout--candidate-layout',
    snapshotPrefix: 'layout-app-candidate',
  },
  {
    name: 'Common Pages — 404 Not Found',
    storyId: 'pages-common--not-found-page',
    snapshotPrefix: 'common-not-found',
  },
]

const COLOR_SCHEMES: readonly ColorScheme[] = ['light', 'dark']

test.describe('Mantine v9 Zero-Hex Design System Visual Baseline', () => {
  for (const story of VISUAL_STORIES) {
    for (const scheme of COLOR_SCHEMES) {
      test(`${story.name} (${scheme})`, async ({ page }) => {
        await page.goto(getStoryUrl(story.storyId, scheme))
        await page.waitForFunction(
          () =>
            (document.querySelector('#storybook-root')?.textContent?.trim()
              .length ?? 0) > 0
        )
        await page.waitForFunction(() =>
          Array.from(
            document.querySelectorAll<HTMLImageElement>('#storybook-root img')
          ).every((img) => img.complete && img.naturalWidth > 0)
        )
        await page.evaluate(() => document.fonts.ready)

        await expect(page).toHaveScreenshot(
          `${story.snapshotPrefix}-${scheme}.png`,
          {
            fullPage: true,
            animations: 'disabled',
          }
        )
      })
    }
  }
})
