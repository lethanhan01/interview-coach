'use client'

import { useRouter } from 'next/navigation'
import { ShieldOff } from 'lucide-react'
import { ErrorPageTemplate } from '@/components/patterns/ErrorPageTemplate'

/**
 * /unauthorized — 403 Forbidden Page
 *
 * Shown when a logged-in user tries to access a route they don't have
 * permission for (e.g., candidate accessing /admin routes).
 * The RoleGuard component can be updated to redirect here instead of
 * using a hardcoded fallbackRoute.
 */
export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <ErrorPageTemplate
      icon={<ShieldOff className="size-16" />}
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
