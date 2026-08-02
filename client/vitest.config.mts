import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

import { playwright } from '@vitest/browser-playwright'

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      // -----------------------------------------------------------------------
      // Project 1: Storybook integration tests (browser / Playwright)
      // -----------------------------------------------------------------------
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },

      // -----------------------------------------------------------------------
      // Project 2: Unit tests (jsdom + React Testing Library)
      // -----------------------------------------------------------------------
      {
        resolve: {
          alias: {
            '@': path.resolve(dirname, '.'),
          },
        },
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./vitest.setup.ts'],
          include: [
            'components/**/*.test.{ts,tsx}',
            'app/**/*.test.{ts,tsx}',
            'lib/**/*.test.{ts,tsx}',
            'hooks/**/*.test.{ts,tsx}',
          ],
        },
      },
    ],
  },
})
