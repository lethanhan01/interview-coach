import { Box } from '@mantine/core'
import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { catalogService } from '@/services/catalog.service'
import { seedCatalogQuery } from '@/test-utils/fixtures/catalog.fixture'
import { mockUnifiedSkillsBreakdown } from '@/test-utils/fixtures/report.fixture'
import { SfiaCompetencyOverview } from './SfiaCompetencyOverview'

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
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders null when skills list is empty or undefined', () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const { rerender } = render(<SfiaCompetencyOverview skills={[]} />, {
      queryClient,
    })
    expect(
      screen.queryByText('Tổng Quan Năng Lực SFIA (Level 1-7)')
    ).not.toBeInTheDocument()

    rerender(<SfiaCompetencyOverview />)
    expect(
      screen.queryByText('Tổng Quan Năng Lực SFIA (Level 1-7)')
    ).not.toBeInTheDocument()
  })

  it('renders competency overview with seeded catalog SFIA level titles', () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    render(<SfiaCompetencyOverview skills={mockUnifiedSkillsBreakdown} />, {
      queryClient,
    })

    expect(
      screen.getByText('Tổng Quan Năng Lực SFIA (Level 1-7)')
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Đạt chuẩn/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Cần hoàn thiện/)).toBeInTheDocument()
    expect(screen.getByText(/Có khoảng cách/)).toBeInTheDocument()

    expect(
      screen.getAllByTitle(/Level 1: Theo dõi & Học việc/).length
    ).toBeGreaterThan(0)
  })

  it('renders each skill with 7-segment meter and level comparison', () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    render(<SfiaCompetencyOverview skills={mockUnifiedSkillsBreakdown} />, {
      queryClient,
    })

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
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const zeroLevelSkills = [
      {
        ...mockUnifiedSkillsBreakdown[0],
        demonstratedLevel: 0,
        status: 'gap' as const,
      },
    ]

    render(<SfiaCompetencyOverview skills={zeroLevelSkills} />, { queryClient })

    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuenow', '0')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '7')

    expect(screen.getByText('Chưa thể hiện (Level 0)')).toBeInTheDocument()
  })

  it('falls back to L{n} segment titles while catalog is pending', () => {
    vi.spyOn(catalogService, 'getInterviewOptions').mockImplementation(
      () => new Promise(() => {})
    )

    render(<SfiaCompetencyOverview skills={mockUnifiedSkillsBreakdown} />)

    expect(screen.getAllByTitle(/Level 1: L1/).length).toBeGreaterThan(0)
  })

  it('shows compact error alert with retry while still rendering L{n} rows when catalog fails', async () => {
    const spy = vi
      .spyOn(catalogService, 'getInterviewOptions')
      .mockRejectedValue(new Error('Catalog error'))
    const user = userEvent.setup()

    render(<SfiaCompetencyOverview skills={mockUnifiedSkillsBreakdown} />)

    await waitFor(() => {
      expect(
        screen.getByText(/Không thể tải mô tả cấp độ SFIA/)
      ).toBeInTheDocument()
    })
    expect(screen.getAllByTitle(/Level 1: L1/).length).toBeGreaterThan(0)
    expect(screen.getByText('PROG')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  it('has no accessibility violations', async () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const { container } = render(
      <SfiaCompetencyOverview skills={mockUnifiedSkillsBreakdown} />,
      { queryClient }
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
