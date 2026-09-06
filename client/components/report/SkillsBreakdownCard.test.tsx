import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SkillsBreakdownCard } from './SkillsBreakdownCard'
import { mockUnifiedSkillsBreakdown } from '@/tests/fixtures/report.fixture'

describe('SkillsBreakdownCard', () => {
  it('renders null when skills list is empty or undefined', () => {
    const { container, rerender } = render(<SkillsBreakdownCard skills={[]} />)
    expect(container.firstChild).toBeNull()

    rerender(<SkillsBreakdownCard />)
    expect(container.firstChild).toBeNull()
  })

  it('renders skill breakdown details correctly', () => {
    render(<SkillsBreakdownCard skills={mockUnifiedSkillsBreakdown} />)

    expect(
      screen.getByText('Chi Tiết Đánh Giá Từng Năng Lực (Skills Breakdown)')
    ).toBeInTheDocument()

    // Skill 1 (PROG) - Passed
    expect(screen.getByText('PROG')).toBeInTheDocument()
    expect(screen.getByText('88/100 điểm')).toBeInTheDocument()
    expect(screen.getByText('Đạt chuẩn')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Hiểu sâu về cấu trúc dữ liệu, xử lý bất đồng bộ và Clean Architecture.'
      )
    ).toBeInTheDocument()

    // Skill 2 (DBDS) - Gap
    expect(screen.getByText('DBDS')).toBeInTheDocument()
    expect(screen.getByText('72/100 điểm')).toBeInTheDocument()
    expect(screen.getByText('Cần cải thiện (Gap)')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Chưa nắm vững kỹ thuật sharding và bảng phân vùng (table partitioning) cho tải lớn.'
      )
    ).toBeInTheDocument()

    // Tech Context Chips
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getAllByText('PostgreSQL')).toHaveLength(2)
    expect(screen.getByText('Redis')).toBeInTheDocument()
  })
})
