import './globals.css'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from '@mantine/core'
import { theme } from '@/theme'
import { AppProviders } from '@/components/app-providers'
import { ThemeProvider } from '@/components/theme-provider'
import { MantineColorSchemeSync } from '@/components/mantine-color-scheme-sync'
import { OfflineBanner } from '@/components/patterns/OfflineBanner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AI Mock Interview — Luyện phỏng vấn với AI',
  description:
    'Nền tảng luyện phỏng vấn AI cho sinh viên CNTT Việt Nam. Paste Job Description, trả lời câu hỏi, nhận phản hồi chi tiết.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      {...mantineHtmlProps}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <MantineColorSchemeSync />
            <AppProviders>
              <OfflineBanner />
              {children}
            </AppProviders>
          </ThemeProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
