'use client'

import { useRouter } from 'next/navigation'
import { IconShieldOff } from '@tabler/icons-react'
import { ErrorPageTemplate } from '@/components/common/ErrorPageTemplate'

export function UnauthorizedClient() {
  const router = useRouter()

  return (
    <ErrorPageTemplate
      icon={<IconShieldOff size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="warning"
      statusCode={403}
      title="Bạn không có quyền truy cập"
      description="Tài khoản của bạn không có quyền xem trang này. Liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn."
      actions={[
        {
          label: 'Quay lại',
          onClick: () => router.back(),
          variant: 'outline',
        },
        {
          label: 'Trang chủ',
          href: '/',
          variant: 'primary',
        },
      ]}
    />
  )
}
