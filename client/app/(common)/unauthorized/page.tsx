import type { Metadata } from 'next'
import { UnauthorizedClient } from '@/components/common/status-pages/UnauthorizedClient'

export const metadata: Metadata = {
  title: 'Không có quyền truy cập (403) — Interview Coach',
  description: 'Tài khoản của bạn không có quyền truy cập trang này.',
}

export default function UnauthorizedPage() {
  return <UnauthorizedClient />
}
