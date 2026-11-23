import type { Metadata } from 'next'
import { IconError404, IconHome } from '@tabler/icons-react'
import { ErrorPageTemplate } from '@/components/patterns/ErrorPageTemplate'

export const metadata: Metadata = {
  title: 'Không tìm thấy trang (404) — Interview Coach',
  description:
    'Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển sang địa chỉ mới.',
}

export default function NotFound() {
  return (
    <ErrorPageTemplate
      icon={<IconError404 size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="brand"
      statusCode={404}
      title="Không tìm thấy trang"
      description="Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển sang địa chỉ mới."
      actions={[
        {
          label: 'Trang chủ',
          href: '/',
          variant: 'primary',
          icon: <IconHome size={16} stroke={1.5} aria-hidden="true" />,
        },
        {
          label: 'Phỏng vấn',
          href: '/sessions',
          variant: 'outline',
        },
      ]}
    />
  )
}
