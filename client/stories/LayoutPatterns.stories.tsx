import type { Meta } from '@storybook/nextjs-vite'
import { PageContainer, PageHeader, PageSection, ResponsiveStack } from '@/components/patterns/LayoutPatterns'
import { Button } from '@/components/ui/Button'

const meta: Meta = {
  title: 'Patterns/Layout',
  tags: ['autodocs'],
}

export default meta

export const PageContainerExample = () => (
  <PageContainer maxWidth="md" className="bg-surface-raised border p-4">
    Content restricted to md max width
  </PageContainer>
)

export const PageHeaderExample = () => (
  <div className="p-8">
    <PageHeader 
      title="Quản lý Tài khoản" 
      description="Xem và chỉnh sửa thông tin tài khoản của bạn"
      breadcrumbs={<span className="text-sm text-ink-muted">Trang chủ / Tài khoản</span>}
      actions={<Button>Lưu thay đổi</Button>}
    />
  </div>
)

export const PageSectionExample = () => (
  <div className="p-8 max-w-2xl">
    <PageSection title="Bảo mật" description="Cập nhật mật khẩu và xác thực 2 bước">
      <div className="p-4 border rounded-md">
        Nội dung section
      </div>
    </PageSection>
  </div>
)

export const ResponsiveStackExample = () => (
  <div className="p-8">
    <ResponsiveStack gap="lg" justify="between" align="center">
      <div className="p-4 bg-brand-100 rounded">Item 1</div>
      <div className="p-4 bg-brand-100 rounded">Item 2</div>
      <div className="p-4 bg-brand-100 rounded">Item 3</div>
    </ResponsiveStack>
  </div>
)
