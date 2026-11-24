import { Box } from '@mantine/core'
import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { SfiaCompetencyOverview } from './SfiaCompetencyOverview'
import { mockUnifiedSkillsBreakdown } from '@/test-utils/fixtures/report.fixture'

vi.mock('next/dynamic', () => {
  const dynamicMock = () => {
    return function MockChart() {
      return <Box data-testid="sfia-charts" />
    }
  }
  return {
    default: dynamicMock,
    __esModule: true,
  }
})

describe('SfiaCompetencyOverview', () => {
  it('renders null when skills list is empty or undefined', () => {
    const { rerender } = render(<SfiaCompetencyOverview skills={[]} />)
    expect(
      screen.queryByText('Tổng Quan Năng Lực SFIA (Level 1-7)')
    ).not.toBeInTheDocument()

    rerender(<SfiaCompetencyOverview />)
    expect(
      screen.queryByText('Tổng Quan Năng Lực SFIA (Level 1-7)')
    ).not.toBeInTheDocument()
  })

  it('renders competency overview with correct title and counts', () => {
    render(<SfiaCompetencyOverview skills={mockUnifiedSkillsBreakdown} />)

    expect(
      screen.getByText('Tổng Quan Năng Lực SFIA (Level 1-7)')
    ).toBeInTheDocument()

    expect(screen.getAllByText(/Đạt chuẩn/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Cần hoàn thiện/)).toBeInTheDocument()
    expect(screen.getByText(/Có khoảng cách/)).toBeInTheDocument()
  })

  it('renders each skill with 7-segment meter and level comparison', () => {
    render(<SfiaCompetencyOverview skills={mockUnifiedSkillsBreakdown} />)

    expect(screen.getByText('PROG')).toBeInTheDocument()
    expect(screen.getByText('DBDS')).toBeInTheDocument()

    const meters = screen.getAllByRole('meter')
    expect(meters).toHaveLength(2)

    expect(meters[0]).toHaveAttribute('aria-valuenow', '4')
    expect(meters[1]).toHaveAttribute('aria-valuenow', '3')

    expect(
      screen.getByText(/Ngữ cảnh: TypeScript • Node.js • PostgreSQL/)
    ).toBeInTheDocument()
  })

  it('handles edge case when demonstratedLevel is 0 with valid ARIA meter attributes', () => {
    const zeroLevelSkills = [
      {
        ...mockUnifiedSkillsBreakdown[0],
        demonstratedLevel: 0,
        status: 'gap' as const,
      },
    ]

    render(<SfiaCompetencyOverview skills={zeroLevelSkills} />)

    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuenow', '0')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '7')

    expect(screen.getByText('Chưa thể hiện (Level 0)')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SfiaCompetencyOverview skills={mockUnifiedSkillsBreakdown} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
