import type { StorybookConfig } from '@storybook/nextjs-vite'
import path from 'path'

const config: StorybookConfig = {
  stories: [
    '../docs/design-system/**/*.mdx',
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-themes',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['..\\public'],
  async viteFinal(config) {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          'next/dist/next-server/lib/router-context':
            'next/dist/shared/lib/router-context.shared-runtime.js',
          'next/dist/shared/lib/router-context':
            'next/dist/shared/lib/router-context.shared-runtime.js',
        },
      },
      build: {
        ...config.build,
        chunkSizeWarningLimit: 2000,
      },
    }
  },
}
export default config
