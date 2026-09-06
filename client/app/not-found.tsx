import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/patterns/LayoutPatterns'

export default function NotFound() {
  return (
    <PageContainer maxWidth="sm" className="flex min-h-[60vh] items-center justify-center py-12">
      <Card className="flex flex-col items-center p-8 text-center shadow-elevation-2">
        <div className="bg-brand-subtle text-brand flex size-14 items-center justify-center rounded-2xl border border-brand/20">
          <FileQuestion className="size-7" />
        </div>

        <h1 className="text-ink mt-4 text-2xl font-bold">404 - Không tìm thấy trang</h1>

        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển sang địa chỉ mới.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Button asChild variant="primary" size="md">
            <Link href="/" className="gap-2">
              <Home className="size-4" />
              <span>Trang chủ</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="md">
            <Link href="/sessions">
              <span>Phỏng vấn</span>
            </Link>
          </Button>
        </div>
      </Card>
    </PageContainer>
  )
}
