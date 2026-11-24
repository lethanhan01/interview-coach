import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { RecommendationBadge } from './RecommendationBadge'

describe('RecommendationBadge', () => {
  it('renders strongly_recommended status correctly', () => {
    render(<RecommendationBadge status="strongly_recommended" />)
    const badge = screen.getByRole('status', {
      name: 'Xuất Sắc - Đạt Chuẩn Cao',
    })
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
    const badge = screen.getByRole('status', {
      name: 'Cân Nhắc - Cần Đánh Giá Thêm',
    })
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
      <RecommendationBadge
        status="recommended"
        size="lg"
        className="custom-test-class"
      />
    )
    const badge = container.querySelector('.custom-test-class')
    expect(badge).toBeInTheDocument()

    rerender(<RecommendationBadge status="recommended" size="sm" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <RecommendationBadge status="strongly_recommended" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
