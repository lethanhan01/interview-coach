'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { ErrorPageTemplate } from '@/components/patterns/ErrorPageTemplate'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled App Router Error:', error)
  }, [error])

  return (
    <ErrorPageTemplate
      icon={<AlertTriangle className="size-16" />}
      iconVariant="danger"
      title="Đã xảy ra sự cố không mong muốn"
      description="Hệ thống gặp lỗi trong quá trình xử lý yêu cầu. Vui lòng nhấn nút thử lại bên dưới hoặc quay về trang chủ."
      errorDigest={error.digest}
      actions={[
        {
          label: 'Thử lại',
          onClick: reset,
          variant: 'primary',
          icon: <RefreshCw className="size-4" />,
        },
        {
          label: 'Trang chủ',
          onClick: () => (window.location.href = '/'),
          variant: 'outline',
        },
      ]}
    />
  )
}
