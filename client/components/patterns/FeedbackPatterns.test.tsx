import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoadingState, EmptyState, ErrorState, AsyncBoundary } from './FeedbackPatterns'
import { vi } from 'vitest'

describe('FeedbackPatterns', () => {
  describe('LoadingState', () => {
    it('renders text correctly', () => {
      render(<LoadingState text="Đang tải dữ liệu..." />)
      expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument()
    })
  })

  describe('EmptyState', () => {
    it('renders correctly', () => {
      const onAction = vi.fn()
      render(<EmptyState title="Không có gì" description="Thử lại sau" action={{ label: 'Thêm mới', onClick: onAction }} />)
      expect(screen.getByText('Không có gì')).toBeInTheDocument()
      expect(screen.getByText('Thử lại sau')).toBeInTheDocument()
    })

    it('calls action', async () => {
      const onAction = vi.fn()
      const user = userEvent.setup()
      render(<EmptyState title="Không có gì" action={{ label: 'Thêm mới', onClick: onAction }} />)
      await user.click(screen.getByText('Thêm mới'))
      expect(onAction).toHaveBeenCalled()
    })
  })

  describe('ErrorState', () => {
    it('renders correctly', () => {
      const onRetry = vi.fn()
      render(<ErrorState error={new Error('Lỗi mạng')} onRetry={onRetry} />)
      expect(screen.getByText('Lỗi mạng')).toBeInTheDocument()
    })
  })

  describe('AsyncBoundary', () => {
    it('renders loading state', () => {
      render(<AsyncBoundary isLoading={true} isError={false}>Content</AsyncBoundary>)
      expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument()
    })
    
    it('renders error state', () => {
      render(<AsyncBoundary isLoading={false} isError={true} error={new Error('Test Error')}>Content</AsyncBoundary>)
      expect(screen.getByText('Test Error')).toBeInTheDocument()
    })

    it('renders empty state', () => {
      render(<AsyncBoundary isLoading={false} isError={false} isEmpty={true} emptyTitle="No data">Content</AsyncBoundary>)
      expect(screen.getByText('No data')).toBeInTheDocument()
    })

    it('renders children when no loading, error or empty', () => {
      render(<AsyncBoundary isLoading={false} isError={false} isEmpty={false}>Success Content</AsyncBoundary>)
      expect(screen.getByText('Success Content')).toBeInTheDocument()
    })
  })
})
