'use client'

import { useSearchParams } from 'next/navigation'
import { LockKeyhole, Home } from 'lucide-react'
import { ErrorPageTemplate } from '@/components/patterns/ErrorPageTemplate'
import { getSafeNext } from '@/lib/auth-redirect'

/**
 * /unauthenticated — 401 Unauthenticated Page
 *
 * Shown when middleware detects no auth cookie on a protected route.
 * Reads ?next= param and passes it through to the login page so the user
 * is redirected back to their original destination after signing in.
 */
export default function UnauthenticatedPage() {
  const searchParams = useSearchParams()
  const next = getSafeNext(searchParams.get('next'))
  const loginHref = `/login?next=${encodeURIComponent(next)}`

  return (
    <ErrorPageTemplate
      icon={<LockKeyhole className="size-16" />}
      iconVariant="brand"
      statusCode={401}
      title="Bạn chưa đăng nhập"
      description="Vui lòng đăng nhập để tiếp tục truy cập tính năng này."
      actions={[
        {
          label: 'Đăng nhập',
          href: loginHref,
          variant: 'primary',
        },
        {
          label: 'Trang chủ',
          href: '/',
          variant: 'outline',
          icon: <Home className="size-4" />,
        },
      ]}
    />
  )
}
