'use client'

import './globals.css'

import { useEffect } from 'react'
import { MantineProvider, mantineHtmlProps } from '@mantine/core'
import { IconAlertTriangle, IconHome, IconRefresh } from '@tabler/icons-react'
import { ErrorPageTemplate } from '@/components/common/status-pages/ErrorPageTemplate'
import { theme } from '@/theme'

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    console.error('Fatal Root Layout Error:', error)
  }, [error])

  return (
    <html lang="vi" {...mantineHtmlProps}>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <ErrorPageTemplate
            icon={
              <IconAlertTriangle size={32} stroke={1.5} aria-hidden="true" />
            }
            iconVariant="danger"
            title="Lỗi khởi tạo hệ thống"
            description="Đã có sự cố nghiêm trọng xảy ra ở giao diện cốt lõi. Hãy bấm thử lại để tải lại phiên làm việc."
            errorDigest={error.digest}
            actions={[
              {
                label: 'Thử lại',
                onClick: () => reset(),
                variant: 'primary',
                icon: <IconRefresh size={16} stroke={1.5} aria-hidden="true" />,
              },
              {
                label: 'Trang chủ',
                onClick: () => {
                  window.location.href = '/'
                },
                variant: 'outline',
                icon: <IconHome size={16} stroke={1.5} aria-hidden="true" />,
              },
            ]}
          />
        </MantineProvider>
      </body>
    </html>
  )
}
