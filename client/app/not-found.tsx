import { FileQuestion, Home } from 'lucide-react'
import { ErrorPageTemplate } from '@/components/patterns/ErrorPageTemplate'

export default function NotFound() {
  return (
    <ErrorPageTemplate
      icon={<FileQuestion className="size-16" />}
      iconVariant="brand"
      statusCode={404}
      title="Không tìm thấy trang"
      description="Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển sang địa chỉ mới."
      actions={[
        {
          label: 'Trang chủ',
          href: '/',
          variant: 'primary',
          icon: <Home className="size-4" />,
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
