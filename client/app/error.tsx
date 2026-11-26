'use client'

import { useEffect } from 'react'
import { IconAlertTriangle, IconHome, IconRefresh } from '@tabler/icons-react'
import { ErrorPageTemplate } from '@/components/common/status-pages/ErrorPageTemplate'

export default function RootError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    console.error('Unhandled App Router Error:', error)
  }, [error])

  return (
    <ErrorPageTemplate
      icon={<IconAlertTriangle size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="danger"
      title="Đã xảy ra sự cố không mong muốn"
      description="Hệ thống gặp lỗi trong quá trình xử lý yêu cầu. Vui lòng nhấn nút thử lại bên dưới hoặc quay về trang chủ."
      errorDigest={error.digest}
      actions={[
        {
          label: 'Thử lại',
          onClick: reset,
          variant: 'primary',
          icon: <IconRefresh size={16} stroke={1.5} aria-hidden="true" />,
        },
        {
          label: 'Trang chủ',
          href: '/',
          variant: 'outline',
          icon: <IconHome size={16} stroke={1.5} aria-hidden="true" />,
        },
      ]}
    />
  )
}
