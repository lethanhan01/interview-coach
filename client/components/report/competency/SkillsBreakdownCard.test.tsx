import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { SkillsBreakdownCard } from './SkillsBreakdownCard'
import { mockUnifiedSkillsBreakdown } from '@/test-utils/fixtures/report.fixture'

describe('SkillsBreakdownCard', () => {
  it('renders null when skills list is empty or undefined', () => {
    const { rerender } = render(<SkillsBreakdownCard skills={[]} />)
    expect(
      screen.queryByText('Chi Tiết Đánh Giá Từng Năng Lực (Skills Breakdown)')
    ).not.toBeInTheDocument()

    rerender(<SkillsBreakdownCard />)
    expect(
      screen.queryByText('Chi Tiết Đánh Giá Từng Năng Lực (Skills Breakdown)')
    ).not.toBeInTheDocument()
  })

  it('renders skill breakdown details correctly', () => {
    render(<SkillsBreakdownCard skills={mockUnifiedSkillsBreakdown} />)

    expect(
      screen.getByText('Chi Tiết Đánh Giá Từng Năng Lực (Skills Breakdown)')
    ).toBeInTheDocument()

    expect(screen.getByText('PROG')).toBeInTheDocument()
    expect(screen.getByText('88/100 điểm')).toBeInTheDocument()
    expect(screen.getByText('Đạt chuẩn')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Hiểu sâu về cấu trúc dữ liệu, xử lý bất đồng bộ và Clean Architecture.'
      )
    ).toBeInTheDocument()

    expect(screen.getByText('DBDS')).toBeInTheDocument()
    expect(screen.getByText('72/100 điểm')).toBeInTheDocument()
    expect(screen.getByText('Cần cải thiện (Gap)')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Chưa nắm vững kỹ thuật sharding và bảng phân vùng (table partitioning) cho tải lớn.'
      )
    ).toBeInTheDocument()

    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getAllByText('PostgreSQL')).toHaveLength(2)
    expect(screen.getByText('Redis')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SkillsBreakdownCard skills={mockUnifiedSkillsBreakdown} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
