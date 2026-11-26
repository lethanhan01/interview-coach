import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { BinaryCriteriaChecklist } from './BinaryCriteriaChecklist'
import { mockUnifiedCriteriaQuestion1 } from '@/test-utils/fixtures/report.fixture'

describe('BinaryCriteriaChecklist', () => {
  it('renders null when criteria list is empty or undefined', () => {
    const { rerender } = render(<BinaryCriteriaChecklist criteria={[]} />)
    expect(
      screen.queryByText('Tiêu Chí Đánh Giá Nhị Phân (Binary Criteria)')
    ).not.toBeInTheDocument()

    rerender(<BinaryCriteriaChecklist />)
    expect(
      screen.queryByText('Tiêu Chí Đánh Giá Nhị Phân (Binary Criteria)')
    ).not.toBeInTheDocument()
  })

  it('renders binary criteria with core and seniority dimensions', () => {
    render(<BinaryCriteriaChecklist criteria={mockUnifiedCriteriaQuestion1} />)

    expect(
      screen.getByText('Tiêu Chí Đánh Giá Nhị Phân (Binary Criteria)')
    ).toBeInTheDocument()

    expect(screen.getByText('Đạt 1/2 tiêu chí')).toBeInTheDocument()

    expect(screen.getByText('Cốt lõi (Core)')).toBeInTheDocument()
    expect(screen.getByText('Thâm niên (Seniority)')).toBeInTheDocument()

    expect(screen.getByText('Đạt')).toBeInTheDocument()
    expect(screen.getByText('Không đạt')).toBeInTheDocument()

    expect(
      screen.getByText(/Ứng viên phân tích đúng phương pháp EXPLAIN ANALYZE/)
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Thiếu kiến trúc phân vùng dữ liệu quy mô lớn cho Senior Level 4.'
      )
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <BinaryCriteriaChecklist criteria={mockUnifiedCriteriaQuestion1} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
