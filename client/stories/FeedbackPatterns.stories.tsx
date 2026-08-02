import type { Meta } from '@storybook/react'
import { LoadingState, EmptyState, ErrorState, AsyncBoundary } from '@/components/patterns/FeedbackPatterns'

const meta: Meta = {
  title: 'Patterns/Feedback',
  tags: ['autodocs'],
}

export default meta

export const LoadingStateExample = () => <LoadingState text="Đang tải dữ liệu cá nhân..." />

export const EmptyStateExample = () => (
  <EmptyState
    title="Chưa có JD nào"
    description="Bạn chưa tạo Job Description nào. Hãy tạo mới để bắt đầu."
    action={{ label: 'Tạo JD mới', onClick: () => alert('Create') }}
  />
)

export const ErrorStateExample = () => (
  <ErrorState
    title="Lỗi tải dữ liệu"
    error={new Error('Network request failed')}
    onRetry={() => alert('Retry')}
  />
)

export const AsyncBoundaryExample = () => (
  <AsyncBoundary isLoading={false} isError={false} isEmpty={false}>
    <div className="p-8 border rounded-lg bg-surface-raised text-center">
      Dữ liệu đã tải thành công!
    </div>
  </AsyncBoundary>
)
