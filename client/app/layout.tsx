import './globals.css'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from '@mantine/core'
import { theme } from '@/theme'
import { AppProviders } from '@/providers/AppProviders'
import { OfflineBanner } from '@/components/common/OfflineBanner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5173'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Intervia',
  title: {
    default: 'Intervia — Luyện phỏng vấn AI chuẩn STAR & SFIA 9',
    template: '%s | Intervia',
  },
  description:
    'Intervia — Nền tảng luyện phỏng vấn AI dành cho sinh viên CNTT Việt Nam. Phân tích Job Description, đặt câu hỏi follow-up thông minh và chấm điểm chi tiết theo STAR & SFIA 9.',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Intervia',
    title: 'Intervia — Luyện phỏng vấn AI chuẩn STAR & SFIA 9',
    description:
      'Nền tảng luyện phỏng vấn AI dành cho sinh viên CNTT Việt Nam theo chuẩn STAR & SFIA 9.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intervia — Luyện phỏng vấn AI chuẩn STAR & SFIA 9',
    description:
      'Nền tảng luyện phỏng vấn AI dành cho sinh viên CNTT Việt Nam theo chuẩn STAR & SFIA 9.',
  },
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
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <AppProviders>
            <OfflineBanner />
            {children}
          </AppProviders>
        </MantineProvider>
      </body>
    </html>
  )
}
