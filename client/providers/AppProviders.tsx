'use client'

import 'dayjs/locale/vi'
import type { ReactNode } from 'react'
import { DatesProvider } from '@mantine/dates'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryProvider } from './QueryProvider'
import { AuthProvider } from './AuthProvider'

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <DatesProvider settings={{ locale: 'vi', firstDayOfWeek: 1 }}>
      <Notifications position="top-right" />
      <ModalsProvider>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </ModalsProvider>
    </DatesProvider>
  )
}
