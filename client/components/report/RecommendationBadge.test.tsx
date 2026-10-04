import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecommendationBadge } from './RecommendationBadge'

describe('RecommendationBadge', () => {
  it('renders strongly_recommended status correctly', () => {
    render(<RecommendationBadge status="strongly_recommended" />)
    const badge = screen.getByRole('status', { name: 'Xuất Sắc - Đạt Chuẩn Cao' })
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Xuất Sắc - Đạt Chuẩn Cao')
  })

  it('renders recommended status correctly', () => {
    render(<RecommendationBadge status="recommended" />)
    const badge = screen.getByRole('status', { name: 'Đạt Yêu Cầu Tuyển Dụng' })
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Đạt Yêu Cầu Tuyển Dụng')
  })

  it('renders borderline status correctly', () => {
    render(<RecommendationBadge status="borderline" />)
    const badge = screen.getByRole('status', { name: 'Cân Nhắc - Cần Đánh Giá Thêm' })
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Cân Nhắc - Cần Đánh Giá Thêm')
  })

  it('renders not_recommended status correctly', () => {
    render(<RecommendationBadge status="not_recommended" />)
    const badge = screen.getByRole('status', { name: 'Chưa Đạt Chuẩn Kỳ Vọng' })
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Chưa Đạt Chuẩn Kỳ Vọng')
  })

  it('renders fallback when status is undefined or null', () => {
    const { rerender } = render(<RecommendationBadge />)
    expect(
      screen.getByRole('status', { name: 'Chưa xác định khuyến nghị' })
    ).toHaveTextContent('Chưa xác định')

    rerender(<RecommendationBadge status={null} />)
    expect(
      screen.getByRole('status', { name: 'Chưa xác định khuyến nghị' })
    ).toHaveTextContent('Chưa xác định')
  })

  it('applies custom className and size variations', () => {
    const { container, rerender } = render(
      <RecommendationBadge status="recommended" size="lg" className="custom-test-class" />
    )
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('custom-test-class')
    expect(badge).toHaveClass('text-sm')

    rerender(<RecommendationBadge status="recommended" size="sm" />)
    const badgeSm = container.firstChild as HTMLElement
    expect(badgeSm).toHaveClass('text-xs')
  })
})
