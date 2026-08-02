import '../app/globals.css'
import DocTemplate from './DocTemplate'

// Polyfill to fix Radix UI's "Illegal invocation" focus error in Storybook
if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.focus !== 'function') {
  const originalFocus = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'focus')
  if (originalFocus && originalFocus.get) {
    Object.defineProperty(HTMLElement.prototype, 'focus', {
      value: function focus(options?: FocusOptions) {
        return originalFocus.get?.call(this)?.call(this, options)
      },
      writable: true,
      configurable: true,
    })
  }
}

import type { Preview, Decorator } from '@storybook/nextjs-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import React, { useEffect } from 'react'

function ReducedMotionWrapper({
  reducedMotion,
  children,
}: {
  reducedMotion?: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (reducedMotion === 'reduce') {
      document.documentElement.setAttribute('data-reduced-motion', 'true')
    } else {
      document.documentElement.removeAttribute('data-reduced-motion')
    }
  }, [reducedMotion])

  return <>{children}</>
}

const withReducedMotion: Decorator = (Story, context) => (
  <ReducedMotionWrapper reducedMotion={context.globals.reducedMotion as string | undefined}>
    <Story />
  </ReducedMotionWrapper>
)

const preview: Preview = {
  globalTypes: {
    reducedMotion: {
      name: 'Reduced Motion',
      description: 'Enable reduced motion preview',
      defaultValue: 'auto',
      toolbar: {
        icon: 'videooff',
        items: [
          { value: 'auto', title: 'Auto (OS Default)' },
          { value: 'reduce', title: 'Force Reduced Motion' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    withReducedMotion,
    // Toggles class `dark` on <html> element — integrates with next-themes
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ],
  parameters: {
    docs: {
      page: DocTemplate,
    },
    viewport: {
      viewports: {
        sm: { name: 'sm (640px)', styles: { width: '640px', height: '100%' } },
        md: { name: 'md (768px)', styles: { width: '768px', height: '100%' } },
        lg: { name: 'lg (1024px)', styles: { width: '1024px', height: '100%' } },
        xl: { name: 'xl (1280px)', styles: { width: '1280px', height: '100%' } },
        '2xl': { name: '2xl (1536px)', styles: { width: '1536px', height: '100%' } },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
