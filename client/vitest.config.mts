import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

import { playwright } from '@vitest/browser-playwright'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      // -----------------------------------------------------------------------
      // Project 1: Storybook integration tests (browser / Playwright)
      // -----------------------------------------------------------------------
      {
        extends: true,
        optimizeDeps: {
          include: [
            '@testing-library/dom',
            '@testing-library/dom > aria-query',
            'aria-query',
            'axe-core',
          ],
        },
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
            '@test-utils': path.resolve(dirname, 'test-utils/index.ts'),
          },
        },
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          testTimeout: 15_000,
          setupFiles: ['./vitest.setup.ts'],
          include: [
            'components/**/*.test.{ts,tsx}',
            'app/**/*.test.{ts,tsx}',
            'lib/**/*.test.{ts,tsx}',
            'middleware/**/*.test.{ts,tsx}',
            'hooks/**/*.test.{ts,tsx}',
            'providers/**/*.test.{ts,tsx}',
            'queries/**/*.test.{ts,tsx}',
            'services/**/*.test.{ts,tsx}',
            'test-utils/**/*.test.{ts,tsx}',
            'scripts/**/*.test.{ts,tsx}',
          ],
        },
      },
    ],
  },
})
