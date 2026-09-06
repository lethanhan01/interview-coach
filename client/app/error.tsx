'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/patterns/LayoutPatterns'

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
    <PageContainer maxWidth="sm" className="flex min-h-[60vh] items-center justify-center py-12">
      <Card className="flex flex-col items-center p-8 text-center shadow-elevation-2">
        <div className="bg-danger-subtle text-danger-subtle-fg flex size-12 items-center justify-center rounded-2xl border border-danger/20">
          <AlertTriangle className="size-6 text-danger" />
        </div>

        <h2 className="text-ink mt-4 text-xl font-bold">
          Đã xảy ra sự cố không mong muốn
        </h2>

        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Hệ thống gặp lỗi trong quá trình xử lý yêu cầu. Vui lòng nhấn nút thử lại bên dưới hoặc quay về trang chủ.
        </p>

        {error.digest && (
          <p className="text-ink-faint mt-2 font-mono text-xs">
            Mã lỗi: {error.digest}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => reset()}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            <span>Thử lại</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => (window.location.href = '/')}
          >
            Trang chủ
          </Button>
        </div>
      </Card>
    </PageContainer>
  )
}
