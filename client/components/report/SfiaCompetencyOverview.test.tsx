import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SfiaCompetencyOverview } from './SfiaCompetencyOverview'
import { mockUnifiedSkillsBreakdown } from '@/tests/fixtures/report.fixture'

describe('SfiaCompetencyOverview', () => {
  it('renders null when skills list is empty or undefined', () => {
    const { container, rerender } = render(<SfiaCompetencyOverview skills={[]} />)
    expect(container.firstChild).toBeNull()

    rerender(<SfiaCompetencyOverview />)
    expect(container.firstChild).toBeNull()
  })

  it('renders competency overview with correct title and counts', () => {
    render(<SfiaCompetencyOverview skills={mockUnifiedSkillsBreakdown} />)

    expect(
      screen.getByText('Tổng Quan Năng Lực SFIA (Level 1-7)')
    ).toBeInTheDocument()

    // In mockUnifiedSkillsBreakdown, 1 passed and 1 gap
    expect(screen.getAllByText(/Đạt chuẩn/)).toHaveLength(2)
    expect(screen.getByText(/Cần hoàn thiện/)).toBeInTheDocument()
    expect(screen.getByText(/Có khoảng cách/)).toBeInTheDocument()
  })

  it('renders each skill with 7-segment meter and level comparison', () => {
    render(<SfiaCompetencyOverview skills={mockUnifiedSkillsBreakdown} />)

    // Check skill names and codes
    expect(screen.getByText('PROG')).toBeInTheDocument()
    expect(screen.getByText('DBDS')).toBeInTheDocument()

    // Check meters
    const meters = screen.getAllByRole('meter')
    expect(meters).toHaveLength(2)

    expect(meters[0]).toHaveAttribute('aria-valuenow', '4')
    expect(meters[1]).toHaveAttribute('aria-valuenow', '3')

    // Check tech context
    expect(
      screen.getByText(/Ngữ cảnh: TypeScript • Node.js • PostgreSQL/)
    ).toBeInTheDocument()
  })
})
