import type { ReactNode } from 'react'
import {
  render as testingLibraryRender,
  type RenderOptions,
} from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { theme } from '@/theme'

export function render(ui: ReactNode, options?: RenderOptions) {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MantineProvider theme={theme} env="test">
        <ModalsProvider>{children}</ModalsProvider>
      </MantineProvider>
    ),
    ...options,
  })
}
