import 'dayjs/locale/vi'
import type { ReactNode } from 'react'
import {
  render as testingLibraryRender,
  type RenderOptions,
} from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { ModalsProvider } from '@mantine/modals'
import { Notifications, notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { theme } from '@/theme'

export interface CustomRenderOptions extends RenderOptions {
  queryClient?: QueryClient
}

export function createTestQueryClient(): QueryClient {
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

export function render(ui: ReactNode, options?: CustomRenderOptions) {
  notifications.clean()

  const {
    queryClient: customQueryClient,
    wrapper: UserWrapper,
    ...renderOptions
  } = options ?? {}
  const testQueryClient = customQueryClient ?? createTestQueryClient()

  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={testQueryClient}>
        <MantineProvider theme={theme} env="test">
          <DatesProvider settings={{ locale: 'vi', firstDayOfWeek: 1 }}>
            <Notifications />
            <ModalsProvider>
              {UserWrapper ? <UserWrapper>{children}</UserWrapper> : children}
            </ModalsProvider>
          </DatesProvider>
        </MantineProvider>
      </QueryClientProvider>
    ),
    ...renderOptions,
  })
}
