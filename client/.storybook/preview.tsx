import '../app/globals.css'
import 'dayjs/locale/vi'

import type { Preview, Decorator } from '@storybook/nextjs-vite'
import { MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import React, { useEffect } from 'react'
import { QueryProvider } from '../providers/QueryProvider'
import { theme } from '../theme'

function ReducedMotionWrapper({
  reducedMotion,
  children,
}: Readonly<{
  reducedMotion?: string
  children: React.ReactNode
}>) {
  useEffect(() => {
    if (reducedMotion === 'reduce') {
      document.documentElement.dataset.reducedMotion = 'true'
    } else {
      delete document.documentElement.dataset.reducedMotion
    }
  }, [reducedMotion])

  return <>{children}</>
}

const withReducedMotion: Decorator = (Story, context) => (
  <ReducedMotionWrapper
    reducedMotion={context.globals.reducedMotion as string | undefined}
  >
    <Story />
  </ReducedMotionWrapper>
)

const withMantineProvider: Decorator = (Story, context) => {
  const paramScheme = context.parameters?.colorScheme as string | undefined
  const globalScheme = context.globals.colorScheme as string | undefined
  const activeScheme = paramScheme ?? globalScheme
  const scheme = activeScheme === 'dark' ? 'dark' : 'light'

  return (
    <QueryProvider>
      <MantineProvider theme={theme} forceColorScheme={scheme}>
        <DatesProvider settings={{ locale: 'vi', firstDayOfWeek: 1 }}>
          <Notifications position="top-right" />
          <ModalsProvider>
            <Story />
          </ModalsProvider>
        </DatesProvider>
      </MantineProvider>
    </QueryProvider>
  )
}

const preview: Preview = {
  globalTypes: {
    colorScheme: {
      name: 'Color Scheme',
      description: 'Mantine color scheme (light / dark)',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    reducedMotion: {
      name: 'Reduced Motion',
      description: 'Enable reduced motion preview',
      defaultValue: 'auto',
      toolbar: {
        icon: 'lightningoff',
        items: [
          { value: 'auto', title: 'Auto (OS Default)' },
          { value: 'reduce', title: 'Force Reduced Motion' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withMantineProvider, withReducedMotion],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    viewport: {
      viewports: {
        sm: { name: 'sm (640px)', styles: { width: '640px', height: '100%' } },
        md: { name: 'md (768px)', styles: { width: '768px', height: '100%' } },
        lg: { name: 'lg (1024px)', styles: { width: '1024px', height: '100%' } },
        xl: { name: 'xl (1280px)', styles: { width: '1280px', height: '100%' } },
        '2xl': {
          name: '2xl (1536px)',
          styles: { width: '1536px', height: '100%' },
        },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' ở Đợt 7A — sẽ rà soát và bật 'error' trong Đợt 7B
      test: 'todo',
    },
  },
}

export default preview
