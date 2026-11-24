import type { Metadata } from 'next'
import { IconHome, IconLock } from '@tabler/icons-react'
import { ErrorPageTemplate } from '@/components/common/status-pages/ErrorPageTemplate'
import { getSafeNext } from '@/lib/auth-redirect'

export const metadata: Metadata = {
  title: 'Chưa đăng nhập (401) — Interview Coach',
  description: 'Vui lòng đăng nhập để tiếp tục truy cập tính năng này.',
}

interface UnauthenticatedPageProps {
  searchParams: Promise<{ next?: string | string[] }>
}

export default async function UnauthenticatedPage({
  searchParams,
}: Readonly<UnauthenticatedPageProps>) {
  const resolved = await searchParams
  const rawNext = typeof resolved.next === 'string' ? resolved.next : null
  const safeNext = getSafeNext(rawNext)
  const loginHref = `/login?next=${encodeURIComponent(safeNext)}`

  return (
    <ErrorPageTemplate
      icon={<IconLock size={32} stroke={1.5} aria-hidden="true" />}
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
          icon: <IconHome size={16} stroke={1.5} aria-hidden="true" />,
        },
      ]}
    />
  )
}
