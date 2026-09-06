import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BinaryCriteriaChecklist } from './BinaryCriteriaChecklist'
import { mockUnifiedCriteriaQuestion1 } from '@/tests/fixtures/report.fixture'

describe('BinaryCriteriaChecklist', () => {
  it('renders null when criteria list is empty or undefined', () => {
    const { container, rerender } = render(<BinaryCriteriaChecklist criteria={[]} />)
    expect(container.firstChild).toBeNull()

    rerender(<BinaryCriteriaChecklist />)
    expect(container.firstChild).toBeNull()
  })

  it('renders binary criteria with core and seniority dimensions', () => {
    render(<BinaryCriteriaChecklist criteria={mockUnifiedCriteriaQuestion1} />)

    expect(
      screen.getByText('Tiêu Chí Đánh Giá Nhị Phân (Binary Criteria)')
    ).toBeInTheDocument()

    // Counts: 1 passed, 2 total
    expect(screen.getByText('Đạt 1/2 tiêu chí')).toBeInTheDocument()

    // Dimensions
    expect(screen.getByText('Cốt lõi (Core)')).toBeInTheDocument()
    expect(screen.getByText('Thâm niên (Seniority)')).toBeInTheDocument()

    // Status badges
    expect(screen.getByText('Đạt')).toBeInTheDocument()
    expect(screen.getByText('Không đạt')).toBeInTheDocument()

    // Evidence
    expect(
      screen.getByText(/Ứng viên phân tích đúng phương pháp EXPLAIN ANALYZE/)
    ).toBeInTheDocument()

    // Deduction reason (for failed criterion)
    expect(
      screen.getByText('Thiếu kiến trúc phân vùng dữ liệu quy mô lớn cho Senior Level 4.')
    ).toBeInTheDocument()
  })
})
