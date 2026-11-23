import type { ReactNode } from 'react'
import {
  render as testingLibraryRender,
  type RenderOptions,
} from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { theme } from '@/theme'

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function render(ui: ReactNode, options?: RenderOptions) {
  const testQueryClient = createTestQueryClient()

  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={testQueryClient}>
        <MantineProvider theme={theme} env="test">
          <ModalsProvider>{children}</ModalsProvider>
        </MantineProvider>
      </QueryClientProvider>
    ),
    ...options,
  })
}
